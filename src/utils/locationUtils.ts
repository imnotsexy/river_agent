// src/utils/locationUtils.ts

/**
 * テキストから場所に関するキーワードを検出
 */
export function detectLocation(text: string): string | null {
  const locationKeywords = [
    // 一般的な場所キーワード
    '公園', 'パーク', '図書館', 'カフェ', 'レストラン', 'ジム', 'スポーツクラブ',
    '病院', '駅', '空港', '博物館', '美術館', '映画館', 'デパート', 'ショッピングモール',
    '学校', '大学', 'オフィス', 'ホテル', '銀行', 'コンビニ', 'スーパー',
    // 地名パターン（〜市、〜区、〜町、〜県など）
    '市', '区', '町', '県', '都', '府', '村',
    // その他の場所表現
    'に行く', 'へ行く', 'で会う', 'まで歩く', 'に向かう', 'を訪れる', 'で食事',
    '散歩', 'ウォーキング', 'ランニング', 'サイクリング'
  ];

  // 場所らしいキーワードを検出
  const foundKeyword = locationKeywords.find(keyword => text.includes(keyword));
  
  if (foundKeyword) {
    // より具体的な場所名を抽出する試み
    const words = text.split(/[\s、。！？\n]/);
    
    // キーワードを含む単語やその前後の単語から場所名を推測
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.includes(foundKeyword)) {
        // 前の単語と組み合わせて場所名を作成
        if (i > 0 && words[i-1].length > 0) {
          return words[i-1] + word;
        }
        return word;
      }
    }
    
    return foundKeyword;
  }

  return null;
}

/**
 * 場所名からGoogleマップのURLを生成
 */
export function generateMapUrl(location: string): string {
  const encodedLocation = encodeURIComponent(location);
  return `https://www.google.com/maps/search/${encodedLocation}`;
}

/**
 * テキストに場所が含まれている場合、Mapリンク付きのHTMLを生成
 */
export function addMapLinkToText(text: string): { text: string; hasMap: boolean } {
  const location = detectLocation(text);
  
  if (location) {
    const mapUrl = generateMapUrl(location);
    const mapLink = `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline">
      📍 ${location}をマップで見る
    </a>`;
    
    return {
      text: text + '\n\n' + mapLink,
      hasMap: true
    };
  }
  
  return { text, hasMap: false };
}