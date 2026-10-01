"use client";
import {Plus,X,ChevronRight,LoaderCircle} from "lucide-react";
import type {Coordinate} from "@/lib/trippr/types";
import {SignChip} from "./icons";
export interface Peek{coordinates:Coordinate;name?:string;region?:string;distance?:number;near?:string;}
// A map click only proposes a spot: nothing moves until the person asks for more.
export default function PinPeek({peek,full,onAdd,onDetails,onClose}:{peek:Peek;full:boolean;onAdd():void;onDetails():void;onClose():void}){
 const where=peek.distance===undefined?peek.region:peek.distance<.5?"Right on your route":`${peek.distance.toFixed(peek.distance<10?1:0)} mi ${peek.near?`from ${peek.near}`:"off your route"}`;
 return <div className="pin-peek" role="dialog" aria-label={`Spot on the map: ${peek.name||"looking up"}`}>
 <div className="pin-peek-head"><SignChip kind="city" size="sm"/><strong>{peek.name||<span className="muted"><LoaderCircle className="spin" size={13}/> Naming this spot…</span>}</strong><button className="tool" onClick={onClose} aria-label="Dismiss this spot" title="Dismiss (Esc)"><X/></button></div>
 <small>{[where,peek.distance!==undefined?peek.region:undefined].filter(Boolean).join(" ⋅ ")||`${peek.coordinates[1].toFixed(3)}°, ${peek.coordinates[0].toFixed(3)}°`}</small>
 <div className="pin-peek-actions"><button className="btn btn-primary" onClick={onAdd} disabled={full}><Plus/>Add stop</button><button className="btn btn-quiet" onClick={onDetails}>Details<ChevronRight/></button></div>
 </div>;
}
