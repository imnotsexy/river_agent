// src/app/api/validate-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";

export async function POST(request: NextRequest) {
  // JSONは unknown で受けて安全に取り出す
  const raw = await request.json().catch(() => null) as unknown;
  const apiKey =
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as { apiKey?: unknown }).apiKey === "string"
      ? (raw as { apiKey: string }).apiKey
      : "";

  if (!apiKey) {
    return NextResponse.json({ error: "APIキーが必要です" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    await openai.models.list();
    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    // OpenAI SDK の型で安全に分岐
    if (err instanceof APIError) {
      if (err.status === 401) {
        return NextResponse.json({ error: "APIキーが無効です" }, { status: 401 });
      }
      return NextResponse.json(
        { error: err.message ?? "OpenAI API エラー" },
        { status: err.status ?? 500 }
      );
    }

    // 想定外エラー
    console.error("API key validation error:", err);
    const msg = err instanceof Error ? err.message : "APIキーの検証に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
