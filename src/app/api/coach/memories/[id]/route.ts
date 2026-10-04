import { z } from "zod";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, coachParam, withCoachRoute } from "@/lib/coach/api";
const mutationSchema = z.object({ version:z.number().int().nonnegative(), content:z.string().trim().min(1).max(1000).optional() }).strict();
async function handle(request:Request,params:{params:Promise<{id:string}>}) {
  return withCoachRoute(request,async context => {
    const id = await coachParam(params);
    const body = await parseJsonBody({request,schema:mutationSchema});
    if(request.method==='PATCH'&&!body.content) throw new ApiRouteError(400,'validation_failed','Memory content is required.');
    const table=context.admin.from('coach_memories');
    const query=request.method==='DELETE'?table.delete():table.update({content:body.content,version:body.version+1,updated_at:new Date().toISOString(),source_message_id:null});
    const result=await query.eq('id',id).eq('owner_id',context.userId).eq('version',body.version).select('id').maybeSingle();
    coachDatabaseError(result.error);
    if(!result.data) throw new ApiRouteError(409,'memory_conflict','This memory changed. Refresh and try again.');
    return {updated:true};
  });
}
export const PATCH=handle;
export const DELETE=handle;
