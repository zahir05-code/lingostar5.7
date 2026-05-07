import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { word } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an English teacher. Return the meaning and an example sentence for the given word in JSON format: { \"word\": string, \"meaning\": string, \"example\": string }. The meaning MUST be in Korean.",
          },
          { role: "user", content: word },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error("Dictionary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch word meaning" }, { status: 500 });
  }
}
