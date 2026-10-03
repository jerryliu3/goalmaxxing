import { describe, expect, it } from "vitest";
import { digestPayloadSchema } from "./check-in";

describe("shared check-in snapshot",()=>{
  const window={label:"Today",start:"2026-10-01",end:"2026-10-01",placed:0,completed:0,estimatedMinutes:0,items:[]};
  const facts={recap:window,ahead:window,recover:{count:0,items:[]},unscheduled:{count:0,titles:[]}};
  const payload={schemaVersion:"1",id:"11111111-1111-4111-8111-111111111111",factsDigest:"revision",historicalFacts:facts,generatedAt:null,kind:"monthly",periodKey:"2026-10-01",localDate:"2026-10-01",digestAutoShow:true,acknowledged:false,shouldAutoShow:true,facts,suggestions:null};
  it("allows a computed snapshot before generating its briefing",()=>{expect(digestPayloadSchema.parse(payload).suggestions).toBeNull();});
  it("requires the snapshot identity used for acknowledgement and discussion",()=>{expect(digestPayloadSchema.safeParse({...payload,id:undefined}).success).toBe(false);});
});
