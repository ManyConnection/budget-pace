import { useState, useEffect, useCallback } from 'react';
import { ZaimMoney, ZaimCategory, BudgetGoal, CategorySpending, DailySpending, PaceAnalysis, SpendingAlert } from '../types';
import { loadBudgetGoals, saveBudgetGoals, updateBudgetGoal, loadSettings, loadZaimCategories, saveZaimCategories } from '../utils/storage';
import { zaimService } from '../services/zaim';
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
  zaimCategories: ZaimCategory[];
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
  paceAnalysis: PaceAnalysis;
  alerts: SpendingAlert[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refreshData: () => Promise<void>;
  updateGoal: (categoryId: number, monthlyBudget: number) => Promise<void>;
}

const EMPTY_PACE: PaceAnalysis = {
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
};

// カラーパレット
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#6B7280'];

export function useBudgetData(): BudgetData {
  const [transactions, setTransactions] = useState<ZaimMoney[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [zaimCategories, setZaimCategories] = useState<ZaimCategory[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [paceAnalysis, setPaceAnalysis] = useState<PaceAnalysis>(EMPTY_PACE);
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Zaim連携状態を確認
      await zaimService.init();
      const connected = await zaimService.isConnected();
      setIsConnected(connected);

      // Zaimカテゴリを読み込み
      const storedCategories = await loadZaimCategories();
      setZaimCategories(storedCategories);

      // 予算目標を読み込み
      let loadedGoals = await loadBudgetGoals();
      
      // Zaimカテゴリがあって予算目標が古い場合は更新
      if (storedCategories.length > 0) {
        const paymentCategories = storedCategories.filter(c => c.mode === 'payment');
        const hasZaimGoals = loadedGoals.some(g => 
          paymentCategories.some(c => c.id === g.categoryId)
        );
        
        if (!hasZaimGoals && paymentCategories.length > 0) {
          // Zaimカテゴリに基づいて新しい予算目標を作成
          loadedGoals = paymentCategories.map((cat, index) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            monthlyBudget: 10000,
            color: COLORS[index % COLORS.length],
          }));
          await saveBudgetGoals(loadedGoals);
        }
      }
      setGoals(loadedGoals);

      if (!connected) {
        // 未連携の場合は空のデータ
        setTransactions([]);
        setCategorySpending([]);
        setDailySpending([]);
        setPaceAnalysis(EMPTY_PACE);
        setAlerts([]);
        return;
      }

      // Zaim APIからデータ取得
      try {
        // カテゴリがない場合は取得
        if (storedCategories.length === 0) {
          try {
            const categoryResponse = await zaimService.getCategories();
            if (categoryResponse.categories) {
              await saveZaimCategories(categoryResponse.categories);
              setZaimCategories(categoryResponse.categories);
              
              // 予算目標も更新
              const paymentCats = categoryResponse.categories.filter((c: ZaimCategory) => c.mode === 'payment');
              if (paymentCats.length > 0) {
                loadedGoals = paymentCats.map((cat: ZaimCategory, index: number) => ({
                  categoryId: cat.id,
                  categoryName: cat.name,
                  monthlyBudget: 10000,
                  color: COLORS[index % COLORS.length],
                }));
                await saveBudgetGoals(loadedGoals);
                setGoals(loadedGoals);
              }
            }
          } catch (catError) {
            console.error('Failed to fetch categories:', catError);
          }
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        console.log('Fetching Zaim data for:', year, month);

        // 全データを取得（APIの日付フィルタが不安定なため）
        const response = await zaimService.getMoney({});

        console.log('Zaim API response:', JSON.stringify(response, null, 2));

        // Handle different response formats
        const moneyData = response.money || [];
        
        // 全データをパース
        const allTransactions: ZaimMoney[] = moneyData.map((m: any) => ({
          id: m.id,
          date: m.date,
          amount: m.amount,
          category_id: m.category_id,
          genre_id: m.genre_id,
          place: m.place || '',
          comment: m.comment || '',
          mode: m.mode,
          created: m.created,
        }));

        console.log('Total transactions from API:', allTransactions.length);
        
        // 今月のデータのみフィルタリング
        const currentYearMonth = `${year}-${String(month).padStart(2, '0')}`;
        const zaimTransactions = allTransactions.filter(t => 
          t.date && t.date.startsWith(currentYearMonth)
        );

        console.log('Filtered to current month:', zaimTransactions.length, 'for', currentYearMonth);
        setTransactions(zaimTransactions);

        // 計算
        const catSpending = calculateCategorySpending(zaimTransactions, loadedGoals);
        setCategorySpending(catSpending);

        const dailyData = calculateDailySpending(zaimTransactions);
        setDailySpending(dailyData);

        const pace = analyzePace(zaimTransactions, loadedGoals);
        setPaceAnalysis(pace);

        const alertList = generateAlerts(
          catSpending,
          getDaysElapsed(),
          getDaysInMonth()
        );
        setAlerts(alertList);
      } catch (apiError) {
        console.error('Zaim API error:', apiError);
        setError('Zaimからデータを取得できませんでした');
        setTransactions([]);
      }
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

    if (transactions.length > 0) {
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
    }
  }, [transactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    transactions,
    goals,
    zaimCategories,
    categorySpending,
    dailySpending,
    paceAnalysis,
    alerts,
    isLoading,
    error,
    isConnected,
    refreshData,
    updateGoal: updateGoalHandler,
  };
}
