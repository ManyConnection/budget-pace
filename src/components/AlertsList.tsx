import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, XCircle } from 'lucide-react-native';
import { SpendingAlert } from '../types';

interface AlertsListProps {
  alerts: SpendingAlert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {alerts.map(alert => {
        const isDanger = alert.type === 'danger';
        const Icon = isDanger ? XCircle : AlertTriangle;
        const bgColor = isDanger ? '#FEE2E2' : '#FEF3C7';
        const iconColor = isDanger ? '#EF4444' : '#F59E0B';
        const textColor = isDanger ? '#991B1B' : '#92400E';

        return (
          <View key={alert.id} style={[styles.alertItem, { backgroundColor: bgColor }]}>
            <Icon size={20} color={iconColor} />
            <Text style={[styles.alertText, { color: textColor }]}>{alert.message}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
