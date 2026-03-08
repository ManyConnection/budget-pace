import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Link2, ArrowRight } from 'lucide-react-native';
import { useBudgetData } from '../src/hooks/useBudgetData';
import { PaceCard } from '../src/components/PaceCard';
import { AlertsList } from '../src/components/AlertsList';
import { CategoryProgressList } from '../src/components/CategoryProgressList';
import { SpendingChart } from '../src/components/SpendingChart';
import { TransactionList } from '../src/components/TransactionList';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    goals,
    categorySpending,
    dailySpending,
    paceAnalysis,
    alerts,
    isLoading,
    error,
    isConnected,
    refreshData,
  } = useBudgetData();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  // 今月の日付
  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  // Zaim未連携の場合
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Link2 size={48} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Zaimと連携してください</Text>
          <Text style={styles.emptyDesc}>
            家計簿アプリZaimと連携すると、{'\n'}
            支出データを分析できます
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.connectButtonText}>設定画面へ</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // データがない場合
  if (transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Text style={styles.dayProgress}>
            {paceAnalysis.daysElapsed}日目 / {paceAnalysis.daysInMonth}日
          </Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>今月のデータがありません</Text>
          <Text style={styles.emptyDesc}>
            Zaimに支出を記録すると、{'\n'}
            ここに分析結果が表示されます
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Text style={styles.refreshButtonText}>データを再読込</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#10B981"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Text style={styles.dayProgress}>
          {paceAnalysis.daysElapsed}日目 / {paceAnalysis.daysInMonth}日
        </Text>
      </View>

      <AlertsList alerts={alerts} />
      <PaceCard analysis={paceAnalysis} />
      <SpendingChart dailySpending={dailySpending} paceAnalysis={paceAnalysis} />
      <CategoryProgressList categories={categorySpending} />
      <TransactionList transactions={transactions} goals={goals} limit={5} />
      
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  monthLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    height: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
