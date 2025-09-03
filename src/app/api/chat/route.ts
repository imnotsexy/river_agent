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

    const completion = await openai.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:kimurist:travel-jp-gpu:CBaBln2U",
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