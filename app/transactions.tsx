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
import { Filter, Calendar } from 'lucide-react-native';
import { useBudgetData } from '../src/hooks/useBudgetData';
import { formatCurrency } from '../src/utils/calculations';
import { MOCK_CATEGORIES, CATEGORY_COLORS } from '../src/data/mockData';
import { ZaimMoney } from '../src/types';

export default function TransactionsScreen() {
  const { transactions } = useBudgetData();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

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
    const category = MOCK_CATEGORIES.find(c => c.id === categoryId);
    return {
      name: category?.name || 'その他',
      color: CATEGORY_COLORS[categoryId] || '#6B7280',
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
          <Text style={styles.place}>{item.place}</Text>
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
          {MOCK_CATEGORIES.filter(c => c.mode === 'payment').map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: CATEGORY_COLORS[cat.id] },
                ]}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.name}
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
            <Text style={styles.emptyText}>明細がありません</Text>
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
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
