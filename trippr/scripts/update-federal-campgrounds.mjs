// Rebuilds public/data/federal-campgrounds.json from Recreation.gov's public RIDB export
// (no key needed; refreshed nightly). Usage:
//   node scripts/update-federal-campgrounds.mjs              downloads the export (~250 MB)
//   node scripts/update-federal-campgrounds.mjs export.zip   uses a zip you already have
// Requires the `unzip` command.
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

const EXPORT="https://ridb.recreation.gov/downloads/RIDBFullExport_V1_CSV.zip";
const root=path.resolve(import.meta.dirname,".."),out=path.join(root,"public/data/federal-campgrounds.json");
let zip=process.argv[2],work;
if(!zip){work=await mkdtemp(path.join(tmpdir(),"ridb-"));zip=path.join(work,"ridb.zip");const r=await fetch(EXPORT);if(!r.ok)throw Error(`RIDB export download failed: ${r.status}`);await writeFile(zip,Buffer.from(await r.arrayBuffer()));}
const read=name=>parse(execFileSync("unzip",["-p",zip,name],{maxBuffer:512*1024*1024}).toString("utf8").replace(/^﻿/,""));

// RFC 4180 CSV: quoted fields may contain commas, quotes and line breaks.
function parse(text){const rows=[];let row=[],field="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=c;}else if(c==='"')quoted=true;else if(c===","){row.push(field);field="";}else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(field);rows.push(row);row=[];field="";}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}const [head,...body]=rows;return body.filter(r=>r.length===head.length).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));}

const facilities=read("Facilities_API_v1.csv").filter(f=>f.FacilityTypeDescription==="Campground"&&f.Enabled==="true");
const orgs=new Map(read("Organizations_API_v1.csv").map(o=>[o.OrgID,o.OrgAbbrevName||o.OrgName]));
const agency=new Map(read("OrgEntities_API_v1.csv").filter(e=>e.EntityType==="Campground").map(e=>[e.EntityID,orgs.get(e.OrgID)||""]));
// Site types tell us what a campground can actually take: tents, RVs, hookups, cabins.
const TENT=1,RV=2,ELECTRIC=4,GROUP=8,CABIN=16;const sites=new Map();
for(const s of read("Campsites_API_v1.csv")){if(s.TypeOfUse==="Day")continue;const t=s.CampsiteType||"";if(/MANAGEMENT|PARKING|PICNIC|MOORING|ANCHORAGE/.test(t))continue;const v=sites.get(s.FacilityID)||{n:0,f:0};v.n++;if(/STANDARD|TENT|WALK TO|HIKE TO|BOAT IN/.test(t))v.f|=TENT;if(/STANDARD|RV/.test(t))v.f|=RV;if(/(^|\s)ELECTRIC/.test(t))v.f|=ELECTRIC;if(/^GROUP/.test(t))v.f|=GROUP;if(/CABIN|YURT|SHELTER/.test(t))v.f|=CABIN;sites.set(s.FacilityID,v);}
const title=s=>s===s.toUpperCase()?s.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/\b(Rv|Nf|Blm|Usfs|Coe|Nps)\b/g,m=>m.toUpperCase()):s;
const rows=[];for(const f of facilities){const lon=Number(f.FacilityLongitude),lat=Number(f.FacilityLatitude);if(!(lat>17&&lat<72&&lon>-180&&lon<-64))continue;const s=sites.get(f.FacilityID)||{n:0,f:0};rows.push([Number(f.FacilityID),title(f.FacilityName.trim()),Number(lon.toFixed(5)),Number(lat.toFixed(5)),agency.get(f.FacilityID)||"",s.n,s.f,f.Reservable==="true"?1:0]);}
rows.sort((a,b)=>a[0]-b[0]);
await mkdir(path.dirname(out),{recursive:true});
const updated=facilities.map(f=>f.LastUpdatedDate).sort().at(-1)||new Date().toISOString().slice(0,10);
await writeFile(out,JSON.stringify({source:"Recreation.gov RIDB",updated,flags:{tent:TENT,rv:RV,electric:ELECTRIC,group:GROUP,cabin:CABIN},fields:["id","name","lon","lat","agency","sites","flags","reservable"],rows}));
if(work)await rm(work,{recursive:true,force:true});
console.log(`Wrote ${rows.length} federal campgrounds to ${path.relative(root,out)} (data through ${updated}).`);
