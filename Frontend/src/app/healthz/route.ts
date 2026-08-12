/**
 * Liveness for the frontend container.
 *
 * Deliberately does NOT touch the backend. This answers "is this Next server
 * up?", and nothing else — routing it through the BFF proxy would mean a
 * backend outage restart-looped the frontend, turning one failure into two.
 *
 * Backend readiness is a separate question, answered by the API's own
 * /health/ready and surfaced in the UI rather than by the platform.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "banking-frontend" });
}
