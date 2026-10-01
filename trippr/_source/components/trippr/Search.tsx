"use client";
import {useEffect,useMemo,useState} from "react";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {Command,CommandInput,CommandList,CommandGroup,CommandItem,CommandEmpty} from "@/components/ui/command";
import {REFERENCE_PLACES,CATEGORY_LABELS} from "@/lib/trippr/data";
import {providers} from "@/lib/trippr/adapters";
import type {Place} from "@/lib/trippr/types";
import {SignChip} from "./icons";
import {LoaderCircle,Plus,LocateFixed,CornerDownLeft} from "lucide-react";
const STARTERS=["grca","zion","yose","arch","glac","acad"];
export default function Search({open,onClose,onSelect,addMode,nearby,onLocate,stopCount}:{open:boolean;onClose():void;onSelect(p:Place):void;addMode:boolean;nearby:Place[];onLocate():void;stopCount:number}){
 const [query,setQuery]=useState(""),[remote,setRemote]=useState<Place[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{if(open){setQuery("");setRemote([]);setError("");}},[open]);
 const local=useMemo(()=>{const q=query.toLowerCase().trim(),seen=new Set<string>(),all=[...REFERENCE_PLACES,...nearby].filter(p=>!seen.has(p.id)&&seen.add(p.id));if(!q)return STARTERS.map(id=>all.find(p=>p.id===id)).filter((p):p is Place=>!!p);const words=q.split(/\s+/);return all.map(p=>{const hay=`${p.name} ${p.region||""} ${CATEGORY_LABELS[p.kind]}`.toLowerCase();return{p,hit:words.every(w=>hay.includes(w)),start:p.name.toLowerCase().startsWith(q)};}).filter(x=>x.hit).sort((a,b)=>Number(b.start)-Number(a.start)).slice(0,8).map(x=>x.p);},[query,nearby]);
 useEffect(()=>{if(!open||query.trim().length<3){setRemote([]);setLoading(false);return;}const controller=new AbortController();setLoading(true);setError("");const timer=setTimeout(()=>{providers.search.get(query,controller.signal).then(d=>setRemote(d.places)).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});},380);return()=>{clearTimeout(timer);controller.abort();};},[query,open]);
 const choose=(p:Place)=>{onSelect(p);onClose();};
 const towns=remote.filter(p=>!local.some(x=>x.name===p.name));
 return <Dialog open={open} onOpenChange={v=>{if(!v)onClose();}}><DialogContent className="search-dialog" showCloseButton={false}><DialogTitle className="sr-only">{addMode?"Add a trip stop":"Search places"}</DialogTitle><DialogDescription className="sr-only">Search cities, addresses, parks, landmarks, and discovered places. Choose a result to {addMode?"add it to your trip":"see it on the map"}.</DialogDescription>
 <div className="search-mode"><span className={addMode?"mode-add":"mode-find"}>{addMode?`Adding stop ${stopCount+1}`:"Find a place"}</span><span className="search-mode-hint">{addMode?"Pick a result to drop it on the route":"Pick a result to see it on the map"}</span></div>
 <Command shouldFilter={false} className="search-command"><CommandInput value={query} onValueChange={setQuery} placeholder={addMode?"Town, park, address…":"Where to? A town, park, or address"} autoFocus/><CommandList><CommandEmpty>{loading?"Searching the atlas…":query.trim().length<3?"Keep typing — three letters gets the whole country.":"Nothing found. Try a nearby town, or tap the map."}</CommandEmpty>
 {!query&&<CommandGroup heading="Start here"><CommandItem value="__locate" onSelect={()=>{onLocate();onClose();}}><span className="sign-chip sign-guide sign-md" aria-hidden="true"><LocateFixed/></span><span className="result-text"><strong>{addMode?"Start from my location":"Show my location"}</strong><small>Uses your device location once. Nothing is stored.</small></span></CommandItem></CommandGroup>}
 {towns.length>0&&<CommandGroup heading="Towns, addresses & landmarks">{towns.map(p=><CommandItem key={p.id} value={p.id} onSelect={()=>choose(p)}><SignChip kind="city"/><span className="result-text"><strong>{p.name}</strong><small>{p.region||p.source}</small></span>{addMode?<Plus className="result-go"/>:<CornerDownLeft className="result-go"/>}</CommandItem>)}</CommandGroup>}
 {local.length>0&&<CommandGroup heading={query?"Parks & places in the atlas":"Classic first stops"}>{local.map(p=><CommandItem key={p.id} value={p.id} onSelect={()=>choose(p)}><SignChip kind={p.kind}/><span className="result-text"><strong>{p.name}</strong><small>{CATEGORY_LABELS[p.kind]} ⋅ {p.region||"United States"}</small></span>{addMode?<Plus className="result-go"/>:<CornerDownLeft className="result-go"/>}</CommandItem>)}</CommandGroup>}
 </CommandList>{loading&&<div className="search-status"><LoaderCircle size={13} className="spin"/>Looking up towns and addresses</div>}{error&&<div className="search-status" role="status">{error} Parks in the atlas are still searchable.</div>}<div className="search-help"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> choose</span><span><kbd>esc</kbd> close</span></div></Command></DialogContent></Dialog>;
}
