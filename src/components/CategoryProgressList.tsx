import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { CategorySpending } from '../types';
import { formatCurrency, getPercentageColor } from '../utils/calculations';

interface CategoryProgressListProps {
  categories: CategorySpending[];
  onCategoryPress?: (categoryId: number) => void;
}

export function CategoryProgressList({ categories, onCategoryPress }: CategoryProgressListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>カテゴリ別支出</Text>
      {categories.map(category => (
        <TouchableOpacity
          key={category.categoryId}
          style={styles.categoryItem}
          onPress={() => onCategoryPress?.(category.categoryId)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryHeader}>
            <View style={styles.categoryNameRow}>
              <View style={[styles.colorDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryName}>{category.categoryName}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.spent}>{formatCurrency(category.spent)}</Text>
              <Text style={styles.budget}>/ {formatCurrency(category.budget)}</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, category.percentage)}%`,
                    backgroundColor: getPercentageColor(category.percentage),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.percentage,
                { color: getPercentageColor(category.percentage) },
              ]}
            >
              {category.percentage}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  budget: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
});
