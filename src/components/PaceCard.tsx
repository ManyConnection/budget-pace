import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { PaceAnalysis } from '../types';
import { formatCurrency } from '../utils/calculations';

interface PaceCardProps {
  analysis: PaceAnalysis;
}

export function PaceCard({ analysis }: PaceCardProps) {
  const getStatusConfig = () => {
    switch (analysis.status) {
      case 'over-budget':
        return {
          icon: TrendingDown,
          color: '#EF4444',
          bgColor: '#FEE2E2',
          label: '予算オーバー',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          label: 'ペース注意',
        };
      default:
        return {
          icon: CheckCircle,
          color: '#10B981',
          bgColor: '#D1FAE5',
          label: '順調',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>今月のペース</Text>
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <Icon size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.mainAmount}>
        <Text style={styles.spentLabel}>使用済み</Text>
        <Text style={styles.spentAmount}>{formatCurrency(analysis.currentSpent)}</Text>
        <Text style={styles.budgetText}>/ {formatCurrency(analysis.totalBudget)}</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, (analysis.currentSpent / analysis.totalBudget) * 100)}%`,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <TrendingUp size={16} color="#6B7280" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>月末予測</Text>
            <Text style={[styles.statValue, { color: analysis.projectedMonthEnd > analysis.totalBudget ? '#EF4444' : '#10B981' }]}>
              {formatCurrency(analysis.projectedMonthEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <AlertTriangle size={16} color="#6B7280" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>残り予算</Text>
            <Text style={[styles.statValue, { color: analysis.remainingBudget > 0 ? '#10B981' : '#EF4444' }]}>
              {formatCurrency(analysis.remainingBudget)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.recommendation}>
        <Text style={styles.recommendLabel}>
          残り{analysis.daysInMonth - analysis.daysElapsed}日の推奨日予算
        </Text>
        <Text style={styles.recommendAmount}>
          {formatCurrency(analysis.recommendedDailyBudget)}/日
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainAmount: {
    alignItems: 'center',
    marginBottom: 16,
  },
  spentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  budgetText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  recommendation: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  recommendLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recommendAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
});
