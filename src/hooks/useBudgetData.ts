import { useState, useEffect, useCallback } from 'react';
import { ZaimMoney, BudgetGoal, CategorySpending, DailySpending, PaceAnalysis, SpendingAlert } from '../types';
import { generateMockTransactions } from '../data/mockData';
import { loadBudgetGoals, saveBudgetGoals, updateBudgetGoal } from '../utils/storage';
import {
  calculateCategorySpending,
  calculateDailySpending,
  analyzePace,
  generateAlerts,
  getDaysElapsed,
  getDaysInMonth,
} from '../utils/calculations';

interface BudgetData {
  transactions: ZaimMoney[];
  goals: BudgetGoal[];
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
  paceAnalysis: PaceAnalysis;
  alerts: SpendingAlert[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateGoal: (categoryId: number, monthlyBudget: number) => Promise<void>;
}

export function useBudgetData(): BudgetData {
  const [transactions, setTransactions] = useState<ZaimMoney[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [paceAnalysis, setPaceAnalysis] = useState<PaceAnalysis>({
    currentSpent: 0,
    totalBudget: 0,
    daysElapsed: 0,
    daysInMonth: 30,
    projectedMonthEnd: 0,
    idealPace: 0,
    actualPace: 0,
    status: 'on-track',
    remainingBudget: 0,
    recommendedDailyBudget: 0,
  });
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 予算目標を読み込み
      const loadedGoals = await loadBudgetGoals();
      setGoals(loadedGoals);

      // モックデータを生成（後でZaim APIに置き換え）
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);

      // 計算
      const catSpending = calculateCategorySpending(mockTransactions, loadedGoals);
      setCategorySpending(catSpending);

      const dailyData = calculateDailySpending(mockTransactions);
      setDailySpending(dailyData);

      const pace = analyzePace(mockTransactions, loadedGoals);
      setPaceAnalysis(pace);

      const alertList = generateAlerts(
        catSpending,
        getDaysElapsed(),
        getDaysInMonth()
      );
      setAlerts(alertList);
    } catch (err) {
      setError('データの読み込みに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const updateGoalHandler = useCallback(async (categoryId: number, monthlyBudget: number) => {
    const updatedGoals = await updateBudgetGoal(categoryId, monthlyBudget);
    setGoals(updatedGoals);

    // 再計算
    const catSpending = calculateCategorySpending(transactions, updatedGoals);
    setCategorySpending(catSpending);

    const pace = analyzePace(transactions, updatedGoals);
    setPaceAnalysis(pace);

    const alertList = generateAlerts(
      catSpending,
      getDaysElapsed(),
      getDaysInMonth()
    );
    setAlerts(alertList);
  }, [transactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    transactions,
    goals,
    categorySpending,
    dailySpending,
    paceAnalysis,
    alerts,
    isLoading,
    error,
    refreshData,
    updateGoal: updateGoalHandler,
  };
}
