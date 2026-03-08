import { ZaimMoney, BudgetGoal, CategorySpending, DailySpending, PaceAnalysis, SpendingAlert } from '../types';
import { CATEGORY_COLORS } from '../data/mockData';

// 今月の日数を取得
export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// 今月の経過日数を取得
export function getDaysElapsed(date: Date = new Date()): number {
  return date.getDate();
}

// カテゴリ別支出を計算
export function calculateCategorySpending(
  transactions: ZaimMoney[],
  goals: BudgetGoal[]
): CategorySpending[] {
  const spendingMap = new Map<number, number>();
  
  // 支出を集計
  transactions.forEach(t => {
    if (t.mode === 'payment') {
      const current = spendingMap.get(t.category_id) || 0;
      spendingMap.set(t.category_id, current + t.amount);
    }
  });
  
  // カテゴリ別支出を作成
  return goals.map(goal => {
    const spent = spendingMap.get(goal.categoryId) || 0;
    const percentage = goal.monthlyBudget > 0 
      ? Math.round((spent / goal.monthlyBudget) * 100) 
      : 0;
    
    return {
      categoryId: goal.categoryId,
      categoryName: goal.categoryName,
      spent,
      budget: goal.monthlyBudget,
      percentage,
      color: goal.color,
    };
  });
}

// 日別支出を計算
export function calculateDailySpending(transactions: ZaimMoney[]): DailySpending[] {
  const dailyMap = new Map<string, number>();
  
  // 日別に集計
  transactions.forEach(t => {
    if (t.mode === 'payment') {
      const current = dailyMap.get(t.date) || 0;
      dailyMap.set(t.date, current + t.amount);
    }
  });
  
  // ソートして累積計算
  const sortedDates = Array.from(dailyMap.keys()).sort();
  let cumulative = 0;
  
  return sortedDates.map(date => {
    const amount = dailyMap.get(date) || 0;
    cumulative += amount;
    return { date, amount, cumulative };
  });
}

// ペース分析
export function analyzePace(
  transactions: ZaimMoney[],
  goals: BudgetGoal[],
  date: Date = new Date()
): PaceAnalysis {
  const totalBudget = goals.reduce((sum, g) => sum + g.monthlyBudget, 0);
  const currentSpent = transactions
    .filter(t => t.mode === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const daysInMonth = getDaysInMonth(date);
  const daysElapsed = getDaysElapsed(date);
  const daysRemaining = daysInMonth - daysElapsed;
  
  // 理想のペース（日割り）
  const idealPace = (totalBudget / daysInMonth) * daysElapsed;
  
  // 実際のペース（日平均）
  const actualPace = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
  
  // 月末予測
  const projectedMonthEnd = actualPace * daysInMonth;
  
  // 残り予算
  const remainingBudget = totalBudget - currentSpent;
  
  // 残り日数での推奨日予算
  const recommendedDailyBudget = daysRemaining > 0 
    ? Math.max(0, remainingBudget / daysRemaining) 
    : 0;
  
  // ステータス判定
  let status: PaceAnalysis['status'] = 'on-track';
  if (currentSpent > totalBudget) {
    status = 'over-budget';
  } else if (projectedMonthEnd > totalBudget * 1.1) {
    status = 'warning';
  }
  
  return {
    currentSpent,
    totalBudget,
    daysElapsed,
    daysInMonth,
    projectedMonthEnd,
    idealPace,
    actualPace,
    status,
    remainingBudget,
    recommendedDailyBudget,
  };
}

// アラート生成
export function generateAlerts(
  categorySpending: CategorySpending[],
  daysElapsed: number,
  daysInMonth: number
): SpendingAlert[] {
  const alerts: SpendingAlert[] = [];
  const progressRatio = daysElapsed / daysInMonth;
  
  categorySpending.forEach(cat => {
    const expectedPercentage = progressRatio * 100;
    
    // 予算オーバー
    if (cat.percentage >= 100) {
      alerts.push({
        id: `danger-${cat.categoryId}`,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        type: 'danger',
        message: `${cat.categoryName}が予算を超過しました`,
        createdAt: new Date().toISOString(),
      });
    }
    // ペースオーバー（80%以上かつ想定より20%以上多い）
    else if (cat.percentage >= 80 && cat.percentage > expectedPercentage + 20) {
      alerts.push({
        id: `warning-${cat.categoryId}`,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        type: 'warning',
        message: `${cat.categoryName}の使いすぎに注意`,
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
}

// 金額フォーマット
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// パーセンテージ表示用の色を取得
export function getPercentageColor(percentage: number): string {
  if (percentage >= 100) return '#EF4444'; // red
  if (percentage >= 80) return '#F59E0B'; // amber
  return '#10B981'; // emerald
}
