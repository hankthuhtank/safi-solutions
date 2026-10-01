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
 for(const [,name] of matches){if(!name.startsWith(".")&&!name.startsWith("@/"))continue;const target=name.startsWith("@/")?path.resolve("_source",name.slice(2)):path.resolve(path.dirname(file),name);const dependency=await load(target+".ts");code=code.replaceAll(`from "${name}"`,`from "${dependency}"`).replaceAll(`from '${name}'`,`from '${dependency}'`);}
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
const trip={id:"test",name:"Western trip",stops:[stop("a",[-112,36]),stop("b",[-113,37])],startDate:"2026-10-08",endDate:"2026-10-10",notes:"Pack the tent",savedPlaces:[],placeNotes:{a:"Bring water"},preferences:{avoidTolls:false,avoidHighways:false,avoidFerries:false,evMode:true,range:250,chargerGap:120,connector:"CCS"},modifiedAt:"2026-10-01T00:00:00Z"};
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
assert.equal((await call({action:"route",points:JSON.stringify([[-112,36],[-113,37]]),tolls:"1"})).status,503);assert.equal(upstream.length,0);
const response=await call({action:"route",points:JSON.stringify([[-112,36],[-113,37]])});assert.equal(response.status,200);const route=await response.json();assert.equal(route.distance,160934);assert.equal(route.legs.length,1);
await call({action:"route",points:JSON.stringify([[-112,36],[-113,37]])});assert.equal(upstream.length,1);
globalThis.fetch=async()=>Response.json({current:{temperature_2m:NaN,weather_code:0},daily:{time:[]}});
assert.equal((await call({action:"weather",lon:"-112",lat:"36"})).status,502);
assert.equal((await call({action:"fire",bbox:"-114,35,-112,37"})).status,503);
assert.equal((await call({action:"river",bbox:"-180,-80,180,80"})).status,400);
console.log("Trippr verification passed: corridor geometry, alert polygons, trip round trips, reorder persistence, corrupt-storage protection, quota handling, route validation, cache reuse, and independent provider failures.");
