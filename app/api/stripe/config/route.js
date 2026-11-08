import { stripeSaleStatus } from "@/lib/server/stripeConfig";

// Public: whether Pro can be bought right now and which plans. No secrets.
export async function GET() {
  return Response.json(stripeSaleStatus(), { headers: { "Cache-Control": "public, max-age=300" } });
}
