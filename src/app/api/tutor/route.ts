import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import type { TutorLanguage, TutorMode } from "@/types/tutor";

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurada.");
  return new Groq({ apiKey: key });
}

const GROQ_MODEL = "llama-3.1-8b-instant";

function systemPrompt(lang: TutorLanguage, mode: TutorMode): string {
  const langName = lang === "en" ? "inglês" : "alemão";
  const targetLang = lang === "en" ? "English" : "German";

  switch (mode) {
    case "translate":
      return `You are a translator. The user will write in any language (often Portuguese). Your ONLY task is to respond with the translation into ${targetLang}. Do not correct, explain, or add anything. Just the translation.`;

    case "explain":
      return `You are a friendly ${langName} language tutor. The user may write in Portuguese or ${targetLang}.
For each message you must respond with a JSON object (no markdown, no extra text) with exactly these keys:
- "corrected": string - the corrected version of what they wrote (in ${targetLang})
- "translation": string - if they wrote in Portuguese, the translation to ${targetLang}; otherwise empty string
- "explanation": string - brief explanation of what was wrong and why (in Portuguese)
- "naturalSuggestion": string - a more natural or idiomatic version of the phrase in ${targetLang}
- "score": number - a grade from 0 to 10 for their attempt

Example format: {"corrected":"...","translation":"...","explanation":"...","naturalSuggestion":"...","score":7}`;

    case "correct":
      return `The user will write in English. Your ONLY task is to respond with the corrected English text. Do not explain, translate, or add anything. Just the corrected sentence.`;

    case "informal":
      return `The user will send you phrases in English. Your tasks:
1. Rewrite the phrase in the most informal, casual, day-to-day English possible. Use contractions, slang, and natural spoken English. If the phrase is already correct and casual, keep it as is.
2. If the original phrase was already correct and natural, set "alreadyCorrect" to true; otherwise false.
3. Provide the translation to Portuguese (Brazil).

Respond with a JSON object only (no markdown, no extra text), with exactly these keys:
- "informal": string - the phrase in casual/informal English
- "alreadyCorrect": boolean - true if the original was already correct and casual
- "translation": string - translation to Portuguese (Brazil)

Example: {"informal":"Yeah, that's totally fine by me.","alreadyCorrect":false,"translation":"Sim, pra mim tá tranquilo."}`;
  }
}

export async function POST(req: Request) {
  try {
    const { language, mode, messages } = (await req.json()) as {
      language: TutorLanguage;
      mode: TutorMode;
      messages: { role: "user" | "assistant"; content: string }[];
    };

    const groq = getGroq();
    const system = systemPrompt(language, mode);
    const chatMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: chatMessages,
      temperature: 0.3,
    });

    const content =
      completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Tutor API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar." },
      { status: 500 }
    );
  }
}
