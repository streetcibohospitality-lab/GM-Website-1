import "server-only";
import { db } from "@/lib/db";
import { staff as demoStaff } from "@/lib/demo-data";
import { demoDataAllowed } from "@/lib/runtime-mode";

export type PeopleStaffRow = {
  id: string;
  employeeCode: string;
  fullName: string;
  roleTitle: string;
  outletCode: string;
  outletName: string;
  joiningDate: string | null;
  status: string;
  monthlyCost: number;
  currentSalary: number;
  salaryEffectiveFrom: string | null;
  noticeGivenDate: string | null;
  lastWorkingDate: string | null;
  daysRemaining: number | null;
  latestRating: number | null;
  latestRatingMonth: string | null;
};

export type PeopleDashboardData = {
  staff: PeopleStaffRow[];
  avgRating: number | null;
  reviewsDue: number;
  noticeCount: number;
  joiningThisMonth: number;
  loadError?: boolean;
};

function demoData(): PeopleDashboardData {
  const rows: PeopleStaffRow[] = demoStaff.map((s, index) => ({
    id: `demo-${index + 1}`,
    employeeCode: s.id,
    fullName: s.name,
    roleTitle: s.role,
    outletCode: s.outlet,
    outletName: s.outlet,
    joiningDate: s.joined,
    status: s.status.toLowerCase(),
    monthlyCost: s.monthlyCost,
    currentSalary: s.monthlyCost,
    salaryEffectiveFrom: s.joined,
    noticeGivenDate: s.status === "Notice" ? "2026-08-18" : null,
    lastWorkingDate: s.status === "Notice" ? "2026-09-17" : null,
    daysRemaining: s.status === "Notice" ? 23 : null,
    latestRating: s.status === "Notice" ? 7.1 : 7.4 + ((index * 7) % 21) / 10,
    latestRatingMonth: "AUG 2026",
  }));
  const ratings = rows.map((r) => r.latestRating).filter((v): v is number => v != null);
  return {
    staff: rows,
    avgRating: ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : null,
    reviewsDue: 4,
    noticeCount: rows.filter((r)=>r.status === "notice").length,
    joiningThisMonth: 2,
  };
}

export async function getPeopleDashboardData(): Promise<PeopleDashboardData> {
  const allowDemo=demoDataAllowed();
  const empty:PeopleDashboardData={staff:[],avgRating:null,reviewsDue:0,noticeCount:0,joiningThisMonth:0};
  if (!process.env.DATABASE_URL) return allowDemo?demoData():empty;
  try {
    const rows = await db()`
      SELECT s.id,s.employee_code,s.full_name,s.role_title,s.joining_date,s.status,
             COALESCE(s.monthly_cost,0) AS monthly_cost,
             COALESCE(s.current_monthly_salary,0) AS current_monthly_salary,s.salary_effective_from,
             s.notice_given_date,s.planned_last_working_date,
             CASE WHEN s.planned_last_working_date IS NOT NULL THEN s.planned_last_working_date-CURRENT_DATE END AS days_remaining,
             COALESCE(o.code,'—') AS outlet_code,COALESCE(o.name,'Unassigned') AS outlet_name,
             lp.overall_rating,lp.year,lp.month
      FROM staff_members s
      LEFT JOIN outlets o ON o.id=s.home_outlet_id
      LEFT JOIN v_staff_latest_performance lp ON lp.staff_id=s.id
      ORDER BY CASE s.status WHEN 'notice' THEN 0 WHEN 'active' THEN 1 WHEN 'leave' THEN 2 ELSE 3 END,s.full_name
    `;
    if (!rows.length) return allowDemo?demoData():empty;
    const staff = rows.map((r:any):PeopleStaffRow=>({
      id:String(r.id),employeeCode:String(r.employee_code||"—"),fullName:String(r.full_name),roleTitle:String(r.role_title),
      outletCode:String(r.outlet_code),outletName:String(r.outlet_name),joiningDate:r.joining_date?String(r.joining_date):null,status:String(r.status),
      monthlyCost:Number(r.monthly_cost||0),currentSalary:Number(r.current_monthly_salary||0),salaryEffectiveFrom:r.salary_effective_from?String(r.salary_effective_from):null,noticeGivenDate:r.notice_given_date?String(r.notice_given_date):null,lastWorkingDate:r.planned_last_working_date?String(r.planned_last_working_date):null,
      daysRemaining:r.days_remaining==null?null:Number(r.days_remaining),latestRating:r.overall_rating==null?null:Number(r.overall_rating),
      latestRatingMonth:r.year&&r.month?`${String(r.month).padStart(2,"0")}/${r.year}`:null,
    }));
    const ratings=staff.map((r)=>r.latestRating).filter((v):v is number=>v!=null);
    const now=new Date();
    return {
      staff,
      avgRating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null,
      reviewsDue:staff.filter((r)=>r.status==="active"&&r.latestRatingMonth==null).length,
      noticeCount:staff.filter((r)=>r.status==="notice").length,
      joiningThisMonth:staff.filter((r)=>{if(!r.joiningDate)return false;const d=new Date(`${r.joiningDate}T00:00:00`);return d.getUTCFullYear()===now.getUTCFullYear()&&d.getUTCMonth()===now.getUTCMonth();}).length,
    };
  } catch (error) {
    console.error("People dashboard query failed",error);
    return allowDemo?demoData():{...empty,loadError:true};
  }
}
