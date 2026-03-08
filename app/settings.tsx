import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import {
  Link2,
  ExternalLink,
  Info,
  ChevronRight,
  RefreshCw,
  Database,
  Shield,
} from 'lucide-react-native';
import { loadSettings, saveSettings } from '../src/utils/storage';
import { AppSettings } from '../src/types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({ zaimConnected: false });

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleZaimConnect = () => {
    Alert.alert(
      'Zaim連携',
      'Zaim APIと連携するには、Zaimデベロッパーサイトでアプリを登録してAPIキーを取得してください。\n\n現在はモックデータで動作しています。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'Zaimを開く',
          onPress: () => Linking.openURL('https://dev.zaim.net/'),
        },
      ]
    );
  };

  const handleDisconnect = () => {
    Alert.alert(
      '連携解除',
      'Zaimとの連携を解除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除',
          style: 'destructive',
          onPress: async () => {
            const newSettings = {
              ...settings,
              zaimConnected: false,
              zaimAccessToken: undefined,
              zaimAccessTokenSecret: undefined,
            };
            await saveSettings(newSettings);
            setSettings(newSettings);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Zaim連携 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ連携</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={settings.zaimConnected ? handleDisconnect : handleZaimConnect}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Link2 size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Zaim連携</Text>
                <Text style={styles.settingDesc}>
                  {settings.zaimConnected ? '連携済み' : 'モックデータで動作中'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: settings.zaimConnected ? '#D1FAE5' : '#F3F4F6' }]}>
              <Text style={[styles.statusText, { color: settings.zaimConnected ? '#10B981' : '#6B7280' }]}>
                {settings.zaimConnected ? '接続中' : '未接続'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* データ管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <RefreshCw size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>データを再読込</Text>
                <Text style={styles.settingDesc}>最新の明細を取得</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
                <Database size={20} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.settingLabel}>ローカルデータ</Text>
                <Text style={styles.settingDesc}>予算設定はデバイスに保存</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* アプリ情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <Info size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.settingLabel}>バージョン</Text>
                <Text style={styles.settingDesc}>1.0.0</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openURL('https://manyconnection.co.jp')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <Shield size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.settingLabel}>プライバシーポリシー</Text>
                <Text style={styles.settingDesc}>manyconnection.co.jp</Text>
              </View>
            </View>
            <ExternalLink size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BudgetPace © 2025 ManyConnection LLC
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 66,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
