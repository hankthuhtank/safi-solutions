"use client";
import {Switch} from "@/components/ui/switch";
import {LoaderCircle,RefreshCw,ExternalLink,Sunset,Flame,Waves,Construction,CloudAlert,ShieldCheck,Wind} from "lucide-react";
import type {Trip,Weather,Alert,Hazard,Air} from "@/lib/trippr/types";
import {weatherDescription,aqiTone,ageLabel} from "@/lib/trippr/adapters";
import {safeUrl} from "@/lib/trippr/geo";
import {WeatherIcon,WarningDiamond} from "./icons";
import {shortName,dateLabel} from "./RouteStrip";
export type Overlay="weather"|"alerts"|"fire"|"river"|"roads";
export type SourceStatus={status:"loading"|"ready"|"unavailable"|"unconfigured";message?:string;source?:string;updated?:string};
export interface ConditionsState{checkedAt:string;loading:boolean;alerts:Alert[];hazards:Record<"fire"|"river"|"roads",Hazard[]>;air:Record<string,Air>;sources:Record<string,SourceStatus>;}
export const EMPTY_CONDITIONS:ConditionsState={checkedAt:"",loading:false,alerts:[],hazards:{fire:[],river:[],roads:[]},air:{},sources:{}};
const time=(iso?:string)=>iso?new Date(iso).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):"";
const SOURCE_LABELS:Record<string,string>={alerts:"Weather alerts ⋅ NWS",fire:"Wildfires ⋅ NIFC",river:"River gauges ⋅ NOAA",roads:"Road work ⋅ state feeds",air:"Air quality ⋅ Open-Meteo",parks:"Park notices ⋅ NPS"};
interface Props{trip:Trip;weather:Record<string,Weather>;state:ConditionsState;overlays:Record<Overlay,boolean>;setOverlay(o:Overlay,v:boolean):void;onCheck():void;onHazard(h:Hazard):void;onAlert(a:Alert):void;roadsAvailable:boolean;hasRoute:boolean;}
export default function Conditions(p:Props){const s=p.state,severe=s.alerts.filter(a=>["Severe","Extreme"].includes(a.severity)),fires=s.hazards.fire,rivers=s.hazards.river,roads=s.hazards.roads,issues=s.alerts.length+fires.length+rivers.length+roads.length;
 if(!p.trip.stops.length)return <div className="section-intro"><h3 className="display">The road ahead</h3><p className="muted">Add stops and Trippr checks forecasts, weather alerts, wildfires and river flooding along the way.</p></div>;
 return <div className="conditions">
 <div className="section-intro row"><div><h3 className="display">The road ahead</h3><p className="muted small">{s.loading?"Checking every source along your route…":s.checkedAt?`Checked ${time(s.checkedAt)} ⋅ ${p.hasRoute?"along the whole route":"around your stops"}`:"Not checked yet."}</p></div><button className="tool" onClick={p.onCheck} disabled={s.loading} aria-label="Check conditions again" title="Check again">{s.loading?<LoaderCircle className="spin"/>:<RefreshCw/>}</button></div>
 {s.checkedAt&&!s.loading&&<div className="road-report">{issues===0?<div className="report-clear"><ShieldCheck/><span><strong>No active alerts found</strong><small>Sources checked below. Conditions change — check again before you leave.</small></span></div>:<div className="report-signs">
  {s.alerts.length>0&&<div className="report-sign"><WarningDiamond tone={severe.length?"red":"yellow"}><CloudAlert/></WarningDiamond><span><strong>{s.alerts.length}</strong>weather alert{s.alerts.length===1?"":"s"}</span></div>}
  {fires.length>0&&<div className="report-sign"><WarningDiamond tone="orange"><Flame/></WarningDiamond><span><strong>{fires.length}</strong>wildfire{fires.length===1?"":"s"} nearby</span></div>}
  {rivers.length>0&&<div className="report-sign"><WarningDiamond><Waves/></WarningDiamond><span><strong>{rivers.length}</strong>river{rivers.length===1?"":"s"} running high</span></div>}
  {roads.length>0&&<div className="report-sign"><WarningDiamond tone="orange"><Construction/></WarningDiamond><span><strong>{roads.length}</strong>work zone{roads.length===1?"":"s"}</span></div>}
 </div>}</div>}
 <h4 className="sub-head">Forecast at each stop</h4>
 <ul className="sky-list">{p.trip.stops.map(stop=>{const w=p.weather[stop.id],day=stop.date?w?.days.find(d=>d.date===stop.date):undefined,air=s.air[stop.id],today=w?.days[0];return <li key={stop.stopId} className="sky">
  <div className="sky-place"><strong>{shortName(stop.name)}</strong><small>{!w?(stop.date?dateLabel(stop.date):"No date set"):stop.date?day?dateLabel(stop.date):`${dateLabel(stop.date)} ⋅ past the 14-day forecast, showing today`:"No date set ⋅ showing today"}</small></div>
  {w?<div className="sky-now"><WeatherIcon code={day?day.code:w.code} size={22}/><span className="sky-temp">{Math.round(day?day.high:w.temperature)}°{day&&<small>/{Math.round(day.low)}°</small>}</span><span className="sky-desc">{weatherDescription(day?day.code:w.code)}{day&&day.precipitation!==null?` ⋅ ${day.precipitation}% rain`:!day?` ⋅ wind ${Math.round(w.wind)} mph`:""}</span></div>:<div className="sky-now muted small">Forecast unavailable here</div>}
  <div className="sky-extra">{(day||today)?.sunset&&<span><Sunset size={13}/>Sunset {time((day||today)!.sunset)}</span>}{air&&<span className={`aqi aqi-${aqiTone(air.aqi)}`} title={`${air.category||""} ⋅ ${air.source}`}><Wind size={13}/>AQI {Math.round(air.aqi)}</span>}</div>
 </li>;})}</ul>
 {s.alerts.length>0&&<><h4 className="sub-head">Weather alerts</h4>{s.alerts.map(a=><article key={a.id} className={`alert-card ${["Severe","Extreme"].includes(a.severity)?"severe":""}`}><button className="alert-head" onClick={()=>p.onAlert(a)}><WarningDiamond tone={["Severe","Extreme"].includes(a.severity)?"red":"yellow"}><CloudAlert/></WarningDiamond><span><strong>{a.title}</strong><small>{a.severity} ⋅ {a.area.split(";").slice(0,3).join(";")}</small></span></button><details><summary>Read the alert</summary><p>{a.description}</p>{safeUrl(a.url)&&<a className="link" href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">{a.source} <ExternalLink size={12}/></a>}</details></article>)}</>}
 {fires.length>0&&<HazardList title="Wildfires near the route" items={fires} onPick={p.onHazard} icon={<Flame/>} tone="orange"/>}
 {rivers.length>0&&<HazardList title="Rivers at or above action stage" items={rivers} onPick={p.onHazard} icon={<Waves/>} tone="yellow"/>}
 {roads.length>0&&<HazardList title="Road work" items={roads} onPick={p.onHazard} icon={<Construction/>} tone="orange"/>}
 <h4 className="sub-head">Show on the map</h4>
 <div className="toggle-list">{([["weather","Temperatures at stops"],["alerts","Alert areas"],["fire","Wildfire locations"],["river","High-water river gauges"],...(p.roadsAvailable?[["roads","Road work"]]:[])] as [Overlay,string][]).map(([key,label])=><label key={key} className="toggle-row" htmlFor={`overlay-${key}`}><span>{label}</span><Switch id={`overlay-${key}`} checked={p.overlays[key]} onCheckedChange={v=>p.setOverlay(key,v)}/></label>)}</div>
 {Object.keys(s.sources).length>0&&<details className="sources"><summary>Sources & coverage</summary><ul>{Object.entries(s.sources).map(([key,v])=><li key={key}><span>{SOURCE_LABELS[key]||key}</span><small className={v.status==="ready"?"ok":v.status==="loading"?"":"warn"}>{v.status==="loading"?"Checking…":v.status==="ready"?(v.message||ageLabel(v.updated||s.checkedAt)):v.message||"Unavailable right now"}</small></li>)}</ul><p className="fine-print">Alerts describe current conditions, not a forecast for your travel dates. A missing marker never means a road is open or an area is safe.</p></details>}
 </div>;
}
function HazardList({title,items,onPick,icon,tone}:{title:string;items:Hazard[];onPick(h:Hazard):void;icon:React.ReactNode;tone:"yellow"|"orange"}){return <><h4 className="sub-head">{title}</h4><ul className="hazard-list">{items.slice(0,12).map(h=><li key={h.id}><button onClick={()=>onPick(h)}><WarningDiamond tone={tone}>{icon}</WarningDiamond><span><strong>{h.title}</strong><small>{h.detail}</small></span>{h.distance!==undefined&&<span className="result-miles">{h.distance.toFixed(h.distance<10?1:0)}<small>mi</small></span>}</button></li>)}</ul>{items.length>12&&<p className="muted small">{items.length-12} more on the map.</p>}</>;}
