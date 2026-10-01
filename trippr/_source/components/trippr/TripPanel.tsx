"use client";
import {useState} from "react";
import {CalendarDays,Maximize2,PanelLeftClose,Save,Fuel,Zap,LoaderCircle,TriangleAlert,NotebookPen,RotateCcw,Check} from "lucide-react";
import type {Trip,Route} from "@/lib/trippr/types";
import {formatDrive} from "@/lib/trippr/geo";
import Odometer from "./Odometer";
export type PanelTab="route"|"detours"|"conditions";
const shortDate=(d:string)=>new Date(`${d}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"});
export function tripDays(trip:Trip){if(trip.startDate&&trip.endDate){const n=Math.round((Date.parse(trip.endDate)-Date.parse(trip.startDate))/864e5)+1;if(n>0&&n<400)return n;}const dates=new Set(trip.stops.map(s=>s.date).filter(Boolean));return dates.size||null;}
export function tripCost(trip:Trip,route:Route|null){if(!route)return null;const miles=route.distance/1609.344,p=trip.preferences;return p.evMode?miles/Math.max(.5,p.milesPerKwh)*p.kwhPrice:miles/Math.max(5,p.mpg)*p.fuelPrice;}
interface Props{trip:Trip;route:Route|null;routeLoading:boolean;routeError:string;tab:PanelTab;setTab(t:PanelTab):void;onChange(t:Trip):void;onFit():void;onCollapse?():void;onSave():void;onSettings():void;onClear():void;draftStatus:string;alertCount:number;compact?:boolean;children:React.ReactNode;}
export default function TripPanel(p:Props){const[datesOpen,setDatesOpen]=useState(false);const t=p.trip,days=tripDays(t),cost=tripCost(t,p.route),miles=p.route?p.route.distance/1609.344:null;
 const dates=t.startDate?`${shortDate(t.startDate)}${t.endDate?` – ${shortDate(t.endDate)}`:""}`:"Add dates";
 return <>
 <header className="panel-head">
  <div className="panel-eyebrow"><span className="eyebrow">Your road trip</span>{p.onCollapse&&<button className="tool" onClick={p.onCollapse} aria-label="Hide the trip panel" title="Hide panel"><PanelLeftClose/></button>}</div>
  <textarea className="trip-title display" aria-label="Trip name" rows={1} value={t.name} maxLength={120} spellCheck={false} onChange={e=>p.onChange({...t,name:e.target.value})}/>
  <button className="date-toggle" aria-expanded={datesOpen} onClick={()=>setDatesOpen(!datesOpen)}><CalendarDays/>{dates}{days?<span className="muted">⋅ {days} day{days===1?"":"s"}</span>:null}</button>
  {datesOpen&&<div className="field-pair dates-editor"><label>Leave<input type="date" value={t.startDate} max={t.endDate||undefined} onChange={e=>p.onChange({...t,startDate:e.target.value})}/></label><label>Home by<input type="date" value={t.endDate} min={t.startDate||undefined} onChange={e=>p.onChange({...t,endDate:e.target.value})}/></label></div>}
  <div className="dash" role="group" aria-label="Trip totals">
   <button className="dash-odo" onClick={p.onFit} title="Fit the whole route on the map" aria-label="Fit the whole route on the map"><Odometer value={miles} digits={5} label="Total miles"/><span className="dash-label">miles {p.routeLoading?<LoaderCircle className="spin"/>:<Maximize2/>}</span></button>
   <div className="dash-cell"><strong>{p.route?formatDrive(p.route.duration):"—"}</strong><span className="dash-label">driving</span></div>
   <button className="dash-cell" onClick={p.onSettings} title={t.preferences.evMode?"Charging estimate — set efficiency and price in Settings":"Fuel estimate — set MPG and gas price in Settings"}><strong>{cost===null?"—":`$${Math.round(cost).toLocaleString()}`}</strong><span className="dash-label">{t.preferences.evMode?<Zap/>:<Fuel/>}{t.preferences.evMode?"charging":"fuel"}</span></button>
  </div>
  {p.routeError&&<p className="note-warn" role="status"><TriangleAlert/>{p.routeError}{t.stops.length>1?" The dashed line only connects the stops.":""}</p>}
 </header>
 <div className="panel-tabs" role="tablist" aria-label="Trip sections">{([["route","Route",t.stops.length?String(t.stops.length):""],["detours","Detours",""],["conditions","Conditions",p.alertCount?String(p.alertCount):""]] as [PanelTab,string,string][]).map(([id,label,badge])=><button key={id} role="tab" id={`tab-${id}`} aria-controls={`section-${id}`} aria-selected={p.tab===id} className={p.tab===id?"active":""} onClick={()=>p.setTab(id)}>{label}{badge&&<span className={`badge ${id==="conditions"?"warn":""}`}>{badge}</span>}</button>)}</div>
 <div className="panel-body" role="tabpanel" id={`section-${p.tab}`} aria-labelledby={`tab-${p.tab}`}>{p.children}
  {p.tab==="route"&&t.stops.length>0&&<details className="trip-notes"><summary><NotebookPen/>Notes for the road</summary><textarea aria-label="Trip notes" value={t.notes} placeholder="Things to pack, people to call, a diner someone swore by…" maxLength={20000} onChange={e=>p.onChange({...t,notes:e.target.value})}/></details>}
 </div>
 <footer className="panel-foot">{(t.stops.length>0||t.notes||t.startDate)?<button className="btn btn-ghost-quiet" onClick={p.onClear} title="Remove every stop, date and note to start over. Undo is available right after."><RotateCcw/>Clear trip</button>:<span/>}<span className="draft-status" title={p.draftStatus}>{p.draftStatus.startsWith("Draft saved")&&<Check/>}{p.draftStatus.replace(" on this device","")}</span><button className="btn btn-quiet" onClick={p.onSave}><Save/>Save trip</button></footer>
 </>;
}
