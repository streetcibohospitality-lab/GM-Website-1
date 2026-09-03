import { Overview } from "@/components/overview";
import { getOverviewData } from "@/lib/command-data";
export default async function OverviewPage(){ const data=await getOverviewData(); return <Overview data={data}/>; }
