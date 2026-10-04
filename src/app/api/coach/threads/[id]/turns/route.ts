import { NextResponse } from "next/server";
import { coachTurnRequestSchema } from "@cadence/shared/coach";
import { ApiRouteError, parseJsonBody, withRoute } from "@/lib/api/route";
import { coachParam, requireCoachContext } from "@/lib/coach/api";
import { beginCoachTurn, generateCoachTurn } from "@/lib/coach/turns";
import { reportError } from "@/lib/observability/report-error";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request, params: { params: Promise<{ id: string }> }) {
  return withRoute(async ({ correlationId }) => {
    const context = await requireCoachContext(request);
    const id = await coachParam(params);
    const body = await parseJsonBody({ request, schema: coachTurnRequestSchema });
    const started = await beginCoachTurn(context, id, body);
    const encoder = new TextEncoder();
    let connected = true;
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: unknown) => {
          if (connected) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        emit("accepted", { run: started.run });
        try {
          if (started.created) await generateCoachTurn(context, id, started.run.id, body, stage => emit("stage", { stage }));
          emit("settled", { runId: started.run.id });
        } catch (error) {
          const code = error instanceof ApiRouteError ? error.code : "coach_response_failed";
          const failure = await context.admin.from("coach_runs").update({ status: "failed", error_code: code, completed_at: new Date().toISOString() }).eq("id", started.run.id).eq("owner_id", context.userId).eq("status", "running");
          if (failure.error) reportError(failure.error, { correlationId, code: "coach_run_failure_write" });
          reportError(error, { correlationId, code, status: error instanceof ApiRouteError ? error.status : 500 });
          emit("error", { code, message: error instanceof ApiRouteError ? error.message : "The coach couldn't finish. Your message is saved; you can retry.", correlationId });
        } finally {
          if (connected) controller.close();
        }
      },
      cancel() { connected = false; },
    });
    return new NextResponse(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no", "X-Correlation-Id": correlationId } });
  });
}
