import { NextRequest, NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";

type ValidateKeyBody = { apiKey: string };

function isValidateKeyBody(x: unknown): x is ValidateKeyBody {
  return typeof x === "object" && x !== null && typeof (x as { apiKey?: unknown }).apiKey === "string";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // JSONは unknown として受ける
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  if (!isValidateKeyBody(body) || body.apiKey.length === 0) {
    return NextResponse.json({ error: "APIキーが必要です" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: body.apiKey });

  try {
    // 認証チェック：失敗すると APIError が投げられる
    await openai.models.list();
    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    // OpenAI のエラーならステータスで分岐
    if (err instanceof APIError) {
      if (err.status === 401) {
        return NextResponse.json({ error: "APIキーが無効です" }, { status: 401 });
      }
      // 他のAPIエラー
      return NextResponse.json({ error: err.message ?? "OpenAI API エラー" }, { status: err.status ?? 500 });
    }

    // それ以外の想定外エラー
    const message = err instanceof Error ? err.message : "APIキーの検証に失敗しました";
    console.error("API key validation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
