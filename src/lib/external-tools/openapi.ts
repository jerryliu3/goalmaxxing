import { z } from "zod";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { externalResourceUrl } from "./oauth";
import { operationSchemas } from "./schemas";
import { httpRoutes, operationMetadata } from "./catalog";

export function buildExternalOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of httpRoutes) {
    const schema = z.toJSONSchema(operationSchemas[route.operation], { io: "input", unrepresentable: "any" }) as { properties?: Record<string, unknown>; required?: string[]; [key: string]: unknown };
    delete schema.$schema;
    const pathKeys = [...route.path.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
    const parameters = pathKeys.map(name => ({ name, in: "path", required: true, schema: { type: "string", format: "uuid" } }));
    for (const name of pathKeys) { if (schema.properties) delete schema.properties[name]; schema.required = schema.required?.filter(key => key !== name); }
    const operation: Record<string, unknown> = {
      operationId: route.operation,
      summary: operationMetadata[route.operation].title,
      description: operationMetadata[route.operation].description,
      security: [{ oauth: ["openid"] }],
      parameters,
      responses: Object.fromEntries([route.operation.startsWith("create_") ? "201" : "200", "400", "401", "403", "404", "409", "413", "422", "429", "503"].map(status => [status, { description: Number(status) < 300 ? "Successful account operation." : "Typed error with code, message and correlationId.", content: { "application/json": { schema: Number(status) < 300 ? { type: "object", properties: { schemaVersion: { const: "1" }, correlationId: { type: "string" } }, additionalProperties: true } : { $ref: "#/components/schemas/Error" } } } }])),
    };
    if (route.method === "GET") {
      for (const [name, property] of Object.entries(schema.properties ?? {})) parameters.push({ name, in: "query", required: schema.required?.includes(name) ?? false, schema: property as { type: string; format: string } });
    } else operation.requestBody = { required: true, content: { "application/json": { schema } } };
    (paths[route.path] ??= {})[route.method.toLowerCase()] = operation;
  }
  const { supabaseUrl } = getSupabaseConfig();
  return {
    openapi: "3.1.0", info: { title: "Goalmaxxing Account API", version: "1.0.0", description: "Deterministic account operations shared with Goalmaxxing MCP. No Goalmaxxing LLM calls. Goal updates are full definitions; read the goal first and preserve unchanged fields. OAuth grants existing account access, not fine-grained per-tool database scopes." },
    servers: [{ url: externalResourceUrl("/api/v1") }], paths,
    components: {
      securitySchemes: { oauth: { type: "oauth2", flows: { authorizationCode: { authorizationUrl: `${supabaseUrl}/auth/v1/oauth/authorize`, tokenUrl: `${supabaseUrl}/auth/v1/oauth/token`, scopes: { openid: "Connect your existing Goalmaxxing account" } } } } },
      schemas: { Error: { type: "object", required: ["code", "message", "correlationId"], properties: { code: { type: "string" }, message: { type: "string" }, correlationId: { type: "string" }, details: { type: "object", additionalProperties: true } } } },
    },
  };
}
