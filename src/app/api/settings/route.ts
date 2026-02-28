import { NextResponse } from "next/server";
import { DEFAULT_MODEL } from "@/lib/constants";

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  return NextResponse.json({
    apiKeyConfigured: !!anthropicKey && anthropicKey.length > 0,
    braveKeyConfigured: !!braveKey && braveKey.length > 0,
    provider: "anthropic",
    model: DEFAULT_MODEL,
  });
}
