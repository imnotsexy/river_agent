import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが必要です' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    try {
      await openai.models.list();
      return NextResponse.json({ valid: true });
    } catch (error: any) {
      if (error.status === 401) {
        return NextResponse.json({ error: 'APIキーが無効です' }, { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    console.error('API key validation error:', error);
    return NextResponse.json({ error: 'APIキーの検証に失敗しました' }, { status: 500 });
  }
}