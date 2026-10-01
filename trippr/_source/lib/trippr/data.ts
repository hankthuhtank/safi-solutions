import {newId} from "./geo";
import parks from "./parks.json";
import campgrounds from "./campgrounds.json";
import type {Place,Trip,Layer,PlaceKind} from "./types";
import {DEFAULT_PREFERENCES} from "./types";
export const CATEGORY_LABELS:Record<PlaceKind,string>={park:"National park",monument:"National monument",recreation:"Recreation area",statepark:"State park",camp:"Campground",fuel:"Fuel station",ev:"EV charging",scenic:"Viewpoint",waterfall:"Waterfall",trail:"Trailhead",historic:"Historic place",museum:"Museum",attraction:"Attraction",food:"Food",cave:"Cave",hotspring:"Hot spring",land:"Public land",city:"Destination"};
export const SHORT_LABELS:Record<PlaceKind,string>={park:"National parks",monument:"Monuments",recreation:"Recreation areas",statepark:"State parks",camp:"Camping",fuel:"Fuel",ev:"EV charging",scenic:"Viewpoints",waterfall:"Waterfalls",trail:"Trailheads",historic:"Historic sites",museum:"Museums",attraction:"Attractions",food:"Food",cave:"Caves",hotspring:"Hot springs",land:"Public lands",city:"Destinations"};
// Road-sign color families: guide green, recreation brown, motorist-service blue.
export type SignFamily="guide"|"recreation"|"service";
export const signFamily=(kind:PlaceKind):SignFamily=>kind==="city"?"guide":["fuel","ev","food"].includes(kind)?"service":"recreation";
export const REFERENCE_PLACES:Place[]=[...(parks as Place[]),...(campgrounds as unknown as Place[]),{id:"paris-tx",name:"Paris, Texas",coordinates:[-95.5555,33.6609],kind:"city",region:"TX",source:"Reference location"},{id:"santa-fe",name:"Santa Fe, New Mexico",coordinates:[-105.9378,35.6870],kind:"city",region:"NM",source:"Reference location",description:"An adobe city in the high desert, with art, architecture, and a good reason to stay another night."}];
// Long park descriptions, fees and hours load only when a park is opened.
let details:Promise<Record<string,Partial<Place>>>|undefined;
export function parkDetails(id:string):Promise<Partial<Place>>{details||=import("./park-details.json").then(m=>m.default as Record<string,Partial<Place>>);return details.then(all=>all[id]||{}).catch(()=>{details=undefined;return{};});}
function futureDate(days:number){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
const DEMO={name:"The long way west",ids:["paris-tx","santa-fe","grca","zion","deva","yose"],notes:"Take the scenic way. Leave room for an unplanned stop."};
export function createDemoTrip():Trip{return{id:newId(),name:DEMO.name,stops:DEMO.ids.map((id,i)=>({...REFERENCE_PLACES.find(p=>p.id===id)!,stopId:newId(),date:futureDate(3+i*3)})),startDate:futureDate(3),endDate:futureDate(20),notes:DEMO.notes,savedPlaces:[],placeNotes:{},preferences:{...DEFAULT_PREFERENCES},modifiedAt:new Date().toISOString()};}
// Earlier versions opened every visitor on the sample trip; an unedited copy of it is not theirs to keep.
export function isUntouchedDemo(t:Trip){return t.name===DEMO.name&&t.notes===DEMO.notes&&t.stops.map(s=>s.id).join()===DEMO.ids.join()&&t.stops.every(s=>!s.notes&&!s.overnight&&!s.departure)&&!t.savedPlaces.length&&!Object.values(t.placeNotes).some(Boolean);}
export function createEmptyTrip():Trip{return{id:newId(),name:"An open road",stops:[],startDate:"",endDate:"",notes:"",savedPlaces:[],placeNotes:{},preferences:{...DEFAULT_PREFERENCES},modifiedAt:new Date().toISOString()};}
const layer=(kind:PlaceKind,group:string,enabled=false):Layer=>({id:kind,label:SHORT_LABELS[kind],group,kind,enabled});
export const INITIAL_LAYERS:Layer[]=[layer("park","Parks & public lands",true),layer("monument","Parks & public lands"),layer("recreation","Parks & public lands"),layer("statepark","Parks & public lands"),layer("land","Parks & public lands"),layer("camp","Camping",true),layer("scenic","Along the road"),layer("trail","Along the road"),layer("waterfall","Along the road"),layer("historic","Along the road"),layer("museum","Along the road"),layer("attraction","Along the road"),layer("cave","Along the road"),layer("hotspring","Along the road"),layer("fuel","Services"),layer("ev","Services"),layer("food","Services")];
// Kinds that live entirely in the bundled NPS reference data and need no network search.
export const LOCAL_KINDS:PlaceKind[]=["park","city"];
export const DETOUR_KINDS:PlaceKind[]=["park","statepark","camp","scenic","trail","waterfall","historic","museum","attraction","hotspring","fuel","ev","food"];
