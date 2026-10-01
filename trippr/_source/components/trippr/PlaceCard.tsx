"use client";
import {useEffect,useState} from "react";
import {Plus,Bookmark,BookmarkCheck,ExternalLink,Tent,LoaderCircle,Wind,Navigation,X,Fuel,Utensils,Sunset,Check,BookOpen,ArrowLeft} from "lucide-react";
import type {Place,Trip,Route,Weather,Alert,Air,WikiPage} from "@/lib/trippr/types";
import {CATEGORY_LABELS,REFERENCE_PLACES,parkDetails} from "@/lib/trippr/data";
import {providers,api,weatherDescription,ageLabel,aqiTone} from "@/lib/trippr/adapters";
import {distanceToRoute,milesBetween,safeUrl} from "@/lib/trippr/geo";
import {placeDirectionsUrl} from "@/lib/trippr/share";
import {SignChip,WeatherIcon} from "./icons";
import {shortName} from "./RouteStrip";
const campAmenities=["Tents","RV / caravan","Restrooms","Drinking water","Showers","Electricity","Dump station","Reservations","Elevation"];
const time=(iso?:string)=>iso?new Date(iso).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):"";
export function WeatherDisplay({weather,date}:{weather:Weather;date?:string}){const day=date?weather.days.find(d=>d.date===date):undefined,today=weather.days[0];return <><div className="weather-now"><WeatherIcon code={day?.code??weather.code} size={30}/><div><strong>{Math.round(day?.high??weather.temperature)}°</strong><span>{weatherDescription(day?.code??weather.code)}{day?` ⋅ forecast for ${new Date(date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}`:" ⋅ right now"}</span><small>{day?`Low ${Math.round(day.low)}°${day.precipitation!==null?` ⋅ ${day.precipitation}% chance of rain`:""}`:`Wind ${Math.round(weather.wind)} mph`}{(day||today)?.sunset?` ⋅ sunset ${time((day||today)!.sunset)}`:""}</small></div></div>{date&&!day&&<p className="fine-print">Your date is beyond the 14-day forecast, so today’s conditions are shown.</p>}<div className="forecast">{weather.days.slice(0,6).map(d=><div className="forecast-day" key={d.date}><span>{new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"})}</span><WeatherIcon code={d.code} size={18}/><strong>{Math.round(d.high)}°</strong><small>{Math.round(d.low)}°</small></div>)}</div><p className="fine-print">{weather.source} ⋅ {ageLabel(weather.updated)}</p></>;}
interface ParkLive{alerts:Alert[];campgrounds:Place[];visitorCenters:{name:string;description:string;url?:string}[];partial:boolean;updated:string;}
interface Props{place:Place;trip:Trip;route:Route|null;liveParks:boolean;onClose():void;back?:boolean;onAdd(p:Place,overnight?:boolean):void;onSave(p:Place):void;onNote(id:string,text:string):void;onNearby(p:Place,kind:"camp"|"fuel"|"food"):void;onSelect(p:Place):void;}
export default function PlaceCard({place:p,trip,route,liveParks,onClose,back,onAdd,onSave,onNote,onNearby,onSelect}:Props){
 const[weather,setWeather]=useState<Weather|null>(null),[weatherError,setWeatherError]=useState(""),[air,setAir]=useState<Air|null>(null),[park,setPark]=useState<ParkLive|null>(null),[details,setDetails]=useState<Partial<Place>>({}),[wiki,setWiki]=useState<WikiPage[]|null>(null),[name,setName]=useState(p.name),[region,setRegion]=useState(p.region);
 const pin=p.id.startsWith("pin-");
 useEffect(()=>{setWeather(null);setWeatherError("");setAir(null);setPark(null);setDetails({});setWiki(null);setName(p.name);setRegion(p.region);const ac=new AbortController();
  providers.weather.get(p.coordinates,ac.signal).then(setWeather).catch(e=>{if(!ac.signal.aborted)setWeatherError(e.message);});
  providers.air.get(p.coordinates,ac.signal).then(setAir).catch(()=>{});
  providers.wiki.get(p.coordinates,ac.signal).then(d=>{if(!ac.signal.aborted)setWiki(d.pages);}).catch(()=>{if(!ac.signal.aborted)setWiki([]);});
  if(pin)providers.reverse.get(p.coordinates,ac.signal).then(r=>{if(!ac.signal.aborted){setName(r.name);setRegion(r.region);}}).catch(()=>{if(!ac.signal.aborted)setName("A spot on the map");});
  if(p.parkCode){void parkDetails(p.id).then(d=>{if(!ac.signal.aborted)setDetails(d);});if(liveParks)api<ParkLive>("park",{park:p.parkCode},ac.signal).then(setPark).catch(()=>{});}
  return()=>ac.abort();},[p.id]);
 const full={...p,...details,name,region},image=p.image,parkCamps=p.parkCode?[...new Map([...(park?.campgrounds||[]),...REFERENCE_PLACES.filter(c=>c.kind==="camp"&&c.parkCode===p.parkCode)].map(c=>[c.id,c])).values()]:[];
 const isSaved=trip.savedPlaces.some(s=>s.id===p.id),stopIndex=trip.stops.findIndex(s=>s.id===p.id),distance=route?distanceToRoute(p.coordinates,route.coordinates):undefined,nearest=trip.stops.length?trip.stops.reduce((best,s)=>{const d=milesBetween(s.coordinates,p.coordinates);return d<best.d?{d,s}:best;},{d:Infinity,s:trip.stops[0]}):undefined;
 const url=safeUrl(full.website),sourceUrl=safeUrl(full.sourceUrl),amenities={...full.amenities};
 const match=wiki?.find(w=>{const a=w.title.toLowerCase(),b=name.toLowerCase().replace(/^near /,"");return a===b||a.startsWith(b+",")||a.startsWith(b+" (")||b.startsWith(a);}),description=full.description||match?.extract,nearbyWiki=(wiki||[]).filter(w=>w!==match).slice(0,4);
 return <article className="place-card" aria-label={`${name} details`}>
 <div className={`place-hero ${image?"":"plain"}`}>{image?<img src={image} alt="" onError={e=>{e.currentTarget.style.display="none";}}/>:match?.thumbnail?<img src={match.thumbnail} alt=""/>:<SignChip kind={p.kind} size="lg"/>}
  <button className="tool hero-close" onClick={onClose} aria-label={back?"Back to the trip":"Close"} title={back?"Back to the trip":"Close"}>{back?<ArrowLeft/>:<X/>}</button>
  {(p.imageCredit||(!image&&match?.thumbnail))&&<span className="image-credit">{p.imageCredit||"Wikipedia / Wikimedia Commons"}</span>}
 </div>
 <div className="place-scroll">
 <div className="place-title"><span className="place-kind"><SignChip kind={p.kind} size="sm"/>{pin?"Dropped pin":CATEGORY_LABELS[p.kind]}{region?` ⋅ ${region}`:""}</span><h2 className="display">{name}</h2>
  <p className="place-where">{stopIndex>=0?<span className="on-trip"><Check size={13}/>Stop {stopIndex+1} on this trip</span>:distance!==undefined?<span>{distance<.5?"Right on your route":`${distance.toFixed(distance<10?1:0)} mi off your route`}</span>:nearest?<span>{nearest.d.toFixed(0)} mi from {shortName(nearest.s.name)}</span>:null}</p></div>
 <div className="place-actions">
  {stopIndex<0?<button className="btn btn-primary" onClick={()=>onAdd({...p,name,region},p.kind==="camp")} disabled={trip.stops.length>=20}>{p.kind==="camp"?<Tent/>:<Plus/>}{p.kind==="camp"?"Stay the night":"Add to trip"}</button>:<button className="btn btn-quiet" disabled><Check/>In your trip</button>}
  <button className={`tool boxed ${isSaved?"on":""}`} aria-pressed={isSaved} aria-label={isSaved?"Remove from saved places":"Save for later"} title={isSaved?"Saved for later":"Save for later"} onClick={()=>onSave({...p,name,region})}>{isSaved?<BookmarkCheck/>:<Bookmark/>}</button>
  <a className="tool boxed" href={placeDirectionsUrl(p.coordinates)} target="_blank" rel="noopener noreferrer" aria-label="Directions in Google Maps" title="Directions in Google Maps"><Navigation/></a>
  {url&&<a className="tool boxed" href={url} target="_blank" rel="noopener noreferrer" aria-label={p.parkCode?"Official park website":"Website"} title={p.parkCode?"Official park website":"Website"}><ExternalLink/></a>}
 </div>
 {description&&<p className="place-desc">{description}{!full.description&&match&&<> <a className="link" href={match.url} target="_blank" rel="noopener noreferrer">Wikipedia</a></>}</p>}
 <section className="place-section"><h3>Weather</h3>{weather?<WeatherDisplay weather={weather} date={trip.stops[stopIndex]?.date}/>:weatherError?<p className="muted small">{weatherError}</p>:<p className="muted small"><LoaderCircle className="spin" size={14}/> Checking the forecast…</p>}{air&&<div className={`aqi-row aqi-${aqiTone(air.aqi)}`}><Wind size={15}/><span>Air quality <strong>{Math.round(air.aqi)}</strong> ⋅ {air.category}</span><small>{air.source.split(" ⋅ ")[0]}</small></div>}</section>
 {p.kind==="camp"&&<section className="place-section"><h3>Camping, without the guessing</h3><dl className="facts">{campAmenities.map(key=>{const value=(amenities as Record<string,unknown>)[key];return <div key={key}><dt>{key}</dt><dd className={value===null||value===undefined?"unknown":""}>{value===true?"Yes":value===false?"No":typeof value==="string"?value:"Not reported"}</dd></div>;})}</dl><p className="fine-print">Amenities come from the source. Vacancy isn’t shown here — confirm access and reservations with the campground.</p></section>}
 {p.kind==="ev"&&<section className="place-section"><h3>Charging</h3><dl className="facts">{[["Network",p.tags?.network||p.tags?.operator||"Not reported"],["Connectors",p.tags?.connectors||Object.keys(p.tags||{}).filter(k=>k.startsWith("socket:")&&p.tags![k]!=="0"&&p.tags![k]!=="no").map(k=>k.replace("socket:","")).join(", ")||"Not reported"],["Access",p.tags?.access||p.tags?.opening_hours||"Not reported"]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="fine-print">Live charger availability isn’t provided. Confirm your connector before relying on a stop.</p></section>}
 {p.kind==="fuel"&&<section className="place-section"><h3>Fuel</h3><p className="muted">{p.tags?.brand||p.tags?.operator||p.name}{p.tags?.opening_hours?` ⋅ ${p.tags.opening_hours}`:""}</p><p className="fine-print">Live fuel prices aren’t available.</p></section>}
 {p.parkCode&&<>
  {park&&park.alerts.length>0&&<section className="place-section"><h3>Park alerts</h3>{park.alerts.map(a=><article key={a.id} className={`alert-card ${a.severity==="Severe"?"severe":""}`}><strong>{a.title}</strong><p>{a.description}</p>{safeUrl(a.url)&&<a className="link" href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">NPS notice <ExternalLink size={12}/></a>}</article>)}</section>}
  <a className="link-row" href={`https://www.nps.gov/${p.parkCode}/planyourvisit/conditions.htm`} target="_blank" rel="noopener noreferrer"><span><strong>Current conditions on NPS.gov</strong><small>Closures, road status and alerts straight from the park</small></span><ExternalLink/></a>
  {full.operatingInfo&&<section className="place-section"><h3>Hours</h3><p className="muted pre">{full.operatingInfo}</p><p className="fine-print">Reference hours, not a live open/closed status.</p></section>}
  {full.fees&&full.fees.length>0&&<section className="place-section"><h3>Entrance</h3>{full.fees.slice(0,3).map((f,i)=><div className="fee" key={i}><strong>{f.title}{Number(f.cost)>0?` ⋅ $${Number(f.cost).toFixed(0)}`:""}</strong><p>{f.description}</p></div>)}</section>}
  {parkCamps.length>0&&<section className="place-section"><h3>Campgrounds in the park</h3><ul className="mini-list">{parkCamps.map(c=><li key={c.id}><button onClick={()=>onSelect(c)}><SignChip kind="camp" size="sm"/><span>{c.name}</span></button></li>)}</ul></section>}
  {full.activities&&full.activities.length>0&&<section className="place-section"><h3>What’s here</h3><div className="tags">{full.activities.slice(0,14).map(a=><span key={a}>{a}</span>)}</div></section>}
 </>}
 <section className="place-section"><h3>Around here</h3><div className="chip-row"><button className="chip" onClick={()=>onNearby(p,"camp")}><Tent/>Camping</button><button className="chip" onClick={()=>onNearby(p,"fuel")}><Fuel/>Fuel</button><button className="chip" onClick={()=>onNearby(p,"food")}><Utensils/>Food</button></div>
  {nearbyWiki.length>0&&<ul className="wiki-list">{nearbyWiki.map(w=><li key={w.title}><button onClick={()=>w.coordinates&&onSelect({id:`wiki-${w.title}`,name:w.title,kind:"attraction",coordinates:w.coordinates,description:w.extract,image:w.thumbnail,imageCredit:w.thumbnail?"Wikipedia / Wikimedia Commons":undefined,website:w.url,source:"Wikipedia",sourceUrl:w.url})}>{w.thumbnail?<img src={w.thumbnail} alt="" loading="lazy"/>:<span className="wiki-mark"><BookOpen/></span>}<span><strong>{w.title}</strong><small>{w.description||"Wikipedia article"}{w.distance!==undefined?` ⋅ ${w.distance.toFixed(1)} mi`:""}</small></span></button></li>)}</ul>}
 </section>
 <section className="place-section"><label className="field-label">A note for this place<textarea placeholder="Remember this for later…" value={trip.placeNotes[p.id]||""} maxLength={5000} onChange={e=>onNote(p.id,e.target.value)}/></label></section>
 <p className="fine-print source-line">{pin?"Location from your tap ⋅ names from OpenStreetMap / Photon":`${p.source} ⋅ ${ageLabel(p.updated)}`}{sourceUrl&&<> ⋅ <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Source</a></>}{wiki&&wiki.length>0?" ⋅ Nearby articles from Wikipedia":""}</p>
 </div>
 </article>;
}
