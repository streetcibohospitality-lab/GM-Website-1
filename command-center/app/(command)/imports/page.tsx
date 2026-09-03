import { ImportCenter } from "@/components/import-center";
import { getImportHistory } from "@/lib/command-data";
export default async function ImportsPage(){const importHistory=await getImportHistory();return <ImportCenter importHistory={importHistory}/>;}
