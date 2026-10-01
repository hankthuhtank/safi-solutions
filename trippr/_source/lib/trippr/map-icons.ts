import type {Map as GLMap} from "maplibre-gl";
import type {PlaceKind} from "./types";
// Places on the map fall into four families, each with its own sign color and symbol, so camping,
// parks, sights and services never merge into one anonymous count.
export type MapGroup="parks"|"camp"|"sights"|"services";
export const MAP_GROUPS:MapGroup[]=["parks","camp","sights","services"];
export const mapGroup=(kind:PlaceKind):MapGroup=>["park","monument","recreation","statepark","land"].includes(kind)?"parks":kind==="camp"?"camp":["fuel","ev","food"].includes(kind)?"services":"sights";
// Icon paths are lucide's tree-pine, tent, mountain-snow and fuel (24×24, stroked).
export const GROUP_STYLE:Record<MapGroup,{color:string;label:string;paths:string[]}>={
 parks:{color:"#7a4524",label:"Parks & public land",paths:["m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z","M12 22v-3"]},
 camp:{color:"#c4661a",label:"Camping",paths:["M3.5 21 14 3","M20.5 21 10 3","M15.5 21 12 15l-3.5 6","M2 21h20"]},
 sights:{color:"#1d756c",label:"Sights & outdoors",paths:["m8 3 4 8 5-5 5 15H2L8 3z","M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"]},
 services:{color:"#2459b3",label:"Fuel, EV & food",paths:["M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5","M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16","M2 21h13","M3 9h11"]},
};
// Clusters sit as a small sign assembly around their true spot, one plate per family.
export const CLUSTER_OFFSET:Record<MapGroup,[number,number]>={parks:[-27,-14],camp:[27,-14],sights:[-27,14],services:[27,14]};
const RATIO=2;
function paint(width:number,height:number,draw:(ctx:CanvasRenderingContext2D)=>void){const c=document.createElement("canvas");c.width=width*RATIO;c.height=height*RATIO;const ctx=c.getContext("2d")!;ctx.scale(RATIO,RATIO);draw(ctx);return{width:c.width,height:c.height,data:new Uint8Array(ctx.getImageData(0,0,c.width,c.height).data.buffer)};}
function glyph(ctx:CanvasRenderingContext2D,paths:string[],cx:number,cy:number,size:number){ctx.save();ctx.translate(cx-size/2,cy-size/2);ctx.scale(size/24,size/24);ctx.strokeStyle="#fff";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.lineJoin="round";for(const d of paths)ctx.stroke(new Path2D(d));ctx.restore();}
function plate(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
export function addMapIcons(map:GLMap){for(const g of MAP_GROUPS){const s=GROUP_STYLE[g];
 // A single place: a round sign with the family symbol.
 if(!map.hasImage(`poi-${g}`))map.addImage(`poi-${g}`,paint(24,24,ctx=>{ctx.shadowColor="rgba(0,0,0,.45)";ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.beginPath();ctx.arc(12,12,10,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.shadowColor="transparent";ctx.lineWidth=1.6;ctx.strokeStyle="#fff";ctx.stroke();glyph(ctx,s.paths,12,12,12.5);}),{pixelRatio:RATIO});
 // A cluster: a sign plate with the symbol and room for the count, stretched to fit the number.
 if(!map.hasImage(`cl-${g}`))map.addImage(`cl-${g}`,paint(56,26,ctx=>{ctx.shadowColor="rgba(0,0,0,.5)";ctx.shadowBlur=4;ctx.shadowOffsetY=1.5;plate(ctx,1,1,54,24,7);ctx.fillStyle=s.color;ctx.fill();ctx.shadowColor="transparent";plate(ctx,3,3,50,20,5);ctx.lineWidth=1.4;ctx.strokeStyle="rgba(255,255,255,.92)";ctx.stroke();glyph(ctx,s.paths,15,13,14);}),{pixelRatio:RATIO,stretchX:[[66,92]],content:[56,8,100,44]});}}
