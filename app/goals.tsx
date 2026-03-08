import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, Check, X, PiggyBank } from 'lucide-react-native';
import { useBudgetData } from '../src/hooks/useBudgetData';
import { formatCurrency } from '../src/utils/calculations';
import { BudgetGoal } from '../src/types';

export default function GoalsScreen() {
  const { goals, updateGoal, paceAnalysis } = useBudgetData();
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (goal: BudgetGoal) => {
    setEditingGoal(goal);
    setEditValue(String(goal.monthlyBudget));
  };

  const handleSave = async () => {
    if (editingGoal) {
      const newBudget = parseInt(editValue, 10) || 0;
      await updateGoal(editingGoal.categoryId, newBudget);
      setEditingGoal(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingGoal(null);
    setEditValue('');
  };

  const totalBudget = goals.reduce((sum, g) => sum + g.monthlyBudget, 0);

  return (
    <ScrollView style={styles.container}>
      {/* 合計予算 */}
      <View style={styles.totalCard}>
        <View style={styles.totalHeader}>
          <PiggyBank size={24} color="#10B981" />
          <Text style={styles.totalTitle}>月間予算合計</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(totalBudget)}</Text>
      </View>

      {/* カテゴリ別目標 */}
      <View style={styles.goalsCard}>
        <Text style={styles.sectionTitle}>カテゴリ別予算</Text>
        {goals.map(goal => (
          <TouchableOpacity
            key={goal.categoryId}
            style={styles.goalItem}
            onPress={() => handleEdit(goal)}
            activeOpacity={0.7}
          >
            <View style={styles.goalLeft}>
              <View style={[styles.colorDot, { backgroundColor: goal.color }]} />
              <Text style={styles.goalName}>{goal.categoryName}</Text>
            </View>
            <View style={styles.goalRight}>
              <Text style={styles.goalAmount}>{formatCurrency(goal.monthlyBudget)}</Text>
              <Pencil size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 編集モーダル */}
      <Modal
        visible={editingGoal !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGoal?.categoryName}の予算
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.input}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                placeholder="0"
                autoFocus
                selectTextOnFocus
              />
            </View>

            <View style={styles.quickButtons}>
              {[10000, 20000, 30000, 50000].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickButton}
                  onPress={() => setEditValue(String(amount))}
                >
                  <Text style={styles.quickButtonText}>
                    {amount / 10000}万
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <X size={20} color="#6B7280" />
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  totalTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  goalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 16,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
