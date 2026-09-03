import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Big_Shoulders, Lexend } from "next/font/google";
import { SessionSecurityGuard } from "@/components/session-security-guard";
import "./globals.css";

const jaro=Big_Shoulders({subsets:["latin"],weight:["500","700","800"],variable:"--font-jaro",display:"swap"});
const lexend=Lexend({subsets:["latin"],variable:"--font-lexend",display:"swap"});

export const metadata:Metadata={
  title:{default:"Grub Monkeys Command Center",template:"%s · GM Command Center"},
  description:"Private Grub Monkeys Owner command center",
  robots:{index:false,follow:false,nocache:true,googleBot:{index:false,follow:false,noimageindex:true}}
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <ClerkProvider><html lang="en" className={`${jaro.variable} ${lexend.variable}`}><body><SessionSecurityGuard/>{children}</body></html></ClerkProvider>;
}
