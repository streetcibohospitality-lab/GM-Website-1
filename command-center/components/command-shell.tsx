"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ShellAlert = { id: string; severity: string; outlet: string; title: string; detail: string; age: string; owner: string };
type NavItem = readonly [string, string, string, string];
type NavGroup = { section: string; items: NavItem[] };

const nav: NavGroup[] = [
  {section:"COMMAND", items:[
    ["01","HQ","Overview","/overview"],
    ["02","OL","Outlets","/outlets"],
    ["03","₹","Financials","/financials"],
    ["04","SL","Sales Intelligence","/sales"],
    ["05","MN","Menu Intelligence","/menu-intelligence"]
  ]},
  {section:"OPERATIONS", items:[
    ["06","PP","People","/people"],
    ["07","IV","Inventory","/inventory"],
    ["08","PR","Procurement","/procurement"],
    ["09","EX","Expenses","/expenses"]
  ]},
  {section:"CONTROL", items:[
    ["10","CX","Customer Experience","/customer-experience"],
    ["11","MT","Maintenance","/maintenance"],
    ["12","OA","Outlet Audits","/outlet-audits"],
    ["13","CK","Daily Checklists","/checklists"],
    ["14","AL","Alerts","/alerts"],
    ["15","TK","Tasks","/tasks"],
    ["16","IN","Insights","/insights"]
  ]},
  {section:"MANAGEMENT", items:[
    ["17","RP","Reports","/reports"],
    ["18","DC","Documents","/documents"],
    ["19","IM","Imports","/imports"],
    ["20","SC","Security","/security"],
    ["21","ST","Settings","/settings"]
  ]}
];

const flat = nav.flatMap(group => group.items);

export function CommandShell({ children, userLabel = "OWNER", demo = false, periodLabel = "—", alertCount, alerts = [] }: { children: ReactNode; userLabel?: string; demo?: boolean; periodLabel?: string; alertCount?: number; alerts?: ShellAlert[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [palette,setPalette] = useState(false);
  const [query,setQuery] = useState("");
  const [alertsOpen,setAlertsOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setPalette(v=>!v);}
      if(event.key==="Escape"){setPalette(false);setAlertsOpen(false);}
    };
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[]);
  useEffect(()=>{
    if(!palette)return;
    const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const node=paletteRef.current;
    const trap=(event:KeyboardEvent)=>{
      if(event.key!=="Tab"||!node)return;
      const focusable=Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(el=>!el.hasAttribute("hidden"));
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    node?.addEventListener("keydown",trap);
    return()=>{node?.removeEventListener("keydown",trap);prior?.focus();};
  },[palette]);
  const results=useMemo(()=>flat.filter(item=>item[2].toLowerCase().includes(query.toLowerCase())).slice(0,8),[query]);
  return (
    <div className="command-shell">
      <aside className="command-rail">
        <Link href="/overview" className="brand-lockup" aria-label="Grub Monkeys Command Center home">
          <Image src="/grub-monkeys-logo.png" alt="Grub Monkeys" width={188} height={68} priority />
          <span>COMMAND CENTER</span>
        </Link>
        <div className="rail-rule" />
        <nav className="command-nav" aria-label="Command center sections">
          {nav.map(group=><div className="nav-group" key={group.section}><span className="nav-group__label">{group.section}</span>{group.items.map(([no,code,label,href]) => {
            const active = pathname === href || (href !== "/overview" && pathname.startsWith(href));
            return <Link key={href} href={href} className={active ? "command-nav__item is-active" : "command-nav__item"}>
              <span className="command-nav__no">{no}</span><span className="command-nav__code">{code}</span><span className="command-nav__label">{label}</span><span className="command-nav__tick" />
            </Link>;
          })}</div>)}
        </nav>
        <div className="rail-footer">
          <div className="system-beacon"><i /><span><b>HQ LINK</b><small>CONTROL PLANE ACTIVE</small></span></div>
          <button type="button" className="rail-shortcut" onClick={()=>setPalette(true)}><span>COMMAND SEARCH</span><kbd>⌘ K</kbd></button>
        </div>
      </aside>
      <section className="command-workspace">
        <header className="command-topbar">
          <div className="topbar-title"><span>REAL-TIME OVERVIEW OF YOUR BUSINESS PERFORMANCE</span><strong>WELCOME BACK, <em>{userLabel}</em></strong></div>
          <button className="topbar-search" onClick={()=>setPalette(true)}><span>SEARCH COMMAND CENTER</span><kbd>⌘ K</kbd></button>
          <div className="topbar-strip">
            {demo && <div className="data-mode"><span>DATA</span><strong>DEMO</strong></div>}
            <div className="period-chip"><span>PERIOD</span><strong>{periodLabel.toUpperCase()}</strong></div>
            <div className="sync-chip"><i /><span><small>SYNC</small><strong>READY</strong></span></div>
            <button type="button" className="alert-chip" onClick={()=>setAlertsOpen(v=>!v)} aria-label="Open command alerts" aria-expanded={alertsOpen}><i/><b>{alertCount??alerts.length}</b></button>
            <div className="owner-chip"><small>SECURE OWNER</small><strong>{userLabel}</strong></div>
          </div>
        </header>
        <div className="top-red-rule"><span /></div>
        <div className="command-content">{children}</div>
      </section>
      {palette&&<div className="command-modal" onMouseDown={()=>setPalette(false)}><div ref={paletteRef} className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-palette-title" onMouseDown={e=>e.stopPropagation()}>
        <div className="palette-head"><span id="command-palette-title">GM / COMMAND SEARCH</span><button type="button" onClick={()=>setPalette(false)} aria-label="Close command search">ESC</button></div>
        <input autoFocus aria-label="Search Command Center pages" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pages, outlets, reports…" />
        <div className="palette-results">{results.map(([no,code,label,href],i)=><button key={href} onClick={()=>{setPalette(false);router.push(href)}}><b>{no}</b><span><strong>{label}</strong><small>{code} / NAVIGATION</small></span><em>{i===0?"↵":"→"}</em></button>)}</div>
        <footer><span>TIP</span><p>Use this as the fastest way to move around the management system.</p></footer>
      </div></div>}
      {alertsOpen&&<aside className="alert-drawer" role="dialog" aria-label="Command alerts"><div className="drawer-head"><span>HQ / LIVE EXCEPTIONS</span><button onClick={()=>setAlertsOpen(false)}>×</button></div>
        <div className="drawer-stat"><span>{String(alertCount??alerts.length).padStart(2,"0")} OPEN</span><strong>{String(alerts.filter(a=>a.severity==="critical").length).padStart(2,"0")} CRITICAL</strong></div>
        {alerts.length ? alerts.map((alert)=><Link key={alert.id} href="/alerts" onClick={()=>setAlertsOpen(false)} className={`drawer-alert ${alert.severity==="critical"?"is-critical":alert.severity==="high"?"is-high":""}`}><b>{alert.outlet}</b><span><strong>{alert.title}</strong><small>{alert.detail}{alert.age?` · ${alert.age}`:""}</small></span><em>→</em></Link>) : <div className="drawer-alert"><b>HQ</b><span><strong>No open exceptions</strong><small>Control queue is clear for the current reporting context.</small></span></div>}
        <Link href="/alerts" onClick={()=>setAlertsOpen(false)} className="drawer-foot">OPEN OPERATIONS QUEUE →</Link>
      </aside>}
    </div>
  );
}
