// Zaim API Types
export interface ZaimMoney {
  id: number;
  date: string;
  amount: number;
  category_id: number;
  genre_id: number;
  place: string;
  comment: string;
  mode: 'payment' | 'income' | 'transfer';
  created: string;
}

export interface ZaimCategory {
  id: number;
  name: string;
  sort: number;
  mode: 'payment' | 'income';
  parent_category_id?: number;
}

// App Types
export interface BudgetGoal {
  categoryId: number;
  categoryName: string;
  monthlyBudget: number;
  color: string;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  spent: number;
  budget: number;
  percentage: number;
  color: string;
}

export interface DailySpending {
  date: string;
  amount: number;
  cumulative: number;
}

export interface PaceAnalysis {
  currentSpent: number;
  totalBudget: number;
  daysElapsed: number;
  daysInMonth: number;
  projectedMonthEnd: number;
  idealPace: number;
  actualPace: number;
  status: 'on-track' | 'warning' | 'over-budget';
  remainingBudget: number;
  recommendedDailyBudget: number;
}

export interface SpendingAlert {
  id: string;
  categoryId: number;
  categoryName: string;
  type: 'warning' | 'danger';
  message: string;
  createdAt: string;
}

export interface AppSettings {
  zaimConnected: boolean;
  zaimAccessToken?: string;
  zaimAccessTokenSecret?: string;
}
