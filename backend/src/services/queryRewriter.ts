import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });

export async function rewriteQuery(userMessage: string): Promise<string> {
  if (userMessage.length < 10) return userMessage;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Fix spelling and make the question clearer. Return ONLY the rewritten question. Do NOT change meaning.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });
    return response.choices[0].message.content?.trim() || userMessage;
  } catch {
    return userMessage;
  }
}
