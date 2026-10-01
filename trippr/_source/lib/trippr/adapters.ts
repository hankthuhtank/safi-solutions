import {GET} from "./handler";
import type {Coordinate,Route,Preferences,Weather,Place,Alert,Hazard} from "./types";
const memory=new Map<string,{data:unknown;until:number}>();
export class ProviderError extends Error {constructor(message:string,public code="unavailable"){super(message);}}
export async function api<T>(action:string,params:Record<string,string|number>={},signal?:AbortSignal):Promise<T>{const q=new URLSearchParams({action,...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))}),key=q.toString(),cached=memory.get(key);if(cached&&cached.until>Date.now())return cached.data as T;const combined=signal?AbortSignal.any([signal,AbortSignal.timeout(32000)]):AbortSignal.timeout(32000);const configured=(globalThis as unknown as {TRIPPR_CONFIG?:{apiUrl?:string}}).TRIPPR_CONFIG?.apiUrl?.trim();
 const request = configured ? (()=>{const url=new URL(configured);if(url.protocol!=="https:")throw new ProviderError("The configured data source must use HTTPS.","invalid_configuration");url.search=q.toString();return fetch(url,{signal:combined});})() : GET(new Request(`https://www.safisolutions.org/trippr/data?${q}`,{signal:combined}));
 const response=await abortable(request,combined);const data:any=await response.json();if(!response.ok)throw new ProviderError(data.error||"This source is unavailable.",data.code);if(memory.size>=100)memory.delete(memory.keys().next().value!);memory.set(key,{data,until:Date.now()+180000});return data as T;}
function abortable<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{if(signal.aborted){reject(signal.reason);return;}const onAbort=()=>reject(signal.reason);signal.addEventListener("abort",onAbort,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener("abort",onAbort));});
}
export const providers={
 routing:{get:(points:Coordinate[],p:Preferences,signal?:AbortSignal)=>api<Route>("route",{points:JSON.stringify(points),tolls:p.avoidTolls?1:0,highways:p.avoidHighways?1:0,ferries:p.avoidFerries?1:0},signal)},
 weather:{get:(p:Coordinate,signal?:AbortSignal)=>api<Weather>("weather",{lat:p[1].toFixed(3),lon:p[0].toFixed(3)},signal)},
 search:{get:(q:string,signal?:AbortSignal)=>api<{places:Place[]}>("search",{q},signal)},
 alerts:{get:(p:Coordinate,signal?:AbortSignal)=>api<{alerts:Alert[];updated:string}>("alerts",{lat:p[1].toFixed(3),lon:p[0].toFixed(3)},signal)},
 places:{viewport:(bbox:number[],kinds:string[],signal?:AbortSignal)=>api<{places:Place[];source:string;updated:string;limited:boolean}>("places",{bbox:bbox.map(n=>n.toFixed(2)).join(","),kinds:kinds.sort().join(",")},signal),corridor:(points:Coordinate[],radius:number,kinds:string[],signal?:AbortSignal)=>api<{places:Place[];source:string;updated:string;limited:boolean}>("places",{points:JSON.stringify(points.map(p=>p.map(n=>Number(n.toFixed(4))))),radius,kinds:kinds.sort().join(",")},signal)},
 hazards:{get:(type:string,bbox:number[],signal?:AbortSignal)=>api<{hazards:Hazard[];updated:string;source:string;coverage?:string}>(type,{bbox:bbox.map(n=>n.toFixed(2)).join(",")},signal)},
};
export function weatherDescription(code:number){if(code===0)return"Clear";if(code<=3)return"Cloudy";if(code<=48)return"Fog";if(code<=67)return"Rain";if(code<=77)return"Snow";if(code<=82)return"Showers";if(code<=86)return"Snow showers";return"Thunderstorms";}
export function weatherTone(code:number,temp?:number){if(temp!==undefined&&temp>=100)return"heat";if(temp!==undefined&&temp<=15)return"cold";if(code>=95)return"storm";if((code>=71&&code<=77)||(code>=85&&code<=86))return"snow";if(code>=51)return"rain";return"clear";}
export function ageLabel(value?:string){if(!value)return"Update time unavailable";const minutes=Math.floor((Date.now()-Date.parse(value))/60000);if(!Number.isFinite(minutes))return"Update time unavailable";if(minutes<2)return"Updated just now";if(minutes<60)return`Updated ${minutes} min ago`;if(minutes<1440)return`Updated ${Math.floor(minutes/60)}h ago`;return`Reference · ${new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;}
