import type {Trip,Place,Stop} from "./types";
import {validCoordinate} from "./geo";
import {DEFAULT_PREFERENCES} from "./types";
const DRAFT="trippr.draft.v1",SAVED="trippr.trips.v1",PREFS="trippr.ui.v1";
export interface TripRepository {draft():Trip|null;writeDraft(trip:Trip):void;list():Trip[];save(trip:Trip):void;remove(id:string):void;}
function read(key:string):unknown{const s=localStorage.getItem(key);if(!s)return null;try{return JSON.parse(s);}catch{throw Error("Saved data could not be read. Your stored data has been kept.");}}
function normalizePlace(p:unknown):p is Place{return !!p&&typeof p==="object"&&typeof(p as Place).id==="string"&&typeof(p as Place).name==="string"&&validCoordinate((p as Place).coordinates);}
export function validateTrip(t:unknown):Trip|null{if(!t||typeof t!=="object")return null;const x=t as Trip;if(typeof x.id!=="string"||typeof x.name!=="string"||!Array.isArray(x.stops)||x.stops.length>20||!x.stops.every(s=>normalizePlace(s)&&typeof s.stopId==="string"))return null;return{...x,name:x.name.slice(0,120),notes:typeof x.notes==="string"?x.notes.slice(0,20000):"",startDate:x.startDate||"",endDate:x.endDate||"",savedPlaces:Array.isArray(x.savedPlaces)?x.savedPlaces.filter(normalizePlace).slice(0,100):[],placeNotes:x.placeNotes&&typeof x.placeNotes==="object"?x.placeNotes:{},preferences:{...DEFAULT_PREFERENCES,...x.preferences},modifiedAt:x.modifiedAt||new Date().toISOString()};}
function readDraft(){const raw=read(DRAFT),trip=validateTrip(raw);if(raw!==null&&!trip)throw Error("The stored draft could not be read. It has been kept for recovery.");return trip;}
export const localTripRepository:TripRepository={draft:readDraft,writeDraft(t){readDraft();localStorage.setItem(DRAFT,JSON.stringify(t));},list:()=>{const data=read(SAVED);return Array.isArray(data)?data.map(validateTrip).filter((x):x is Trip=>!!x):[];},save(t){const list=this.list().filter(x=>x.id!==t.id);list.unshift(t);localStorage.setItem(SAVED,JSON.stringify(list.slice(0,50)));},remove(id){localStorage.setItem(SAVED,JSON.stringify(this.list().filter(t=>t.id!==id)));}};
export function readUI(){try{return(read(PREFS)||{})as{theme?:string;fontSize?:number};}catch{return{};}}
export function writeUI(value:unknown){try{localStorage.setItem(PREFS,JSON.stringify(value));}catch{/* Preferences must not interrupt the trip. */}}
