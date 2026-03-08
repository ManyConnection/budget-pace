import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetGoal, AppSettings, ZaimCategory } from '../types';
import { DEFAULT_BUDGET_GOALS, CATEGORY_COLORS } from '../data/mockData';

const STORAGE_KEYS = {
  BUDGET_GOALS: '@budgetpace/budget_goals',
  APP_SETTINGS: '@budgetpace/app_settings',
  ZAIM_CATEGORIES: '@budgetpace/zaim_categories',
};

// 予算目標を保存
export async function saveBudgetGoals(goals: BudgetGoal[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to save budget goals:', error);
    throw error;
  }
}

// 予算目標を読み込み
export async function loadBudgetGoals(): Promise<BudgetGoal[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_GOALS);
    if (data) {
      return JSON.parse(data);
    }
    // デフォルト値を返す
    return DEFAULT_BUDGET_GOALS;
  } catch (error) {
    console.error('Failed to load budget goals:', error);
    return DEFAULT_BUDGET_GOALS;
  }
}

// 設定を保存
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

// 設定を読み込み
export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    return { zaimConnected: false };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { zaimConnected: false };
  }
}

// 単一の予算目標を更新
export async function updateBudgetGoal(
  categoryId: number,
  monthlyBudget: number
): Promise<BudgetGoal[]> {
  const goals = await loadBudgetGoals();
  const updatedGoals = goals.map(goal =>
    goal.categoryId === categoryId
      ? { ...goal, monthlyBudget }
      : goal
  );
  await saveBudgetGoals(updatedGoals);
  return updatedGoals;
}

// Zaimカテゴリを保存
export async function saveZaimCategories(categories: ZaimCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ZAIM_CATEGORIES, JSON.stringify(categories));
    
    // 予算目標も更新（新しいカテゴリがあれば追加）
    const currentGoals = await loadBudgetGoals();
    const paymentCategories = categories.filter(c => c.mode === 'payment');
    
    // 既存の予算目標にないカテゴリを追加
    const existingIds = new Set(currentGoals.map(g => g.categoryId));
    const newGoals: BudgetGoal[] = [];
    
    paymentCategories.forEach((cat, index) => {
      if (!existingIds.has(cat.id)) {
        // カラーパレット
        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#6B7280'];
        newGoals.push({
          categoryId: cat.id,
          categoryName: cat.name,
          monthlyBudget: 10000, // デフォルト予算
          color: colors[index % colors.length],
        });
      }
    });
    
    if (newGoals.length > 0) {
      // 既存目標にZaimカテゴリがない場合は新しい目標で置き換え
      const allGoals = currentGoals.some(g => paymentCategories.some(c => c.id === g.categoryId))
        ? [...currentGoals, ...newGoals]
        : newGoals;
      await saveBudgetGoals(allGoals);
    }
  } catch (error) {
    console.error('Failed to save Zaim categories:', error);
    throw error;
  }
}

// Zaimカテゴリを読み込み
export async function loadZaimCategories(): Promise<ZaimCategory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ZAIM_CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load Zaim categories:', error);
    return [];
  }
}

// カテゴリIDから情報を取得（Zaimカテゴリ優先）
export async function getCategoryInfo(categoryId: number): Promise<{ name: string; color: string }> {
  const categories = await loadZaimCategories();
  const category = categories.find(c => c.id === categoryId);
  
  if (category) {
    // 予算目標から色を取得
    const goals = await loadBudgetGoals();
    const goal = goals.find(g => g.categoryId === categoryId);
    return {
      name: category.name,
      color: goal?.color || '#6B7280',
    };
  }
  
  return { name: 'その他', color: '#6B7280' };
}
