import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

// Use server-side API key (not exposed to client)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface PageData {
  title: string;
  content: string;
  ogImage: string | null;
  fetchFailed: boolean;
}

async function fetchPageContent(url: string): Promise<PageData> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FliqkBot/1.0)",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || url;
    
    // Extract og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const ogImage = ogImageMatch?.[1] || null;
    
    // Extract description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = ogDescMatch?.[1] || descMatch?.[1] || "";
    
    // Extract main text content (simplified)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyText = "";
    if (bodyMatch) {
      bodyText = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
    }
    
    return {
      title: title.trim(),
      content: `${metaDesc}\n\n${bodyText}`.trim(),
      ogImage,
      fetchFailed: false,
    };
  } catch (error) {
    console.error("Error fetching page:", error);
    return {
      title: url,
      content: "",
      ogImage: null,
      fetchFailed: true,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL richiesto" }, { status: 400 });
    }
    
    // Fetch page content
    const pageData = await fetchPageContent(url);
    
    // If fetch failed, return special error for domain suggestions
    if (pageData.fetchFailed) {
      return NextResponse.json(
        { error: "Dominio non trovato", code: "DOMAIN_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    // Analyze with Claude Haiku (faster and cheaper!)
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // ~10x cheaper than Sonnet
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analizza questo contenuto web e restituisci un JSON con:
- "title": titolo migliorato/pulito (max 80 caratteri)
- "description": descrizione breve del contenuto (max 150 caratteri, in italiano)
- "tags": array di 3-5 tag rilevanti (singole parole, senza #, in italiano, lowercase)

URL: ${url}
Titolo originale: ${pageData.title}
Contenuto: ${pageData.content.slice(0, 2000)}

Rispondi SOLO con il JSON, senza markdown o altro.`,
        },
      ],
    });
    
    // Parse response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      // Fallback if JSON parsing fails
      analysis = {
        title: pageData.title,
        description: "",
        tags: [],
      };
    }
    
    return NextResponse.json({
      title: analysis.title || pageData.title,
      description: analysis.description || "",
      tags: analysis.tags || [],
      thumbnail: pageData.ogImage,
    });
    
  } catch (error) {
    console.error("Error analyzing link:", error);
    return NextResponse.json(
      { error: "Errore durante l'analisi del link" },
      { status: 500 }
    );
  }
}
