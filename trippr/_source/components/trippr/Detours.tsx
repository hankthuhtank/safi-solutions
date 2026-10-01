"use client";
import {useState} from "react";
import {Slider} from "@/components/ui/slider";
import {LoaderCircle,Plus,Check,Route as RouteIcon,Scan,RefreshCw,ChevronDown} from "lucide-react";
import type {Place,PlaceKind,Route,Trip} from "@/lib/trippr/types";
import {CATEGORY_LABELS,SHORT_LABELS,DETOUR_KINDS,LOCAL_KINDS} from "@/lib/trippr/data";
// The kinds most road trips need come first; the rest wait behind "More".
const EVERYDAY:PlaceKind[]=["park","statepark","camp","scenic","fuel","ev","food"];
import {SignChip} from "./icons";
interface Props{trip:Trip;route:Route|null;mode:"route"|"viewport";setMode(m:"route"|"viewport"):void;corridor:number;setCorridor(n:number):void;filters:PlaceKind[];setFilters(k:PlaceKind[]):void;results:Place[];loading:boolean;progress:{done:number;total:number}|null;federalCount:number;error:string;searched:boolean;onDiscover():void;onSelect(p:Place):void;onAdd(p:Place):void;zoomedOut:boolean;}
export default function Detours(p:Props){const[more,setMore]=useState(false);
 const kinds=more||p.filters.some(k=>!EVERYDAY.includes(k))?DETOUR_KINDS:DETOUR_KINDS.filter(k=>EVERYDAY.includes(k)),hidden=DETOUR_KINDS.length-kinds.length;
 const needsNetwork=p.filters.some(k=>!LOCAL_KINDS.includes(k)),inTrip=new Set(p.trip.stops.map(s=>s.id)),shown=p.results.slice(0,80);
 return <div className="detours">
 <div className="section-intro"><h3 className="display">Worth a detour</h3><p className="muted">Pick what you’re in the mood for. Results are sorted by how far they sit from your road.</p></div>
 <div className="segmented" role="group" aria-label="Where to look"><button aria-pressed={p.mode==="route"} disabled={!p.route} onClick={()=>p.setMode("route")}><RouteIcon/>Along the route</button><button aria-pressed={p.mode==="viewport"} onClick={()=>p.setMode("viewport")}><Scan/>In this map view</button></div>
 {p.mode==="route"&&p.route&&<div className="corridor"><div className="corridor-head"><span>How far off the road</span><strong>{p.corridor} mi</strong></div><Slider aria-label="Detour distance from the route in miles" min={5} max={50} step={5} value={[p.corridor]} onValueChange={v=>p.setCorridor(v[0])}/></div>}
 <div className="chip-row" role="group" aria-label="Kinds of places">{kinds.map(k=>{const on=p.filters.includes(k);return <button key={k} aria-pressed={on} className={`chip ${on?"active":""}`} onClick={()=>p.setFilters(on?p.filters.filter(x=>x!==k):[...p.filters,k])}><SignChip kind={k} size="sm"/>{SHORT_LABELS[k]}</button>;})}{hidden>0&&<button className="chip chip-more" onClick={()=>setMore(true)} aria-label={`Show ${hidden} more kinds of places`}>More<ChevronDown/></button>}</div>
 {needsNetwork&&<button className="btn btn-primary btn-wide" onClick={p.onDiscover} disabled={p.loading||(p.mode==="viewport"&&p.zoomedOut)}>{p.loading?<LoaderCircle className="spin"/>:p.searched?<RefreshCw/>:<Scan/>}{p.loading?(p.progress&&p.progress.total>1?`Scouting the road… ${p.progress.done} of ${p.progress.total} sections`:"Scouting the road…"):p.mode==="viewport"&&p.zoomedOut?"Zoom in on the map to search this view":p.mode==="route"?(p.searched?"Search the route again":"Find more along the route"):"Search this map view"}</button>}
 {p.loading&&p.progress&&p.progress.total>1&&<div className="scout-progress" role="progressbar" aria-valuemin={0} aria-valuemax={p.progress.total} aria-valuenow={p.progress.done}><span style={{width:`${Math.max(6,p.progress.done/p.progress.total*100)}%`}}/></div>}
 {p.error&&<p className="note-warn" role="status">{p.error}</p>}
 <div className="results-head"><span>{p.results.length?`${p.results.length.toLocaleString()} place${p.results.length===1?"":"s"}`:"No places yet"}</span><span>{p.mode==="route"&&p.route?"miles off route":"in view"}</span></div>
 <ul className="result-list">{shown.map(place=>{const added=inTrip.has(place.id);return <li key={place.id} className="result"><button className="result-main" onClick={()=>p.onSelect(place)}>{place.image?<img className="result-thumb" src={place.image} alt="" loading="lazy"/>:<SignChip kind={place.kind} size="lg"/>}<span className="result-text"><strong>{place.name}</strong><small>{CATEGORY_LABELS[place.kind]}{place.region?` ⋅ ${place.region}`:""}</small></span>{place.distanceFromRoute!==undefined&&<span className="result-miles">{place.distanceFromRoute<.5?"on route":place.distanceFromRoute.toFixed(place.distanceFromRoute<10?1:0)}</span>}</button><button className={`tool add ${added?"on":""}`} disabled={added||p.trip.stops.length>=20} aria-label={added?`${place.name} is in your trip`:`Add ${place.name} to the trip`} title={added?"Already a stop":"Add to trip"} onClick={()=>p.onAdd(place)}>{added?<Check/>:<Plus/>}</button></li>;})}</ul>
 {!p.results.length&&!p.loading&&<p className="muted small">{!p.filters.length?"Choose at least one kind of place.":needsNetwork&&!p.searched?"National parks and federal campgrounds show up right away. For viewpoints, fuel, food and other campgrounds, run a search — they come from community mapping and fill in section by section.":"Nothing mapped here for these choices. Widen the distance or try another kind of place."}</p>}
 {p.results.length>shown.length&&<p className="muted small">Showing the closest {shown.length}. Narrow the distance to see others.</p>}
 <p className="fine-print">{p.federalCount>0&&p.filters.includes("camp")?`Includes ${p.federalCount.toLocaleString()} federal campgrounds from Recreation.gov. `:""}Distances are straight-line miles from the route, not extra driving. Community mapping coverage varies by area.</p>
 </div>;
}
