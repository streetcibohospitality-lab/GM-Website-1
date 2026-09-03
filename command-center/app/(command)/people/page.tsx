import { PeopleLifecycle } from "@/components/people-lifecycle";
import { getPeopleDashboardData } from "@/lib/people";
export default async function PeoplePage(){const data=await getPeopleDashboardData();return <PeopleLifecycle data={data}/>;}
