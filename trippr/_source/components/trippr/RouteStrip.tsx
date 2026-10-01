"use client";
import {useRef,useState} from "react";
import {GripVertical,Plus,ChevronDown,ChevronUp,Trash2,Moon,PencilLine,Search as SearchIcon,Coffee,LocateFixed} from "lucide-react";
import type {Trip,Stop,Route,Weather} from "@/lib/trippr/types";
import {CATEGORY_LABELS} from "@/lib/trippr/data";
import {formatMiles,formatDrive} from "@/lib/trippr/geo";
import {weatherDescription} from "@/lib/trippr/adapters";
import {SignChip,WeatherIcon} from "./icons";
const LONG_DAY=8*3600;
export const shortName=(name:string)=>name.replace(/ National Park( & Preserve)?$/,"").trim();
export const dateLabel=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
interface Props{trip:Trip;route:Route|null;routeLoading:boolean;weather:Record<string,Weather>;onChange(t:Trip):void;onSelect(s:Stop):void;onReorder(from:number,to:number):void;onAdd():void;onBreak(leg:number):void;onSample():void;onLocate():void;}
// The itinerary is drawn as a TripTik strip: a two-lane road with stops along it.
export default function RouteStrip(p:Props){const[editing,setEditing]=useState<string|null>(null),[dragTarget,setDragTarget]=useState<number|null>(null);const dragFrom=useRef<number|null>(null);
 const updateStop=(id:string,part:Partial<Stop>)=>p.onChange({...p.trip,stops:p.trip.stops.map(s=>s.stopId===id?{...s,...part}:s)});
 const remove=(id:string)=>{setEditing(null);p.onChange({...p.trip,stops:p.trip.stops.filter(s=>s.stopId!==id)});};
 if(!p.trip.stops.length)return <div className="empty-road"><p className="eyebrow">Mile zero</p><h2 className="display">Where are<br/>we going?</h2><p className="muted">Search for a town or park, or tap anywhere on the map. Add two stops and Trippr draws the drive between them.</p><button className="btn btn-primary btn-wide" onClick={p.onAdd}><SearchIcon/>Choose a first stop</button><div className="empty-alt"><button className="btn btn-quiet" onClick={p.onLocate}><LocateFixed/>Start from my location</button><button className="btn btn-quiet" onClick={p.onSample}>Try a sample trip</button></div></div>;
 return <div className="strip" data-dragging={dragTarget!==null||undefined}>
 <ol className="strip-list">{p.trip.stops.map((s,i)=>{const w=p.weather[s.id],day=s.date?w?.days.find(d=>d.date===s.date):undefined,leg=p.route?.legs[i],next=p.trip.stops[i+1],open=editing===s.stopId,last=i===p.trip.stops.length-1;
 return <li key={s.stopId} className={`strip-stop ${dragTarget===i?"drag-target":""} ${open?"open":""}`} data-stop-index={i}>
 <div className="stop-line">
  <span className={`mile-marker ${i===0?"first":last?"last":""}`} aria-hidden="true">{i+1}</span>
  <div className="stop-body">
   <button className="stop-name" onClick={()=>p.onSelect(s)}><span>{shortName(s.name)}</span></button>
   <div className="stop-meta">
    <SignChip kind={s.kind} size="sm"/><span>{s.overnight?"Overnight ⋅ ":""}{s.kind==="city"?s.region||"Destination":`${CATEGORY_LABELS[s.kind]}${s.region?` ⋅ ${s.region}`:""}`}</span>
    {s.date&&<span className="meta-date">{dateLabel(s.date)}</span>}
    {w&&<span className="meta-weather" title={`${weatherDescription(day?.code??w.code)}${day?` forecast for ${s.date}`:" ⋅ current conditions"}`}><WeatherIcon code={day?.code??w.code} size={14}/>{Math.round(day?.high??w.temperature)}°</span>}
   </div>
  </div>
  <div className="stop-tools">
   <button className="tool drag" aria-label={`Drag ${s.name} to reorder`} title="Drag to reorder" onPointerDown={e=>{dragFrom.current=i;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(dragFrom.current===null)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-stop-index]");if(el)setDragTarget(Number(el.getAttribute("data-stop-index")));}} onPointerUp={e=>{if(dragFrom.current!==null&&dragTarget!==null)p.onReorder(dragFrom.current,dragTarget);dragFrom.current=null;setDragTarget(null);e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{dragFrom.current=null;setDragTarget(null);}}><GripVertical/></button>
   <button className={`tool ${open?"on":""}`} aria-expanded={open} aria-label={`Edit ${s.name}`} title="Dates, notes and order" onClick={()=>setEditing(open?null:s.stopId)}><PencilLine/></button>
  </div>
 </div>
 {open&&<div className="stop-editor">
  <div className="field-pair"><label>Arrive<input type="date" value={s.date||""} min={p.trip.startDate||undefined} max={p.trip.endDate||undefined} onChange={e=>updateStop(s.stopId,{date:e.target.value})}/></label><label>Leave<input type="date" value={s.departure||""} min={s.date||undefined} onChange={e=>updateStop(s.stopId,{departure:e.target.value})}/></label></div>
  <textarea aria-label={`Notes for ${s.name}`} placeholder="Reservation number, gate code, breakfast spot…" value={s.notes||""} maxLength={5000} onChange={e=>updateStop(s.stopId,{notes:e.target.value})}/>
  <div className="editor-actions"><button className={`chip ${s.overnight?"active":""}`} aria-pressed={!!s.overnight} onClick={()=>updateStop(s.stopId,{overnight:!s.overnight})}><Moon/>Overnight</button><span className="spacer"/><button className="tool" disabled={i===0} aria-label={`Move ${s.name} earlier`} title="Move earlier" onClick={()=>p.onReorder(i,i-1)}><ChevronUp/></button><button className="tool" disabled={last} aria-label={`Move ${s.name} later`} title="Move later" onClick={()=>p.onReorder(i,i+1)}><ChevronDown/></button><button className="tool danger" aria-label={`Remove ${s.name}`} title="Remove stop" onClick={()=>remove(s.stopId)}><Trash2/></button></div>
 </div>}
 {s.notes&&!open&&<p className="stop-note">{s.notes}</p>}
 {next&&<div className={`leg ${leg&&leg.duration>LONG_DAY?"long":""}`}>{leg?<><span className="leg-sign"><b>{formatMiles(leg.distance)}</b> mi</span><span className="leg-time">{formatDrive(leg.duration)}</span>{leg.duration>LONG_DAY&&<button className="leg-break" onClick={()=>p.onBreak(i)} title="Find camping, food and viewpoints near the halfway point"><Coffee/>Find a break</button>}</>:<span className="leg-time">{p.routeLoading?"Measuring the road…":"—"}</span>}</div>}
 </li>;})}</ol>
 <button className="add-stop" onClick={p.onAdd} disabled={p.trip.stops.length>=20}><span className="mile-marker ghost" aria-hidden="true"><Plus/></span>{p.trip.stops.length>=20?"20-stop routing limit reached":p.trip.stops.length===1?"Add a second stop to draw the route":"Add a stop"}</button>
 </div>;
}
