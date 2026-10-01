"use client";
import {Popover} from "radix-ui";
import {Switch} from "@/components/ui/switch";
import {Layers as LayersIcon,Plus,Minus,LocateFixed,Mountain,Navigation2,LoaderCircle} from "lucide-react";
import type {Layer,LayerState,PlaceKind} from "@/lib/trippr/types";
import type {MapTheme} from "@/lib/trippr/map-style";
import {SignChip} from "./icons";
import {GROUP_STYLE} from "@/lib/trippr/map-icons";
interface Props{mapTheme:MapTheme;setSatellite(v:boolean):void;terrain:boolean;onTerrain():void;layers:Layer[];onToggle(id:string):void;status:Record<string,LayerState>;campFilters:string[];onCampFilters(f:string[]):void;zoom:number;onZoom(d:number):void;onLocate():void;rotated:boolean;onNorth():void;compact:boolean;}
// One "Map" button holds everything about how the map looks; the rest are direct manipulation.
export default function MapControls(p:Props){const loading=Object.values(p.status).some(s=>s.status==="loading"),groups=[...new Set(p.layers.map(l=>l.group))],camp=p.layers.find(l=>l.kind==="camp")?.enabled;
 return <div className="map-controls">
 {p.rotated&&<button className="ctl" onClick={p.onNorth} aria-label="Reset the map to north up" title="North up"><Navigation2 className="compass"/></button>}
 <Popover.Root><Popover.Trigger asChild><button className="ctl ctl-label" aria-label="Map style and places shown" title="Map style and places shown">{loading?<LoaderCircle className="spin"/>:<LayersIcon/>}<span>Map</span></button></Popover.Trigger>
 <Popover.Portal><Popover.Content className="map-options" side={p.compact?"top":"left"} align="end" sideOffset={10} collisionPadding={12}>
  <div className="opt-head"><strong>Map</strong><span className="muted small">Style, terrain and what’s marked</span></div>
  <div className="style-pick" role="group" aria-label="Base map"><button aria-pressed={p.mapTheme!=="satellite"} onClick={()=>p.setSatellite(false)}><span className={`swatch swatch-atlas ${p.mapTheme==="light"?"day":""}`}/>Road atlas</button><button aria-pressed={p.mapTheme==="satellite"} onClick={()=>p.setSatellite(true)}><span className="swatch swatch-sat"/>Satellite</button></div>
  <label className="toggle-row" htmlFor="terrain-toggle"><span><Mountain size={15}/>3D terrain<small>Tilts the map to show mountains</small></span><Switch id="terrain-toggle" checked={p.terrain} onCheckedChange={p.onTerrain}/></label>
  <div className="opt-legend">{([["park","parks"],["camp","camp"],["scenic","sights"],["fuel","services"]] as const).map(([kind,g])=><span key={g}><SignChip kind={kind} size="sm"/>{GROUP_STYLE[g].label}</span>)}</div>
  {groups.map(g=><div className="opt-group" key={g}><span className="eyebrow">{g}</span><div className="chip-row">{p.layers.filter(l=>l.group===g).map(l=>{const s=p.status[l.id];return <button key={l.id} className={`chip ${l.enabled?"active":""}`} aria-pressed={l.enabled} onClick={()=>p.onToggle(l.id)} title={s?.status==="unavailable"?s.message:s?.status==="ready"&&s.count!==undefined?`${s.count} in view ⋅ ${s.source}`:undefined}><SignChip kind={l.kind as PlaceKind} size="sm"/>{l.label}{s?.status==="loading"&&<LoaderCircle className="spin"/>}</button>;})}</div>
   {g==="Camping"&&camp&&<div className="chip-row sub" role="group" aria-label="Camping filters">{[["tents","Tent sites"],["rv","RV sites"],["primitive","Primitive"]].map(([id,label])=><button key={id} className={`chip small ${p.campFilters.includes(id)?"active":""}`} aria-pressed={p.campFilters.includes(id)} onClick={()=>p.onCampFilters(p.campFilters.includes(id)?p.campFilters.filter(x=>x!==id):[...p.campFilters,id])}>{label}</button>)}</div>}
  </div>)}
  <p className="fine-print">{p.zoom<7.5?"Zoom in to load community-mapped places like campgrounds, viewpoints and fuel.":"Community-mapped places load for the area in view."} Public land shown is reference only — it doesn’t establish camping permission.</p>
 </Popover.Content></Popover.Portal></Popover.Root>
 <button className="ctl" onClick={p.onLocate} aria-label="Show my location" title="My location"><LocateFixed/></button>
 {!p.compact&&<div className="ctl-stack"><button className="ctl" onClick={()=>p.onZoom(1)} aria-label="Zoom in" title="Zoom in"><Plus/></button><button className="ctl" onClick={()=>p.onZoom(-1)} aria-label="Zoom out" title="Zoom out"><Minus/></button></div>}
 </div>;
}
