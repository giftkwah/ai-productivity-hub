import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createRunIdFetch, getRunId, withRunId } from "./run-id.server";

const instructions: Record<string, string> = {
  email: "You are an expert workplace email writer. Return a ready-to-send email with a clear subject line. Match the requested tone, stay concise, and never invent facts.",
  meeting: "You are a meeting analyst. Return a concise markdown summary with sections: Overview, Key decisions, Action items (owner and deadline when present), and Open questions. Do not invent missing details.",
  tasks: "You are a pragmatic work planner. Turn the goal into a prioritized markdown plan with P1/P2/P3 priorities, concrete next actions, dependencies, and a realistic suggested sequence.",
  research: "You are a workplace research assistant. Give a structured, concise answer with headings, key findings, implications, and verification notes. Clearly flag uncertainty and never fabricate sources.",
  chat: "You are Orbit, a clear and practical workplace productivity assistant. Help with communication, planning, meetings, research, and everyday work questions. Use concise markdown and ask a clarifying question only when essential.",
};

export async function handleChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ message: "AI is not configured for this workspace." }, { status: 401 });

  const body = (await request.json()) as { messages?: UIMessage[]; mode?: string };
  if (!Array.isArray(body.messages)) return Response.json({ message: "Messages are required." }, { status: 400 });
  const mode = body.mode && instructions[body.mode] ? body.mode : "chat";
  const gateway = createRunIdFetch(getRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: gateway.fetch,
  });

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: instructions[mode],
    messages: await convertToModelMessages(body.messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withRunId(
    result.toUIMessageStreamResponse({ originalMessages: body.messages, sendReasoning: true }),
    gateway,
  );
}