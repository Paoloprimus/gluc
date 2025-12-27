import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { input, apiKey } = await request.json();
    
    if (!input) {
      return NextResponse.json({ error: "Input richiesto" }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key richiesta" }, { status: 400 });
    }
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey,
    });
    
    // Ask Claude to suggest similar domains
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `L'utente ha cercato di visitare il dominio "${input}" ma non esiste o è scritto male.

Suggerisci 3-5 domini REALI e POPOLARI che l'utente potrebbe aver inteso. Considera:
- Errori di battitura comuni (es. "gogle" → "google")
- Nomi incompleti (es. "git" → "github", "gitlab")
- Domini simili nel settore

Rispondi SOLO con un array JSON di stringhe, senza markdown. Esempio: ["github.com", "gitlab.com"]

Se non riesci a trovare suggerimenti sensati, rispondi con un array vuoto: []`,
        },
      ],
    });
    
    // Parse response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "[]";
    
    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(responseText);
      // Ensure all suggestions are valid domain formats
      suggestions = suggestions
        .filter(s => typeof s === "string" && s.length > 0)
        .map(s => s.toLowerCase().trim())
        .slice(0, 5);
    } catch {
      suggestions = [];
    }
    
    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error("Error suggesting domains:", error);
    return NextResponse.json(
      { error: "Errore durante la ricerca di suggerimenti" },
      { status: 500 }
    );
  }
}

