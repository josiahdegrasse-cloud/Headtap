import {useState,type ReactNode} from 'react';
import {CalendarDays,MapPin,Wallet,SlidersHorizontal,Check} from 'lucide-react';
import {Button} from './ui/button';
import {weekendRange} from '../utils/nightOut';
export interface FilterOptions {
  selectedGenres: string[];
  minCost: number;
  maxCost: number;
  ticketCount: number;
  jointBudget: number;
  sortBy: 'vibe' | 'cost_low' | 'cost_high' | 'date';
  dateRange: 'all' | 'weekend' | 'week' | 'month' | '3months';
  distance: number; // in miles
}

const choiceClass=(active:boolean)=>`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${active?'bg-orange-50 border-orange-600 text-orange-900 ring-1 ring-orange-600':'bg-white border-stone-200 text-stone-600 hover:border-orange-300 hover:bg-orange-50/50'}`;
export function ConcertFilters({filters,onFilterChange,availableGenres,discovery}:{filters:FilterOptions;onFilterChange:(value:FilterOptions)=>void;availableGenres:string[];discovery?:ReactNode;concertCount?:number;filteredCount?:number}) {
 const [advanced,setAdvanced]=useState(false);
 const [custom,setCustom]=useState(false);
 const change=(patch:Partial<FilterOptions>)=>onFilterChange({...filters,...patch});
 const weekend=weekendRange();const end=new Date(weekend.end);end.setDate(end.getDate()-1);
 const dates=[['all','Any time'],['weekend','This weekend'],['week','Next 7 days'],['month','Next 30 days'],['3months','Next 3 months']] as const;
 const hasCustom=Number.isFinite(filters.maxCost)&&![0,50,100].includes(filters.maxCost);
 return <section aria-label="Plan your show" className="rounded-2xl border border-stone-200 bg-white mb-6 overflow-hidden">
 <div className="p-4 sm:p-5 space-y-5">
 <fieldset><legend className="flex items-center gap-2 font-semibold text-sm mb-3"><CalendarDays className="w-4 h-4 text-orange-600"/>When are you free?</legend><div className="flex flex-wrap gap-2">{dates.map(([value,label])=><button key={value} className={choiceClass(filters.dateRange===value)} aria-pressed={filters.dateRange===value} onClick={()=>change({dateRange:value})}>{label}</button>)}</div>{filters.dateRange==='weekend'&&<p className="text-xs text-stone-500 mt-2">{weekend.start.toLocaleDateString()}–{end.toLocaleDateString()} · Venue-local dates</p>}</fieldset>
 <div className="grid lg:grid-cols-2 gap-5">
 <fieldset><legend className="flex items-center gap-2 font-semibold text-sm mb-3"><MapPin className="w-4 h-4 text-orange-600"/>How far would you go?</legend><div className="grid grid-cols-4 gap-2">{[10,25,50,100].map(m=><button key={m} className={choiceClass(filters.distance===m)} aria-pressed={filters.distance===m} onClick={()=>change({distance:m})}>{m} mi</button>)}</div></fieldset>
 <fieldset><legend className="flex items-center gap-2 font-semibold text-sm mb-3"><Wallet className="w-4 h-4 text-orange-600"/>Budget per ticket</legend><div className="flex flex-wrap gap-2">{[[Infinity,'Any price'],[0,'Free'],[50,'Up to $50'],[100,'Up to $100']].map(([value,label])=><button key={String(value)} className={choiceClass(filters.maxCost===value)} aria-pressed={filters.maxCost===value} onClick={()=>{setCustom(false);change({minCost:0,maxCost:Number(value)});}}>{label}</button>)}<button className={choiceClass(custom||hasCustom)} aria-expanded={custom||hasCustom} onClick={()=>setCustom(!custom)}>Custom</button></div>{(custom||hasCustom)&&<label className="block text-xs text-stone-600 mt-3">Maximum price in USD<input autoFocus={custom} className="block h-11 border border-stone-300 rounded-lg px-3 mt-1 w-full" type="number" min="0" placeholder="Enter amount" value={Number.isFinite(filters.maxCost)?filters.maxCost:''} onChange={e=>change({minCost:0,maxCost:e.target.value===''?Infinity:Math.max(0,Number(e.target.value))})}/></label>}</fieldset>
 </div>
 {Number.isFinite(filters.maxCost)&&<p className="text-xs text-stone-500">Prices are in USD, before fees. Shows without a known price are excluded.</p>}
 {discovery}
 </div>
 <div className="border-t border-stone-100 bg-stone-50/50 p-3 sm:px-5"><div className="flex items-center justify-between gap-2"><Button variant="ghost" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}><SlidersHorizontal className="w-4 h-4"/>{advanced?'Fewer filters':'Genres & group budget'}</Button><Button variant="ghost" onClick={()=>{change({dateRange:'all',distance:25,minCost:0,maxCost:Infinity,jointBudget:0,ticketCount:1,selectedGenres:[]});setCustom(false);}}>Reset filters</Button></div>{advanced&&<div className="space-y-4 py-3"><div className="flex flex-wrap gap-2">{availableGenres.map(g=><button key={g} aria-pressed={filters.selectedGenres.includes(g)} className={choiceClass(filters.selectedGenres.includes(g))} onClick={()=>change({selectedGenres:filters.selectedGenres.includes(g)?filters.selectedGenres.filter(v=>v!==g):[...filters.selectedGenres,g]})}>{g}</button>)}</div><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Number of tickets<input type="number" min="1" value={filters.ticketCount} className="block border rounded-lg p-3 w-full mt-1" onChange={e=>change({ticketCount:Math.max(1,Math.floor(Number(e.target.value)))})}/></label><label className="text-sm">Total group budget (USD)<input type="number" min="0" placeholder="No limit" value={filters.jointBudget||''} className="block border rounded-lg p-3 w-full mt-1" onChange={e=>change({jointBudget:Math.max(0,Number(e.target.value))})}/></label></div></div>}</div>
 </section>;
}
