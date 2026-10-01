import {Mountain,TreePine,Tent,Fuel,Zap,Binoculars,Footprints,Landmark,Building2,MapPin,Utensils,Waves,Droplets,Sun,CloudSun,Cloud,CloudRain,CloudSnow,CloudLightning,CloudFog,CloudDrizzle,Castle,Sparkles,Trees} from "lucide-react";
import type {PlaceKind} from "@/lib/trippr/types";
import {signFamily} from "@/lib/trippr/data";
const ICONS:Record<PlaceKind,typeof MapPin>={park:TreePine,monument:Landmark,recreation:Mountain,statepark:Trees,camp:Tent,fuel:Fuel,ev:Zap,scenic:Binoculars,trail:Footprints,historic:Castle,museum:Building2,attraction:Sparkles,food:Utensils,waterfall:Waves,cave:Mountain,hotspring:Droplets,land:Trees,city:MapPin};
export function PlaceIcon({kind,...props}:{kind:PlaceKind;className?:string;size?:number;strokeWidth?:number}){const Icon=ICONS[kind]||MapPin;return <Icon {...props}/>;}
// A small road-sign plate: brown for recreation, blue for motorist services, green for destinations.
export function SignChip({kind,size="md"}:{kind:PlaceKind;size?:"sm"|"md"|"lg"}){return <span className={`sign-chip sign-${signFamily(kind)} sign-${size}`} aria-hidden="true"><PlaceIcon kind={kind} strokeWidth={2.2}/></span>;}
export function WeatherIcon({code=0,...props}:{code?:number;className?:string;size?:number}){const Icon=code===0||code===1?Sun:code===2?CloudSun:code===3?Cloud:code<=48?CloudFog:code<=57?CloudDrizzle:code<=67?CloudRain:code<=77?CloudSnow:code<=82?CloudRain:code<=86?CloudSnow:CloudLightning;return <Icon {...props}/>;}
// MUTCD warning diamond, used for anything that might change the drive.
export function WarningDiamond({tone="yellow",children}:{tone?:"yellow"|"orange"|"red";children?:React.ReactNode}){return <span className={`warning-diamond tone-${tone}`} aria-hidden="true"><span>{children}</span></span>;}
