export default async function handler(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response("MCP Governance Server", { status: 200 });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    return new Response(JSON.stringify({ ok: true, method: body?.method }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
