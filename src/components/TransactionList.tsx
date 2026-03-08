import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { ZaimMoney, ZaimCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import { MOCK_CATEGORIES, CATEGORY_COLORS } from '../data/mockData';

interface TransactionListProps {
  transactions: ZaimMoney[];
  limit?: number;
}

export function TransactionList({ transactions, limit }: TransactionListProps) {
  // 日付で降順ソート
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  const getCategoryInfo = (categoryId: number) => {
    const category = MOCK_CATEGORIES.find(c => c.id === categoryId);
    return {
      name: category?.name || 'その他',
      color: CATEGORY_COLORS[categoryId] || '#6B7280',
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderItem = ({ item }: { item: ZaimMoney }) => {
    const { name, color } = getCategoryInfo(item.category_id);
    
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.categoryIndicator, { backgroundColor: color }]} />
        <View style={styles.transactionContent}>
          <View style={styles.transactionMain}>
            <Text style={styles.place}>{item.place}</Text>
            <Text style={styles.amount}>-{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.transactionSub}>
            <Text style={styles.category}>{name}</Text>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>最近の支出</Text>
        <View style={styles.emptyState}>
          <Receipt size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>支出データがありません</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>最近の支出</Text>
      <FlatList
        data={sortedTransactions}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  place: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  transactionSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
