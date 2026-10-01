import type * as GeoJSON from "geojson";
export type Coordinate = [number, number];
export type PlaceKind = "park" | "monument" | "recreation" | "statepark" | "camp" | "fuel" | "ev" | "scenic" | "waterfall" | "trail" | "historic" | "museum" | "attraction" | "food" | "cave" | "hotspring" | "land" | "city";
export interface Place {
 id:string; name:string; kind:PlaceKind; coordinates:Coordinate; region?:string; description?:string; image?:string; imageCredit?:string; website?:string;
 source:string; sourceUrl?:string; updated?:string; parkCode?:string; amenities?:Record<string,string|boolean|null>; tags?:Record<string,string>; distanceFromRoute?:number;
 fees?:{cost:string;title:string;description:string}[]; activities?:string[]; operatingInfo?:string;geometry?:GeoJSON.Polygon|GeoJSON.MultiPolygon;
}
export interface Stop extends Place {stopId:string;date?:string;departure?:string;notes?:string;overnight?:boolean;}
export interface Preferences {avoidTolls:boolean;avoidHighways:boolean;avoidFerries:boolean;evMode:boolean;range:number;chargerGap:number;connector:string;}
export interface Trip {id:string;name:string;stops:Stop[];startDate:string;endDate:string;notes:string;savedPlaces:Place[];placeNotes:Record<string,string>;preferences:Preferences;modifiedAt:string;}
export interface Route {coordinates:Coordinate[];distance:number;duration:number;legs:{distance:number;duration:number}[];source:string;updated:string;}
export interface WeatherDay {date:string;high:number;low:number;code:number;precipitation:number;}
export interface Weather {temperature:number;code:number;wind:number;days:WeatherDay[];updated:string;source:string;}
export interface Alert {id:string;title:string;severity:string;description:string;area:string;source:string;url?:string;updated?:string;coordinates?:Coordinate;geometry?:GeoJSON.Geometry|null;nearRoute?:boolean;}
export interface Layer {id:string;label:string;group:string;kind?:PlaceKind;enabled:boolean;}
export interface LayerState {status:"idle"|"loading"|"ready"|"unavailable"|"unconfigured";count?:number;message?:string;updated?:string;source?:string;}
export interface Hazard {id:string;coordinates:Coordinate;kind:"fire"|"river"|"road";title:string;detail:string;source:string;updated?:string;url?:string;severity?:string;}
export const DEFAULT_PREFERENCES:Preferences={avoidTolls:false,avoidHighways:false,avoidFerries:false,evMode:false,range:250,chargerGap:150,connector:"all"};
