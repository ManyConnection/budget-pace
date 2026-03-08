import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DailySpending, PaceAnalysis } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SpendingChartProps {
  dailySpending: DailySpending[];
  paceAnalysis: PaceAnalysis;
}

export function SpendingChart({ dailySpending, paceAnalysis }: SpendingChartProps) {
  const screenWidth = Dimensions.get('window').width - 64;

  if (dailySpending.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>支出推移</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>データがありません</Text>
        </View>
      </View>
    );
  }

  // データを準備
  const labels = dailySpending.map(d => {
    const day = new Date(d.date).getDate();
    return day % 5 === 1 ? String(day) : '';
  });

  const actualData = dailySpending.map(d => d.cumulative);

  // 理想ライン（日割り予算の累積）
  const dailyBudget = paceAnalysis.totalBudget / paceAnalysis.daysInMonth;
  const idealData = dailySpending.map((_, i) => dailyBudget * (i + 1));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>支出推移</Text>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>実際</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.legendText}>理想ペース</Text>
        </View>
      </View>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: actualData,
              color: () => '#10B981',
              strokeWidth: 3,
            },
            {
              data: idealData,
              color: () => '#9CA3AF',
              strokeWidth: 2,
            },
          ],
        }}
        width={screenWidth}
        height={200}
        yAxisLabel="¥"
        yAxisSuffix=""
        formatYLabel={(value) => {
          const num = parseInt(value, 10);
          if (num >= 10000) {
            return `${(num / 10000).toFixed(0)}万`;
          }
          return value;
        }}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          labelColor: () => '#6B7280',
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '3',
            strokeWidth: '1',
          },
          propsForBackgroundLines: {
            stroke: '#E5E7EB',
            strokeDasharray: '0',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
