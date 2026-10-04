import { coachPageSchema } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { withCoachRoute } from "@/lib/coach/api";
import { loadCoachContext } from "@/lib/coach/context";
export async function GET(request:Request) {
  return withCoachRoute(request,async context=>{
    const raw=new URL(request.url).searchParams.get('page')??'{"surface":"plan"}';
    if(raw.length>3000) throw new ApiRouteError(400,'validation_failed','Page context is too large.');
    let data:unknown;
    try {data=JSON.parse(raw);} catch {throw new ApiRouteError(400,'validation_failed','Invalid page context.');}
    const page=coachPageSchema.safeParse(data);
    if(!page.success) throw new ApiRouteError(400,'validation_failed','Invalid page context.');
    return {context:await loadCoachContext(context,page.data)};
  });
}
