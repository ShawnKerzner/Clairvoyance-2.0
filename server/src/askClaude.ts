import Anthropic from "@anthropic-ai/sdk";

export const askClaude = async (apiKey: string, prompt: string) => {
  const client = new Anthropic({ apiKey: apiKey });
  const reply = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = reply.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Claude's reply had no text");
  }
  const text = textBlock.text;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const json = text.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Claude's reply wasn't valid JSON");
  }
};
