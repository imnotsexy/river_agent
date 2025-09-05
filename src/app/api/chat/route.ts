import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 });
    }

    // 環境変数またはリクエストから送信されたAPIキーを使用
    const finalApiKey = process.env.OPENAI_API_KEY || apiKey;

    if (!finalApiKey) {
      return NextResponse.json({ error: 'APIキーが設定されていません。環境変数またはアプリ内設定でAPIキーを設定してください。' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: finalApiKey,
    });

    // 環境変数からファインチューニングモデルIDを取得、なければデフォルト値を使用
    const modelId = process.env.OPENAI_FINETUNED_MODEL || "ft:gpt-4o-2024-08-06:kimurist:jmultiwoz-dialogue:CC4srHVS";

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: "あなたはRiver Agentという親切なAIアシスタントです。日本語で自然に会話してください。ユーザーの質問や要求に対して適切に応答してください。"
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'すみません、応答を生成できませんでした。';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return NextResponse.json({ error: 'AI応答の生成に失敗しました' }, { status: 500 });
  }
}