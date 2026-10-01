"use client";
// Mechanical odometer: each digit is a drum that rolls to its new value.
export default function Odometer({value,digits=5,label}:{value:number|null;digits?:number;label:string}){
 const text=value===null?"":String(Math.max(0,Math.round(value))).slice(-digits).padStart(digits,"0"),lead=value===null?digits:text.length-String(Math.max(0,Math.round(value))).length;
 return <span className="odometer" role="img" aria-label={value===null?`${label}: not available yet`:`${label}: ${Math.round(value).toLocaleString()}`}>{Array.from({length:digits},(_,i)=>{const d=value===null?0:Number(text[i]);return <span className={`drum ${i<lead?"lead":""} ${i===digits-1?"last":""}`} key={i} aria-hidden="true"><span className="reel" style={{transform:`translateY(${-d*10}%)`}}>{[0,1,2,3,4,5,6,7,8,9].map(n=><span key={n}>{value===null?"–":n}</span>)}</span></span>;})}</span>;
}
