import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetData } from '../src/hooks/useBudgetData';
import { PaceCard } from '../src/components/PaceCard';
import { AlertsList } from '../src/components/AlertsList';
import { CategoryProgressList } from '../src/components/CategoryProgressList';
import { SpendingChart } from '../src/components/SpendingChart';
import { TransactionList } from '../src/components/TransactionList';

export default function DashboardScreen() {
  const {
    transactions,
    categorySpending,
    dailySpending,
    paceAnalysis,
    alerts,
    isLoading,
    error,
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
      <TransactionList transactions={transactions} limit={5} />
      
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
});
