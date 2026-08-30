"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export function CountUp({ value, decimals = 0, prefix = "", suffix = "" }: { value:number; decimals?:number; prefix?:string; suffix?:string }) {
  const [shown,setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(value); return; }
    const start = performance.now();
    const duration = 760;
    let frame = 0;
    const tick = (now:number) => {
      const p = Math.min(1,(now-start)/duration);
      const eased = 1 - Math.pow(1-p,4);
      setShown(value*eased);
      if(p<1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  },[value]);
  return <>{prefix}{shown.toLocaleString("en-IN",{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}{suffix}</>;
}

export function PageLead({ code, eyebrow, title, copy, action, meta }: { code:string; eyebrow:string; title:string; copy:string; action?:ReactNode; meta?:ReactNode }) {
  return (
    <section className="page-lead">
      <div className="page-lead__code">{code}</div>
      <div className="page-lead__copy"><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p>{meta && <div className="page-lead__meta">{meta}</div>}</div>
      {action && <div className="page-lead__action">{action}</div>}
    </section>
  );
}

export function Panel({ children, className = "", label, tone }: { children:ReactNode; className?:string; label?:string; tone?:"cream"|"red"|"teal"|"dark" }) {
  return <section className={`panel ${tone?`panel--${tone}`:""} ${className}`}>{label && <span className="panel-corner-label">{label}</span>}{children}</section>;
}

export function SectionHead({ no, kicker, title, right }: { no:string; kicker:string; title:string; right?:ReactNode }) {
  return <div className="section-head"><div className="section-head__left"><span className="section-no">{no}</span><div><small>{kicker}</small><h2>{title}</h2></div></div>{right && <div className="section-head__right">{right}</div>}</div>;
}

export function StatePill({ state, children }: { state:"ahead"|"steady"|"watch"|"critical"|"info"; children:ReactNode }) {
  return <span className={`state-pill state-pill--${state}`}>{children}</span>;
}

export function TinyTrend({ negative = false, seed = 0 }: { negative?:boolean; seed?:number }) {
  const path = useMemo(() => {
    const base = negative ? [9,8,10,7,9,6,8,5,6,4] : [4,5,4,7,6,9,8,11,10,13];
    return base.map((n,i) => `${i===0?"M":"L"}${i*11},${18 - n + (seed%3)}`).join(" ");
  },[negative,seed]);
  return <svg viewBox="0 0 100 20" className={negative ? "tiny-trend is-negative" : "tiny-trend"} aria-hidden="true"><path d={path} pathLength="1"/></svg>;
}

export function Meter({ value, tone="teal", showValue = true }: { value:number; tone?:"teal"|"red"|"cream"; showValue?:boolean }) {
  const safe = Math.max(0,Math.min(100,value));
  return <div className={`meter meter--${tone}`}><i style={{"--meter":`${safe}%`} as CSSProperties}/>{showValue && <b>{safe.toFixed(0)}%</b>}</div>;
}

export function RevenueLine({ values, compare, tone="teal" }: { values:number[]; compare?:number[]; tone?:"teal"|"red" }) {
  const id = useId().replace(/:/g,"");
  const width=920, height=245, pad=14;
  const all = compare ? [...values,...compare] : values;
  const min = Math.min(...all)*0.92, max=Math.max(...all)*1.05;
  const points = (v:number[]) => v.map((n,i)=>{
    const x=pad+(i*(width-pad*2))/Math.max(1,v.length-1);
    const y=height-pad-((n-min)/(max-min||1))*(height-pad*2);
    return [x,y] as const;
  });
  const p=points(values), c=compare?points(compare):[];
  const d=(arr:readonly (readonly [number,number])[])=>arr.map(([x,y],i)=>`${i?"L":"M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area=`${d(p)} L ${p[p.length-1][0]},${height} L ${p[0][0]},${height} Z`;
  const main=tone==="red"?"#EB0000":"#00DDC2";
  return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`revenue-line revenue-line--${tone}`} role="img" aria-label="Performance trajectory">
    <defs><linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={main} stopOpacity=".20"/><stop offset="100%" stopColor={main} stopOpacity="0"/></linearGradient></defs>
    {[.2,.4,.6,.8].map((r)=><line key={r} x1="0" x2={width} y1={height*r} y2={height*r} className="chart-grid"/>)}
    <path d={area} fill={`url(#fill-${id})`} className="chart-area"/>
    {compare && <path d={d(c)} className="chart-compare" pathLength="1"/>}
    <path d={d(p)} className="chart-main" pathLength="1"/>
    {p.filter((_,i)=>i%7===0 || i===p.length-1).map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.2" className="chart-dot"/>)}
  </svg>;
}

export function Donut({ segments, center, sub }: { segments:{value:number; className:string}[]; center:string; sub:string }) {
  let offset=0;
  return <div className="donut-wrap"><svg viewBox="0 0 120 120" className="donut" aria-hidden="true"><circle cx="60" cy="60" r="44" className="donut-track"/>{segments.map((s,i)=>{const dash=s.value*2.7646; const el=<circle key={i} cx="60" cy="60" r="44" className={`donut-segment ${s.className}`} strokeDasharray={`${dash} ${276.46-dash}`} strokeDashoffset={-offset*2.7646}/>; offset+=s.value; return el;})}</svg><div className="donut-center"><strong>{center}</strong><span>{sub}</span></div></div>;
}

export function TicketTicker({ items }: { items:{label:string; tone?:"alert"|"good"}[] }) {
  return <div className="ticket-strip"><span className="ticket-strip__label">GROUP PULSE</span><div className="ticket-strip__track"><div className="ticket-strip__move">{[...items,...items].map((item,i)=><span key={i} className={item.tone?`is-${item.tone}`:""}>{item.label}<i/></span>)}</div></div></div>;
}

export function Gauge({ value, label, sub, tone="teal" }: { value:number; label:string; sub?:string; tone?:"teal"|"red" }) {
  const safe=Math.max(0,Math.min(100,value));
  return <div className={`gauge gauge--${tone}`} style={{"--gauge":`${safe*1.8}deg`} as CSSProperties}>
    <div className="gauge__arc"><i/></div><div className="gauge__value"><strong><CountUp value={safe}/></strong><span>/100</span></div><div className="gauge__label"><b>{label}</b>{sub&&<small>{sub}</small>}</div>
  </div>;
}

export function SparkBars({ values, tone="teal" }: { values:number[]; tone?:"teal"|"red"|"cream" }) {
  const max=Math.max(...values,1);
  return <div className={`spark-bars spark-bars--${tone}`} aria-hidden="true">{values.map((v,i)=><i key={i} style={{height:`${Math.max(8,(v/max)*100)}%`,animationDelay:`${i*32}ms`}}/>)}</div>;
}

export function ScoreRail({ label, value, sub, tone="teal" }: { label:string; value:number; sub?:string; tone?:"teal"|"red" }) {
  return <div className={`score-rail score-rail--${tone}`}><span>{label}</span><strong>{value.toFixed(value%1?1:0)}</strong><div><i style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>{sub&&<small>{sub}</small>}</div>;
}

export function Delta({ value, suffix="%" }: { value:number; suffix?:string }) {
  return <span className={value<0?"delta-label is-negative":"delta-label"}>{value>0?"+":""}{value.toFixed(1)}{suffix}</span>;
}

export function DataStamp({ children }: { children:ReactNode }) { return <span className="data-stamp">{children}</span>; }

export function EmptyState({ code, title, copy }: { code:string; title:string; copy:string }) {
  return <div className="empty-state"><span>{code}</span><strong>{title}</strong><p>{copy}</p></div>;
}
