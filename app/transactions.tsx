import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Filter, Calendar, Link2, ArrowRight } from 'lucide-react-native';
import { useBudgetData } from '../src/hooks/useBudgetData';
import { formatCurrency } from '../src/utils/calculations';
import { ZaimMoney } from '../src/types';

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, goals, isConnected } = useBudgetData();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Zaim未連携の場合
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Link2 size={40} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Zaimと連携してください</Text>
          <Text style={styles.emptyDesc}>
            連携すると支出明細を{'\n'}確認できます
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.connectButtonText}>設定画面へ</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // フィルタリング
  const filteredTransactions = selectedCategory
    ? transactions.filter(t => t.category_id === selectedCategory)
    : transactions;

  // 日付でソート
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 日付でグループ化
  const groupedByDate = sortedTransactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, ZaimMoney[]>);

  const getCategoryInfo = (categoryId: number) => {
    const goal = goals.find(g => g.categoryId === categoryId);
    return {
      name: goal?.categoryName || 'その他',
      color: goal?.color || '#6B7280',
    };
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日 (${days[date.getDay()]})`;
  };

  const getTotalForDate = (items: ZaimMoney[]) => {
    return items.reduce((sum, t) => sum + t.amount, 0);
  };

  const renderTransaction = (item: ZaimMoney) => {
    const { name, color } = getCategoryInfo(item.category_id);
    
    return (
      <View style={styles.transactionItem} key={item.id}>
        <View style={[styles.categoryIndicator, { backgroundColor: color }]} />
        <View style={styles.transactionContent}>
          <Text style={styles.place}>{item.place || '不明'}</Text>
          <Text style={styles.category}>{name}</Text>
        </View>
        <Text style={styles.amount}>-{formatCurrency(item.amount)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* カテゴリフィルター */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === null && styles.filterChipTextActive,
              ]}
            >
              すべて
            </Text>
          </TouchableOpacity>
          {goals.map(goal => (
            <TouchableOpacity
              key={goal.categoryId}
              style={[
                styles.filterChip,
                selectedCategory === goal.categoryId && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(goal.categoryId)}
            >
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: goal.color },
                ]}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === goal.categoryId && styles.filterChipTextActive,
                ]}
              >
                {goal.categoryName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 明細リスト */}
      <FlatList
        data={Object.entries(groupedByDate)}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, items] }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.dateText}>{formatDateHeader(date)}</Text>
              <Text style={styles.dateTotal}>
                {formatCurrency(getTotalForDate(items))}
              </Text>
            </View>
            <View style={styles.transactionList}>
              {items.map(renderTransaction)}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>今月の明細がありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  dateGroup: {
    marginVertical: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  place: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
