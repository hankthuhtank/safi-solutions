import {copyFile,cp,mkdir,readFile,rm} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const dist=path.dirname(fileURLToPath(import.meta.resolve("maplibre-gl"))),target=path.resolve("public/maplibre");
await rm(path.resolve(import.meta.dirname,"../build"),{recursive:true,force:true});
await mkdir(target,{recursive:true});
for(const name of ["maplibre-gl-worker.mjs","maplibre-gl-shared.mjs"])await copyFile(path.join(dist,name),path.join(target,name));
await copyFile(path.resolve(dist,"../LICENSE.txt"),path.join(target,"LICENSE.txt"));
const worker=await readFile(path.join(target,"maplibre-gl-worker.mjs"),"utf8");
if(!worker.includes('./maplibre-gl-shared.mjs'))throw Error("MapLibre worker dependency changed; verify asset packaging before publishing.");
console.log("Prepared same-origin MapLibre worker, shared module, and license.");

const leafletDist=path.dirname(fileURLToPath(import.meta.resolve("leaflet")));
await cp(path.join(leafletDist,"images"),path.resolve("public/assets/images"),{recursive:true});
