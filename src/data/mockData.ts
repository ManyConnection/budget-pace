import { ZaimMoney, ZaimCategory, BudgetGoal } from '../types';

// カテゴリ定義
export const MOCK_CATEGORIES: ZaimCategory[] = [
  { id: 1, name: '食費', sort: 1, mode: 'payment' },
  { id: 2, name: '日用品', sort: 2, mode: 'payment' },
  { id: 3, name: '交通費', sort: 3, mode: 'payment' },
  { id: 4, name: '娯楽', sort: 4, mode: 'payment' },
  { id: 5, name: '衣服', sort: 5, mode: 'payment' },
  { id: 6, name: '医療', sort: 6, mode: 'payment' },
  { id: 7, name: '通信', sort: 7, mode: 'payment' },
  { id: 8, name: '水道光熱', sort: 8, mode: 'payment' },
  { id: 9, name: 'その他', sort: 9, mode: 'payment' },
];

// カテゴリ別の色
export const CATEGORY_COLORS: Record<number, string> = {
  1: '#10B981', // 食費 - emerald
  2: '#3B82F6', // 日用品 - blue
  3: '#F59E0B', // 交通費 - amber
  4: '#EC4899', // 娯楽 - pink
  5: '#8B5CF6', // 衣服 - violet
  6: '#EF4444', // 医療 - red
  7: '#06B6D4', // 通信 - cyan
  8: '#F97316', // 水道光熱 - orange
  9: '#6B7280', // その他 - gray
};

// デフォルトの予算目標
export const DEFAULT_BUDGET_GOALS: BudgetGoal[] = [
  { categoryId: 1, categoryName: '食費', monthlyBudget: 50000, color: CATEGORY_COLORS[1] },
  { categoryId: 2, categoryName: '日用品', monthlyBudget: 10000, color: CATEGORY_COLORS[2] },
  { categoryId: 3, categoryName: '交通費', monthlyBudget: 15000, color: CATEGORY_COLORS[3] },
  { categoryId: 4, categoryName: '娯楽', monthlyBudget: 20000, color: CATEGORY_COLORS[4] },
  { categoryId: 5, categoryName: '衣服', monthlyBudget: 10000, color: CATEGORY_COLORS[5] },
  { categoryId: 6, categoryName: '医療', monthlyBudget: 5000, color: CATEGORY_COLORS[6] },
  { categoryId: 7, categoryName: '通信', monthlyBudget: 10000, color: CATEGORY_COLORS[7] },
  { categoryId: 8, categoryName: '水道光熱', monthlyBudget: 15000, color: CATEGORY_COLORS[8] },
  { categoryId: 9, categoryName: 'その他', monthlyBudget: 15000, color: CATEGORY_COLORS[9] },
];

// モック支出データを生成
export function generateMockTransactions(): ZaimMoney[] {
  const transactions: ZaimMoney[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();
  
  let id = 1;
  
  // 今月の1日から今日まで
  for (let day = 1; day <= currentDay; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    // 各日に1-3件のランダムな支出
    const numTransactions = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numTransactions; i++) {
      const categoryId = Math.floor(Math.random() * 9) + 1;
      const category = MOCK_CATEGORIES.find(c => c.id === categoryId)!;
      
      // カテゴリに応じた金額レンジ
      let minAmount = 100;
      let maxAmount = 2000;
      
      switch (categoryId) {
        case 1: // 食費
          minAmount = 300; maxAmount = 3000;
          break;
        case 2: // 日用品
          minAmount = 100; maxAmount = 2000;
          break;
        case 3: // 交通費
          minAmount = 200; maxAmount = 1500;
          break;
        case 4: // 娯楽
          minAmount = 500; maxAmount = 5000;
          break;
        case 5: // 衣服
          minAmount = 1000; maxAmount = 10000;
          break;
        case 6: // 医療
          minAmount = 500; maxAmount = 5000;
          break;
        case 7: // 通信
          minAmount = 1000; maxAmount = 3000;
          break;
        case 8: // 水道光熱
          minAmount = 2000; maxAmount = 8000;
          break;
      }
      
      const amount = Math.floor(Math.random() * (maxAmount - minAmount) + minAmount);
      
      transactions.push({
        id: id++,
        date: dateStr,
        amount,
        category_id: categoryId,
        genre_id: 1,
        place: getRandomPlace(categoryId),
        comment: '',
        mode: 'payment',
        created: date.toISOString(),
      });
    }
  }
  
  return transactions;
}

function getRandomPlace(categoryId: number): string {
  const places: Record<number, string[]> = {
    1: ['スーパー', 'コンビニ', 'レストラン', 'カフェ', '弁当屋'],
    2: ['ドラッグストア', '100均', 'ホームセンター'],
    3: ['電車', 'バス', 'タクシー', 'ガソリンスタンド'],
    4: ['映画館', 'ゲームセンター', '本屋', 'カラオケ'],
    5: ['ユニクロ', 'GU', 'ZARA', 'H&M'],
    6: ['病院', '薬局', 'クリニック'],
    7: ['携帯ショップ', 'ネット'],
    8: ['電気', 'ガス', '水道'],
    9: ['その他'],
  };
  
  const categoryPlaces = places[categoryId] || ['その他'];
  return categoryPlaces[Math.floor(Math.random() * categoryPlaces.length)];
}
