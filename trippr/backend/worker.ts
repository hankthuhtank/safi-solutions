import { createTripprHandler } from "../_source/lib/trippr/handler";

// Optional separate backend. GitHub Pages itself cannot hold secrets or run this.
let handler: ReturnType<typeof createTripprHandler> | undefined;
export default {
  async fetch(request: Request, environment: Record<string, unknown>) {
    const origin = request.headers.get("Origin");
    const allowed = ["https://www.safisolutions.org", "https://safisolutions.org"];
    if (origin && !allowed.includes(origin)) return new Response("Origin not allowed", { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin || allowed[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers });
    handler ||= createTripprHandler(environment);
    const response = await handler(request);
    return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...headers } });
  },
};
