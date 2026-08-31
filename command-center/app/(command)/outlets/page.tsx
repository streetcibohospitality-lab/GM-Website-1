import { OutletsControl } from "@/components/outlets-control";
import { getOutlets,getReportingContext } from "@/lib/command-data";
export default async function OutletsPage(){const ctx=await getReportingContext();const outlets=await getOutlets(ctx);return <OutletsControl outlets={outlets} label={ctx.label}/>;}
