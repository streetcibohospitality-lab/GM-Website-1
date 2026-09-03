export type ForecastInput={mtdRevenue:number;targetRevenue:number;elapsedDays:number;daysInMonth:number;previousMonthComparable?:number};
export type ForecastResult={projectedRevenue:number;requiredDailyRevenue:number;pacePct:number;targetPct:number;gap:number;status:"ahead"|"on_track"|"at_risk"};
export function monthEndForecast(input:ForecastInput):ForecastResult{
 const elapsed=Math.max(1,Math.min(input.elapsedDays,input.daysInMonth));
 const remaining=Math.max(0,input.daysInMonth-elapsed);
 const projected=(input.mtdRevenue/elapsed)*input.daysInMonth;
 const gap=projected-input.targetRevenue;
 const requiredDailyRevenue=remaining>0?Math.max(0,(input.targetRevenue-input.mtdRevenue)/remaining):0;
 const pacePct=input.targetRevenue>0?(projected/input.targetRevenue)*100:0;
 const targetPct=input.targetRevenue>0?(input.mtdRevenue/input.targetRevenue)*100:0;
 const status=pacePct>=103?"ahead":pacePct>=98?"on_track":"at_risk";
 return{projectedRevenue:projected,requiredDailyRevenue,pacePct,targetPct,gap,status};
}
