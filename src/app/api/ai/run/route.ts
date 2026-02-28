import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { webSearch, formatSearchContext } from "@/lib/search";
import { DEFAULT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/constants";

const resultSchema = z.object({
  title: z.string().describe("A concise title summarizing the response"),
  summary: z
    .string()
    .describe("A brief 1-2 sentence summary of the response"),
  body: z.string().describe("The full response in markdown format"),
});

export async function POST(request: Request) {
  try {
    const { taskId, prompt } = await request.json();

    if (!taskId || !prompt) {
      return NextResponse.json(
        { error: "taskId and prompt are required" },
        { status: 400 },
      );
    }

    // Pre-search: fetch web results and inject as context
    const searchResults = await webSearch(prompt);
    const searchContext = formatSearchContext(searchResults);

    const fullPrompt = searchContext
      ? `${searchContext}\n\n---\n\nUser request: ${prompt}\n\nUse the web search results above to inform your response where relevant.`
      : prompt;

    const model = anthropic(DEFAULT_MODEL);

    const { object, usage } = await generateObject({
      model,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      schema: resultSchema,
      prompt: fullPrompt,
    });

    return NextResponse.json({
      result: {
        title: object.title,
        summary: object.summary,
        body: object.body,
        model: DEFAULT_MODEL,
      },
      tokensUsed: {
        input: usage.inputTokens ?? 0,
        output: usage.outputTokens ?? 0,
      },
    });
  } catch (error) {
    console.error("AI run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
