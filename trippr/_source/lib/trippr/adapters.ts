import {createTripprHandler} from "./handler";
import type {Coordinate,Route,Preferences,Weather,Place,Alert,Hazard,Air,WikiPage} from "./types";
const memory=new Map<string,{data:unknown;until:number}>();
// Free, rate-limited keys for providers that accept browser calls may sit in config.js under publicKeys.
// They are public by nature; secret-only sources (FIRMS, state road feeds) still need the optional backend.
export const BROWSER_KEYS=["NPS_API_KEY","NREL_API_KEY","AIRNOW_API_KEY","OPENROUTESERVICE_API_KEY","GEOAPIFY_API_KEY","RIDB_API_KEY"];
let local:ReturnType<typeof createTripprHandler>|undefined;
function browserHandler(){if(!local){const keys:Record<string,unknown>=(globalThis as unknown as {TRIPPR_CONFIG?:{publicKeys?:Record<string,unknown>}}).TRIPPR_CONFIG?.publicKeys||{};local=createTripprHandler(Object.fromEntries(BROWSER_KEYS.flatMap(k=>typeof keys[k]==="string"&&(keys[k] as string).trim()?[[k,(keys[k] as string).trim()]]:[])));}return local;}
export class ProviderError extends Error {constructor(message:string,public code="unavailable"){super(message);}}
// Place searches may fall back across several Overpass mirrors, so they get a longer budget.
const TIMEOUTS:Record<string,number>={places:80000,river:45000,fire:40000};
export async function api<T>(action:string,params:Record<string,string|number>={},signal?:AbortSignal):Promise<T>{const q=new URLSearchParams({action,...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))}),key=q.toString(),cached=memory.get(key);if(cached&&cached.until>Date.now())return cached.data as T;const limit=AbortSignal.timeout(TIMEOUTS[action]||32000),combined=signal?AbortSignal.any([signal,limit]):limit;const configured=(globalThis as unknown as {TRIPPR_CONFIG?:{apiUrl?:string}}).TRIPPR_CONFIG?.apiUrl?.trim();
 const request = configured ? (()=>{const url=new URL(configured);if(url.protocol!=="https:")throw new ProviderError("The configured data source must use HTTPS.","invalid_configuration");url.search=q.toString();return fetch(url,{signal:combined});})() : browserHandler()(new Request(`https://www.safisolutions.org/trippr/data?${q}`,{signal:combined}));
 const response=await abortable(request,combined).catch(e=>{if(signal?.aborted)throw e;throw new ProviderError(limit.aborted?"This source took too long to answer. Try again shortly.":"This source is temporarily unavailable.");});const data:any=await response.json();if(!response.ok)throw new ProviderError(data.error||"This source is unavailable.",data.code);if(memory.size>=100)memory.delete(memory.keys().next().value!);memory.set(key,{data,until:Date.now()+180000});return data as T;}
function abortable<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{if(signal.aborted){reject(signal.reason);return;}const onAbort=()=>reject(signal.reason);signal.addEventListener("abort",onAbort,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener("abort",onAbort));});
}
const at=(p:Coordinate)=>({lat:p[1].toFixed(3),lon:p[0].toFixed(3)});
const line=(points:Coordinate[])=>JSON.stringify(points.map(p=>p.map(n=>Number(n.toFixed(3)))));
export type ConditionLayer="fire"|"river"|"roads";
export interface PlaceResult{places:Place[];source:string;updated:string;limited:boolean;partial?:boolean;}
export interface Capabilities{routing:string;parks:boolean;roads:boolean;firms:boolean;ridb:boolean;nrel:boolean;airnow:boolean;}
export const providers={
 routing:{get:(points:Coordinate[],p:Preferences,signal?:AbortSignal)=>api<Route>("route",{points:JSON.stringify(points),tolls:p.avoidTolls?1:0,highways:p.avoidHighways?1:0,ferries:p.avoidFerries?1:0},signal)},
 weather:{get:(p:Coordinate,signal?:AbortSignal)=>api<Weather>("weather",at(p),signal)},
 air:{get:(p:Coordinate,signal?:AbortSignal)=>api<Air>("air",at(p),signal)},
 search:{get:(q:string,signal?:AbortSignal)=>api<{places:Place[]}>("search",{q},signal)},
 reverse:{get:(p:Coordinate,signal?:AbortSignal)=>api<{name:string;region:string;source:string}>("reverse",{lat:p[1].toFixed(4),lon:p[0].toFixed(4)},signal)},
 wiki:{get:(p:Coordinate,signal?:AbortSignal)=>api<{pages:WikiPage[];source:string}>("wiki",{...at(p),radius:10000},signal)},
 alerts:{get:(p:Coordinate,signal?:AbortSignal)=>api<{alerts:Alert[];updated:string}>("alerts",at(p),signal)},
 places:{viewport:(bbox:number[],kinds:string[],signal?:AbortSignal)=>api<PlaceResult>("places",{bbox:bbox.map(n=>n.toFixed(2)).join(","),kinds:[...kinds].sort().join(",")},signal),corridor:(points:Coordinate[],radius:number,kinds:string[],mirror=0,signal?:AbortSignal)=>api<PlaceResult>("places",{points:JSON.stringify(points.map(p=>p.map(n=>Number(n.toFixed(4))))),radius,kinds:[...kinds].sort().join(","),mirror},signal)},
 conditions:{route:(type:ConditionLayer,points:Coordinate[],radius:number,signal?:AbortSignal)=>api<{hazards:Hazard[];updated:string;source:string;coverage?:string}>(type,{points:line(points),radius},signal),area:(type:ConditionLayer,bbox:number[],signal?:AbortSignal)=>api<{hazards:Hazard[];updated:string;source:string;coverage?:string}>(type,{bbox:bbox.map(n=>n.toFixed(2)).join(",")},signal)},
 capabilities:{get:()=>api<Capabilities>("capabilities")},
};
export function weatherDescription(code:number){if(code===0)return"Clear";if(code===1)return"Mostly clear";if(code===2)return"Partly cloudy";if(code===3)return"Overcast";if(code<=48)return"Fog";if(code<=57)return"Drizzle";if(code<=67)return"Rain";if(code<=77)return"Snow";if(code<=82)return"Showers";if(code<=86)return"Snow showers";return"Thunderstorms";}
export function weatherTone(code:number,temp?:number){if(temp!==undefined&&temp>=100)return"heat";if(temp!==undefined&&temp<=15)return"cold";if(code>=95)return"storm";if((code>=71&&code<=77)||(code>=85&&code<=86))return"snow";if(code>=51)return"rain";return"clear";}
export function aqiTone(aqi:number){return aqi<=50?"good":aqi<=100?"moderate":aqi<=150?"sensitive":"unhealthy";}
export function ageLabel(value?:string){if(!value)return"Update time unavailable";const minutes=Math.floor((Date.now()-Date.parse(value))/60000);if(!Number.isFinite(minutes))return"Update time unavailable";if(minutes<2)return"Updated just now";if(minutes<60)return`Updated ${minutes} min ago`;if(minutes<1440)return`Updated ${Math.floor(minutes/60)}h ago`;return`Reference ⋅ ${new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;}
