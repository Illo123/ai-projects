import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type GenerateInput,
} from "@/lib/prompt";
import {
  checkRateLimit,
  getClientIp,
  HOUR_LIMIT,
  DAY_LIMIT,
} from "@/lib/rateLimit";

// In-memory rate limit needs a single, long-running Node process.
export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    const message =
      limit.reason === "day"
        ? `Tageslimit erreicht (${DAY_LIMIT} Anfragen/Tag). Bitte morgen erneut versuchen.`
        : `Stundenlimit erreicht (${HOUR_LIMIT} Anfragen/Stunde). Bitte später erneut versuchen.`;
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  const body = (await req.json()) as Partial<GenerateInput>;

  if (!body.profile || !body.thema) {
    return NextResponse.json(
      { error: "profile und thema sind erforderlich" },
      { status: 400 },
    );
  }

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: buildSystemPrompt(body.profile),
    messages: [{ role: "user", content: buildUserPrompt(body.thema) }],
  });

  const encoder = new TextEncoder();
  const sseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`,
              ),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream-Fehler";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sseBody, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
