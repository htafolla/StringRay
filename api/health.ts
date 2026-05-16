import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok", time: Date.now() }));
}
