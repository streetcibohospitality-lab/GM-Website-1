import { clerkMiddleware } from "@clerk/nextjs/server";
const allowedOrigins=(process.env.GM_DASH_ALLOWED_ORIGINS||"").split(",").map(v=>v.trim()).filter(Boolean);
export default clerkMiddleware(async(auth,req)=>{const path=req.nextUrl.pathname;if(!path.startsWith("/sign-in")&&!path.startsWith("/__clerk")&&path!=="/robots.txt"&&path!=="/api/health")await auth.protect();},{contentSecurityPolicy:{strict:true,directives:{"object-src":["'none'"],"base-uri":["'self'"],"frame-ancestors":["'none'"]}},...(allowedOrigins.length?{authorizedParties:allowedOrigins}:{})});
export const config={matcher:["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)","/(api|trpc)(.*)","/__clerk/(.*)"]};
