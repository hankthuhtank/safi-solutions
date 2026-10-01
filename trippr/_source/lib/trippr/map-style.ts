import {rasterTileUrl,rasterAttribution} from "./raster";
import type * as GeoJSON from "geojson";
import type {StyleSpecification,Map as GLMap,GeoJSONSource,LayerSpecification} from "maplibre-gl";
export type MapTheme="atlas"|"satellite"|"light";
const GLYPHS="https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const DEM="https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png";
const ESRI="https://services.arcgisonline.com/ArcGIS/rest/services";
export async function loadMapLibre(){const gl=await import("maplibre-gl");gl.setWorkerUrl("/trippr/maplibre/maplibre-gl-worker.mjs");return gl;}
// Two printed-atlas palettes: "night drive" asphalt and "glovebox" paper.
const PALETTE={
 night:{bg:"#121a16",land:"#161f1a",park:"#1b2e23",wood:"#18261e",grass:"#19251d",water:"#0b2330",waterLine:"#24505e",sand:"#26241b",ice:"#24302c",building:"#1e2822",boundary:"#66725f",parkEdge:"#2f4f39",motorway:"#b39a5e",trunk:"#8a7a55",secondary:"#5e5c49",minor:"#39443d",casing:"#0c120f",rail:"#2d3530",text:"#b1bcae",halo:"#121a16",relief:.26,shadow:"#020403",highlight:"#33463a"},
 day:{bg:"#ebe4d2",land:"#ece6d5",park:"#d0d9ad",wood:"#d6ddb8",grass:"#dfe2c2",water:"#a3c6cd",waterLine:"#83aab4",sand:"#efe0b6",ice:"#f2f4f1",building:"#ddd3bd",boundary:"#8d8270",parkEdge:"#9cb07a",motorway:"#c4553c",trunk:"#d79a3a",secondary:"#e9c77a",minor:"#fbf8ef",casing:"#b8a98a",rail:"#b4a98f",text:"#3b463c",halo:"#f2ecdc",relief:.5,shadow:"#7a6d52",highlight:"#fffaf0"},
};
export async function buildMapStyle(theme:MapTheme="atlas"):Promise<StyleSpecification>{
 if(theme==="satellite")return{version:8,glyphs:GLYPHS,sources:{imagery:{type:"raster",tiles:[`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],tileSize:256,maxzoom:19,attribution:"Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community"},roads:{type:"raster",tiles:[`${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`],tileSize:256,maxzoom:19},places:{type:"raster",tiles:[`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`],tileSize:256,maxzoom:19}},layers:[{id:"satellite",type:"raster",source:"imagery",paint:{"raster-saturation":-.15,"raster-brightness-max":.9}},{id:"satellite-roads",type:"raster",source:"roads",paint:{"raster-opacity":.7}},{id:"satellite-places",type:"raster",source:"places",paint:{"raster-opacity":.9}}]};
 const c=theme==="light"?PALETTE.day:PALETTE.night;
 try{const r=await fetch("https://tiles.openfreemap.org/styles/liberty",{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("Map style unavailable");const s:StyleSpecification=await r.json();s.name="Trippr Atlas";
 for(const layer of s.layers){const p=layer.paint as Record<string,unknown>|undefined,id=layer.id;if(!p)continue;
 if(layer.type==="background")p["background-color"]=c.bg;
 if(layer.type==="raster"){p["raster-opacity"]=c.relief;p["raster-saturation"]=-.8;p["raster-brightness-max"]=theme==="light"?1:.32;}
 if(layer.type==="fill"){p["fill-color"]=id==="water"?c.water:id==="park"?c.park:id.includes("wood")?c.wood:id.includes("grass")||id.includes("wetland")?c.grass:id.includes("sand")?c.sand:id.includes("ice")?c.ice:id.includes("building")?c.building:c.land;p["fill-opacity"]=id.includes("building")?.5:id==="park"?.85:1;delete p["fill-outline-color"];delete p["fill-pattern"];}
 if(layer.type==="line"){const casing=id.includes("casing");p["line-color"]=id.includes("water")?c.waterLine:id.startsWith("boundary")?c.boundary:id==="park_outline"?c.parkEdge:id.includes("rail")?c.rail:casing?c.casing:id.includes("motorway")?c.motorway:id.includes("trunk_primary")?c.trunk:id.includes("secondary")?c.secondary:id.includes("aeroway")?c.minor:c.minor;if(id==="park_outline")p["line-opacity"]=.8;if(id.includes("path_pedestrian"))p["line-opacity"]=.35;}
 if(layer.type==="symbol"){p["text-color"]=c.text;p["text-halo-color"]=c.halo;p["text-halo-width"]=1.5;if(id.startsWith("poi_")||id.includes("one_way")||id==="airport")layer.layout={...layer.layout,visibility:"none"};if(id==="label_state"){p["text-opacity"]=.6;layer.layout={...layer.layout,"text-letter-spacing":.2,"text-transform":"uppercase"};}}
 if(layer.type==="fill-extrusion")p["fill-extrusion-color"]=c.building;
 }
 // Shaded relief keeps the atlas readable as terrain, not just roads.
 s.sources["relief-dem"]={type:"raster-dem",tiles:[DEM],encoding:"terrarium",tileSize:256,maxzoom:12,attribution:"Terrain © Mapzen / AWS Open Data"};
 const relief:LayerSpecification={id:"trippr-relief",type:"hillshade",source:"relief-dem",minzoom:5,paint:{"hillshade-shadow-color":c.shadow,"hillshade-highlight-color":c.highlight,"hillshade-accent-color":c.shadow,"hillshade-exaggeration":theme==="light"?.35:.45}};
 const at=s.layers.findIndex(l=>l.id==="waterway_tunnel");s.layers.splice(at>0?at:2,0,relief);
 return s;
 }catch{return{version:8,glyphs:GLYPHS,sources:{base:{type:"raster",tiles:[rasterTileUrl(theme)],tileSize:256,attribution:rasterAttribution(theme)}},layers:[{id:"base",type:"raster",source:"base",paint:theme==="light"?{}:{"raster-brightness-max":.55,"raster-saturation":-.6}}]};}
}
export const ROUTE_COLORS={atlas:{line:"#d4f53c",edge:"#08100b",glow:"#d4f53c"},satellite:{line:"#d4f53c",edge:"#08100b",glow:"#d4f53c"},light:{line:"#1d3b27",edge:"#f6f1e3",glow:"#d9f23a"}};
// The route reads like a TripTik: a dark pen line with a hi-vis highlighter pass over it.
export function addRouteLayers(map:GLMap,coordinates:number[][],approximate=false,theme:MapTheme="atlas"){
 const data:GeoJSON.Feature<GeoJSON.LineString>={type:"Feature",properties:{},geometry:{type:"LineString",coordinates}},c=ROUTE_COLORS[theme],day=theme==="light";
 // A dash array, even a solid one, disables line-gradient, so solid routes carry none.
 if(map.getSource("trip-route")){(map.getSource("trip-route") as GeoJSONSource).setData(data);map.setPaintProperty("trip-route-main","line-dasharray",approximate?[2,2]:undefined);return;}
 map.addSource("trip-route",{type:"geojson",data,lineMetrics:true});
 map.addLayer({id:"trip-route-glow",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":c.glow,"line-width":["interpolate",["linear"],["zoom"],3,day?10:11,10,day?22:20],"line-opacity":day?.58:.16,"line-blur":day?2:6}});
 map.addLayer({id:"trip-route-edge",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":c.edge,"line-width":["interpolate",["linear"],["zoom"],3,day?4:6,10,day?6:9]}});
 map.addLayer({id:"trip-route-main",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":c.line,"line-width":["interpolate",["linear"],["zoom"],3,day?1.8:3.2,10,day?2.6:4.6],...(approximate?{"line-dasharray":[2,2] as [number,number]}:{})}});
}
// Signature moment: the highlighter traces the new route from the first stop to the last.
export function drawRoute(map:GLMap,theme:MapTheme,duration=1400){const c=ROUTE_COLORS[theme],layers=[["trip-route-main",c.line],["trip-route-glow",c.glow]] as const,start=performance.now();let frame=0;
 const paint=(t:number)=>{for(const [id,color] of layers)if(map.getLayer(id))map.setPaintProperty(id,"line-gradient",t>=1?undefined:["step",["line-progress"],color,Math.max(.0001,t),"rgba(0,0,0,0)"]);};
 const tick=(now:number)=>{const x=Math.min(1,(now-start)/duration),t=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;try{paint(t);}catch{return;}if(x<1)frame=requestAnimationFrame(tick);};
 try{paint(0);}catch{return()=>{};}frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);try{paint(1);}catch{/* style replaced */}};}
