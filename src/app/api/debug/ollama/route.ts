import { NextResponse } from "next/server";

// Route de DIAGNOSTIC temporaire : ouvre /api/debug/ollama dans le navigateur.
// Elle exécute l'appel à Ollama DEPUIS Vercel et renvoie ce que voit le serveur
// (statut HTTP, en-têtes Cloudflare, début du corps). À SUPPRIMER après debug.
export const maxDuration = 30;

export async function GET() {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim().replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL?.trim() || "phi35-financial:latest";
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  const authHeaders = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  const out: Record<string, unknown> = {
    env: {
      OLLAMA_BASE_URL: baseUrl ?? null,
      OLLAMA_MODEL: model,
      hasApiKey: Boolean(apiKey),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      vercelRegion: process.env.VERCEL_REGION ?? null,
    },
  };

  if (!baseUrl) {
    out.error = "OLLAMA_BASE_URL absent en prod (variable d'env non prise en compte)";
    return NextResponse.json(out, { status: 200 });
  }

  // 1) GET /api/tags  -> joignabilité simple depuis Vercel
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      headers: { ...authHeaders },
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    out.tags = {
      status: res.status,
      ok: res.ok,
      server: res.headers.get("server"),
      cfRay: res.headers.get("cf-ray"),
      cfMitigated: res.headers.get("cf-mitigated"),
      bodySnippet: text.slice(0, 300),
    };
  } catch (error) {
    out.tags = { error: String(error) };
  }

  // 2) POST /api/chat -> teste l'appel réel + mesure la latence
  try {
    const started = Date.now();
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const text = await res.text();
    out.chat = {
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - started,
      bodySnippet: text.slice(0, 300),
    };
  } catch (error) {
    out.chat = { error: String(error) };
  }

  return NextResponse.json(out, { status: 200 });
}
