import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

// Load the actual TypeScript modules, replacing only runtime host bindings.
const modules=new Map();
async function load(file){
 file=path.resolve(file);if(modules.has(file))return modules.get(file);
 let code=ts.transpileModule(await readFile(file,"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/import \{ env \} from ["']cloudflare:workers["'];/,"const env={};");
 const matches=[...code.matchAll(/from ["']([^"']+)["']/g)];
 for(const [,name] of matches){if(!name.startsWith(".")&&!name.startsWith("@/"))continue;const target=name.startsWith("@/")?path.resolve("_source",name.slice(2)):path.resolve(path.dirname(file),name);const dependency=name.endsWith(".json")?"data:text/javascript;base64,"+Buffer.from("export default "+await readFile(target,"utf8")).toString("base64"):await load(target+".ts");code=code.replaceAll(`from "${name}"`,`from "${dependency}"`).replaceAll(`from '${name}'`,`from '${dependency}'`);}
 const url="data:text/javascript;base64,"+Buffer.from(code).toString("base64");modules.set(file,url);return url;
}
const geo=await import(await load("_source/lib/trippr/geo.ts"));
assert.equal(geo.validCoordinate([-112,36]),true);assert.equal(geo.validCoordinate([0,NaN]),false);assert.equal(geo.validCoordinate([181,30]),false);
assert.ok(geo.distanceToRoute([-100,35],[[-101,35],[-99,35]])<.001);
assert.ok(geo.distanceToRoute([-100,35.2],[[-101,35],[-99,35]])>5);
assert.deepEqual(geo.sampleLine([[-101,35],[-100,35],[-99,35]],2),[[-101,35],[-99,35]]);
const polygon={type:"Polygon",coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]};
assert.equal(geo.pointInGeometry([3,3],polygon),true);assert.equal(geo.pointInGeometry([1.5,1.5],polygon),false);
assert.equal(geo.safeUrl("javascript:alert(1)"),undefined);

const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const {localTripRepository:repo,validateTrip}=await import(await load("_source/lib/trippr/storage.ts"));
const stop=(id,coordinates)=>({id,stopId:id,name:id,kind:"city",source:"Test fixture",coordinates,date:"2026-10-08",notes:"Meet at the park entrance"});
const trip={id:"test",name:"Western trip",stops:[stop("a",[-112,36]),stop("b",[-113,37])],startDate:"2026-10-08",endDate:"2026-10-10",notes:"Pack the tent",savedPlaces:[],placeNotes:{a:"Bring water"},preferences:{avoidTolls:false,avoidHighways:false,avoidFerries:false,evMode:true,range:250,chargerGap:120,connector:"CCS",mpg:28,fuelPrice:4.25,milesPerKwh:3.3,kwhPrice:.5},modifiedAt:"2026-10-01T00:00:00Z"};
repo.writeDraft(trip);assert.deepEqual(repo.draft(),trip);
repo.save(trip);const reordered={...trip,stops:[...trip.stops].reverse()};repo.writeDraft(reordered);repo.save(reordered);
assert.deepEqual(repo.draft().stops.map(s=>s.id),["b","a"]);assert.equal(repo.list().length,1);assert.equal(repo.list()[0].placeNotes.a,"Bring water");assert.equal(repo.list()[0].preferences.connector,"CCS");
assert.equal(validateTrip({...trip,stops:[stop("bad",[500,36])]}),null);
data.set("trippr.draft.v1","broken-json");assert.throws(()=>repo.draft());assert.throws(()=>repo.writeDraft(trip));assert.equal(data.get("trippr.draft.v1"),"broken-json");
data.set("trippr.draft.v1",JSON.stringify(trip));const original=globalThis.localStorage.setItem;globalThis.localStorage.setItem=()=>{throw Error("Quota exceeded");};assert.throws(()=>repo.writeDraft(reordered));globalThis.localStorage.setItem=original;assert.deepEqual(repo.draft(),trip);

const upstream=[];globalThis.fetch=async url=>{upstream.push(String(url));return Response.json({code:"Ok",routes:[{geometry:{coordinates:[[-112,36],[-113,37]]},distance:160934,duration:7200,legs:[{distance:160934,duration:7200}]}]});};
const {GET}=await import(await load("_source/lib/trippr/handler.ts"));
const call=q=>GET(new Request("https://trippr.example/api/trippr?"+new URLSearchParams(q)));
assert.equal((await call({action:"route",points:JSON.stringify([[0,999],[1,2]])})).status,400);assert.equal(upstream.length,0);

const response=await call({action:"route",points:JSON.stringify([[-112,36],[-113,37]])});assert.equal(response.status,200);const route=await response.json();assert.equal(route.distance,160934);assert.equal(route.legs.length,1);
await call({action:"route",points:JSON.stringify([[-112,36],[-113,37]])});assert.equal(upstream.length,1);
globalThis.fetch=async()=>Response.json({current:{temperature_2m:NaN,weather_code:0},daily:{time:[]}});
assert.equal((await call({action:"weather",lon:"-112",lat:"36"})).status,502);
// Road preferences route through keyless Valhalla instead of failing without an OpenRouteService key.
const {decodePolyline}=await import(await load("_source/lib/trippr/handler.ts"));
assert.deepEqual(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@",5),[[-120.2,38.5],[-120.95,40.7],[-126.453,43.252]]);
const valhallaCalls=[];globalThis.fetch=async url=>{valhallaCalls.push(String(url));return Response.json({trip:{summary:{length:100,time:5400},legs:[{summary:{length:100,time:5400},shape:"_p~iF~ps|U_ulLnnqC"}]}});};
const avoided=await call({action:"route",points:JSON.stringify([[-120.2,38.5],[-120.95,40.7]]),tolls:"1"});assert.equal(avoided.status,200);const avoidedRoute=await avoided.json();
assert.ok(valhallaCalls[0].startsWith("https://valhalla1.openstreetmap.de/route?json="));assert.ok(decodeURIComponent(valhallaCalls[0]).includes('"use_tolls":0'));assert.equal(Math.round(avoidedRoute.distance),160934);assert.equal(avoidedRoute.legs.length,1);
// Long trips are split into pieces under the public server's 1,500 km request limit.
valhallaCalls.length=0;globalThis.fetch=async url=>{valhallaCalls.push(String(url));const n=JSON.parse(decodeURIComponent(String(url).split("json=")[1])).locations.length;return Response.json({trip:{summary:{length:100*(n-1),time:3600*(n-1)},legs:Array.from({length:n-1},()=>({summary:{length:100,time:3600},shape:"_p~iF~ps|U_ulLnnqC"}))}});};
const long=await (await call({action:"route",points:JSON.stringify([[-95.5,33.6],[-105.9,35.7],[-112.1,36],[-119.6,37.8]]),tolls:"1"})).json();assert.ok(valhallaCalls.length>=2);assert.equal(long.legs.length,3);assert.equal(Math.round(long.distance),Math.round(3*160934.4));
assert.equal((await call({action:"route",points:JSON.stringify([[-80,40],[-122,40]]),tolls:"1"})).status,400);
// Wildfires come from the public NIFC incident service and are filtered to the route corridor.
globalThis.fetch=async()=>Response.json({type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:[-112.5,36.1]},properties:{IncidentName:"Near",IncidentSize:1200,PercentContained:20,UniqueFireIdentifier:"a"}},{type:"Feature",geometry:{type:"Point",coordinates:[-100,45]},properties:{IncidentName:"Far",UniqueFireIdentifier:"b"}},{type:"Feature",geometry:{type:"Point",coordinates:[-112.4,36.2]},properties:{IncidentName:"Out",PercentContained:100,UniqueFireIdentifier:"c"}}]});
const fires=await (await call({action:"fire",points:JSON.stringify([[-112,36],[-113,37]]),radius:"30"})).json();assert.equal(fires.hazards.length,1);assert.equal(fires.hazards[0].title,"Near Fire");assert.ok(fires.hazards[0].distance<30);
assert.equal((await call({action:"roads",points:JSON.stringify([[-112,36],[-113,37]]),radius:"30"})).status,503);
// In-browser use has no shared visitor bucket, so a busy session is never rate limited.
for(let i=0;i<95;i++)assert.equal((await call({action:"capabilities"})).status,200);
// Corridor search: grid boxes instead of a long "around", PAD-US for state parks, mirrors rest after failing.
const {corridorBoxes,createTripprHandler}=await import(await load("_source/lib/trippr/handler.ts"));
const boxes=corridorBoxes([[-112,36],[-108,36]],25);assert.ok(boxes.length>0&&boxes.length<12);const inBox=(x,y)=>boxes.some(b=>x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]);for(let x=-112;x<=-108;x+=.25)for(const dy of [-.3,0,.3])assert.ok(inBox(x,36+dy),`corridor covers ${x},${36+dy}`);assert.ok(boxes.reduce((n,b)=>n+(b[2]-b[0])*(b[3]-b[1]),0)<=6.5,"corridor boxes stay tight");
const hits=[];globalThis.fetch=async(url,o)=>{hits.push(String(url));if(String(url).startsWith("https://overpass-api.de"))return new Response("busy",{status:429});if(String(url).includes("overpass"))return Response.json({elements:[{type:"node",id:1,lat:36.05,lon:-110,tags:{name:"Near Camp",tourism:"camp_site"}},{type:"node",id:2,lat:38,lon:-110,tags:{name:"Far Camp",tourism:"camp_site"}}]});return Response.json({features:[]});};
const H=createTripprHandler(),ask=q=>H(new Request("https://t.example/?"+new URLSearchParams(q)));
const camps=await (await ask({action:"places",points:JSON.stringify([[-112,36],[-108,36]]),radius:"25",kinds:"camp"})).json();
assert.deepEqual(camps.places.map(p=>p.name),["Near Camp"]);assert.equal(camps.limited,false);assert.ok(hits[0].startsWith("https://overpass-api.de")&&hits[1].includes("private.coffee"));assert.ok(!decodeURIComponent(hits[1]).includes("around:"));
hits.length=0;await ask({action:"places",points:JSON.stringify([[-112,36],[-108,36]]),radius:"25",kinds:"fuel"});assert.ok(hits[0].includes("private.coffee"),"a mirror that just failed is tried last");
hits.length=0;const parks=await (await ask({action:"places",points:JSON.stringify([[-112,36],[-108,36]]),radius:"25",kinds:"statepark"})).json();assert.ok(hits.length>0&&hits.every(u=>u.includes("nationalmap.gov")));assert.equal(parks.limited,false);
// Free browser-safe keys come from config.js; anything outside the allowlist is ignored.
globalThis.TRIPPR_CONFIG={publicKeys:{NPS_API_KEY:" free-key ",NASA_FIRMS_MAP_KEY:"must-stay-server-side"}};
const {api}=await import(await load("_source/lib/trippr/adapters.ts"));const caps=await api("capabilities");assert.equal(caps.parks,true);assert.equal(caps.firms,false);delete globalThis.TRIPPR_CONFIG;
const {encodeTrip,decodeTrip}=await import(await load("_source/lib/trippr/share.ts"));
const shared=await decodeTrip(await encodeTrip(trip));assert.equal(shared.name,"Western trip");assert.deepEqual(shared.stops.map(s=>s.coordinates),[[-112,36],[-113,37]]);assert.equal(shared.stops[0].date,"2026-10-08");assert.equal(await decodeTrip("zbroken"),null);
assert.equal((await call({action:"river",bbox:"-180,-80,180,80"})).status,400);
console.log("Trippr verification passed: corridor geometry, alert polygons, trip round trips, reorder persistence, corrupt-storage protection, quota handling, route validation, cache reuse, road-preference routing, polyline decoding, corridor wildfire filtering, no in-browser rate limit, browser key allowlist, corridor grid search, mirror fallback and rest, state parks via PAD-US, share links, and independent provider failures.");
