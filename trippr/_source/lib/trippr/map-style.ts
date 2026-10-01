import type * as GeoJSON from "geojson";
import type {StyleSpecification} from "maplibre-gl";
export type MapTheme="atlas"|"satellite"|"light";
export async function loadMapLibre(){const gl=await import("maplibre-gl");gl.setWorkerUrl("/trippr/maplibre/maplibre-gl-worker.mjs");return gl;}
export async function buildMapStyle(theme:MapTheme="atlas"):Promise<StyleSpecification>{
 if(theme==="satellite")return{version:8,sources:{imagery:{type:"raster",tiles:["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community"}},layers:[{id:"satellite",type:"raster",source:"imagery",paint:{"raster-saturation":-.2,"raster-brightness-max":.86}}]};
 try{const r=await fetch("https://tiles.openfreemap.org/styles/liberty",{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("Map style unavailable");const s:StyleSpecification=await r.json();s.name="Trippr Atlas";
 const dark=theme==="atlas";
 for(const layer of s.layers){const p=layer.paint as Record<string,unknown>|undefined,id=layer.id;if(!p)continue;
 if(layer.type==="background")p["background-color"]=dark?"#192a27":"#e9eedb";
 if(layer.type==="raster"){p["raster-opacity"]=dark?.15:.6;p["raster-saturation"]=-.75;p["raster-brightness-max"]=dark?.30:1;}
 if(layer.type==="fill"){p["fill-color"]=id.includes("water")?dark?"#112529":"#b7d8dd":id.includes("park")?dark?"#254234":"#bdd294":id.includes("wood")?dark?"#22382e":"#d0dfb4":id.includes("sand")?dark?"#3a3528":"#eee0ba":id.includes("ice")?dark?"#394743":"#e0ebea":dark?"#20302a":"#e0e7cd";if(id.includes("building"))p["fill-opacity"]=.3;}
 if(layer.type==="line"){p["line-color"]=id.includes("water")?dark?"#2d4847":"#96b9c1":id.includes("boundary")?dark?"#697567":"#859275":id.includes("park")?dark?"#455e40":"#96ad7b":id.includes("motorway")||id.includes("primary")?dark?"#7a7557":"#bcb98a":dark?"#41483a":"#c6c9ac";if(id.includes("casing"))p["line-color"]=dark?"#15241f":"#dce4cd";}
 if(layer.type==="symbol"){p["text-color"]=dark?"#aebcb0":"#4c624f";p["text-halo-color"]=dark?"#1d2e28":"#e9eedb";p["text-halo-width"]=1.6;if(id.startsWith("poi_"))layer.layout={...layer.layout,visibility:"none"};if(id==="label_state"){p["text-opacity"]=.55;layer.layout={...layer.layout,"text-letter-spacing":.18};}}
 if(layer.type==="fill-extrusion")p["fill-extrusion-color"]=dark?"#324035":"#c8d3b5";
 }return s;
 }catch{return{version:8,sources:{base:{type:"raster",tiles:[theme==="atlas"?"https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png":"https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'}},layers:[{id:"base",type:"raster",source:"base"}]};}
}
export function addRouteLayers(map:import("maplibre-gl").Map,coordinates:number[][],approximate=false){
 const data:GeoJSON.Feature<GeoJSON.LineString>={type:"Feature",properties:{},geometry:{type:"LineString",coordinates}};
 if(map.getSource("trip-route")){(map.getSource("trip-route") as import("maplibre-gl").GeoJSONSource).setData(data);map.setPaintProperty("trip-route-main","line-dasharray",approximate?[2,2]:[1,0]);return;}
 map.addSource("trip-route",{type:"geojson",data});
 map.addLayer({id:"trip-route-glow",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#bbed75","line-width":15,"line-opacity":.12,"line-blur":6}});
 map.addLayer({id:"trip-route-edge",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#12281b","line-width":7}});
 map.addLayer({id:"trip-route-main",type:"line",source:"trip-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#c4f17b","line-width":3.7,"line-dasharray":approximate?[2,2]:[1,0]}});
}
