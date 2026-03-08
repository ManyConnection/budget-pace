import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetGoal, AppSettings } from '../types';
import { DEFAULT_BUDGET_GOALS } from '../data/mockData';

const STORAGE_KEYS = {
  BUDGET_GOALS: '@budgetpace/budget_goals',
  APP_SETTINGS: '@budgetpace/app_settings',
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
