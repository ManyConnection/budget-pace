import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import * as Linking from 'expo-linking';
import {
  Link2,
  ExternalLink,
  Info,
  ChevronRight,
  RefreshCw,
  Database,
  Shield,
  CheckCircle,
  XCircle,
  Key,
  X,
} from 'lucide-react-native';
import { loadSettings, saveSettings, saveZaimCategories } from '../src/utils/storage';
import { zaimService } from '../src/services/zaim';
import { AppSettings } from '../src/types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({ zaimConnected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPINModal, setShowPINModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [isSubmittingPIN, setIsSubmittingPIN] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      await zaimService.init();
      const isConnected = await zaimService.isConnected();
      const isWaiting = await zaimService.isWaitingForPIN();
      const loadedSettings = await loadSettings();
      setSettings({ ...loadedSettings, zaimConnected: isConnected });
      if (isWaiting && !isConnected) {
        setShowPINModal(true);
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleZaimConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await zaimService.startAuth();
      
      if (result.success && result.authUrl) {
        // Open Safari for authentication
        await Linking.openURL(result.authUrl);
        // Show PIN input modal
        setShowPINModal(true);
      } else {
        Alert.alert('エラー', `${result.error}\n\nステップ: ${result.step}`);
      }
    } catch (error: any) {
      console.error('Failed to connect to Zaim:', error);
      Alert.alert('エラー', `Zaim連携に失敗しました:\n${error?.message || String(error)}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmitPIN = async () => {
    if (!pinCode.trim()) {
      Alert.alert('エラー', 'PINコードを入力してください');
      return;
    }

    try {
      setIsSubmittingPIN(true);
      const result = await zaimService.completeAuthWithPIN(pinCode);
      
      if (result.success) {
        // カテゴリ情報を取得・保存
        try {
          const categoryResponse = await zaimService.getCategories();
          if (categoryResponse.categories) {
            await saveZaimCategories(categoryResponse.categories);
            console.log('Saved Zaim categories:', categoryResponse.categories.length);
          }
        } catch (catError) {
          console.error('Failed to fetch categories:', catError);
          // カテゴリ取得失敗でも連携自体は成功とする
        }
        
        const newSettings = { ...settings, zaimConnected: true };
        await saveSettings(newSettings);
        setSettings(newSettings);
        setShowPINModal(false);
        setPinCode('');
        Alert.alert('成功', 'Zaimと連携しました！');
      } else {
        Alert.alert('エラー', `${result.error}\n\nステップ: ${result.step}`);
      }
    } catch (error: any) {
      Alert.alert('エラー', error?.message || String(error));
    } finally {
      setIsSubmittingPIN(false);
    }
  };

  const handleCancelAuth = async () => {
    await zaimService.cancelAuth();
    setShowPINModal(false);
    setPinCode('');
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
            await zaimService.disconnect();
            const newSettings = { ...settings, zaimConnected: false };
            await saveSettings(newSettings);
            setSettings(newSettings);
          },
        },
      ]
    );
  };

  const handleRefreshData = async () => {
    if (!settings.zaimConnected) {
      Alert.alert('未連携', 'まずZaimと連携してください。');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // まずユーザー情報を取得してテスト
      let userInfo = '';
      try {
        const user = await zaimService.getUser();
        console.log('User info:', user);
        userInfo = `ユーザー: ${user.me?.name || '不明'} (ID: ${user.me?.id || '?'})`;
      } catch (userError: any) {
        userInfo = `ユーザー取得エラー: ${userError?.message || String(userError)}`;
      }
      
      // カテゴリ情報も更新
      try {
        const categoryResponse = await zaimService.getCategories();
        if (categoryResponse.categories) {
          await saveZaimCategories(categoryResponse.categories);
          console.log('Updated Zaim categories:', categoryResponse.categories.length);
        }
      } catch (catError) {
        console.error('Failed to update categories:', catError);
      }
      
      // 今月のデータを取得
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const money = await zaimService.getMoney({
        start_date: startDate,
        end_date: endDate,
      });
      
      console.log('Money response:', JSON.stringify(money, null, 2));
      
      const count = money.money?.length || 0;
      const firstFew = money.money?.slice(0, 3).map((m: any) => 
        `${m.date}: ¥${m.amount}`
      ).join('\n') || 'データなし';
      
      Alert.alert(
        '取得結果',
        `${userInfo}\n\n取得件数: ${count}件\n\n最初の3件:\n${firstFew}`
      );
    } catch (error: any) {
      console.error('Failed to refresh data:', error);
      Alert.alert('エラー', `データの取得に失敗しました:\n${error?.message || String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Zaim連携 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ連携</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={settings.zaimConnected ? handleDisconnect : handleZaimConnect}
              disabled={isConnecting}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Link2 size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Zaim連携</Text>
                  <Text style={styles.settingDesc}>
                    {settings.zaimConnected 
                      ? 'Zaimアカウントと連携中' 
                      : 'タップしてZaimと連携'}
                  </Text>
                </View>
              </View>
              {isConnecting ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: settings.zaimConnected ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  {settings.zaimConnected ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <XCircle size={16} color="#EF4444" />
                  )}
                  <Text style={[
                    styles.statusText, 
                    { color: settings.zaimConnected ? '#10B981' : '#EF4444' }
                  ]}>
                    {settings.zaimConnected ? '接続中' : '未接続'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleRefreshData}
              disabled={!settings.zaimConnected}
            >
              <View style={styles.settingLeft}>
                <View style={[
                  styles.iconBox, 
                  { backgroundColor: settings.zaimConnected ? '#DBEAFE' : '#F3F4F6' }
                ]}>
                  <RefreshCw 
                    size={20} 
                    color={settings.zaimConnected ? '#3B82F6' : '#9CA3AF'} 
                  />
                </View>
                <View>
                  <Text style={[
                    styles.settingLabel,
                    !settings.zaimConnected && { color: '#9CA3AF' }
                  ]}>
                    データを再読込
                  </Text>
                  <Text style={styles.settingDesc}>
                    {settings.zaimConnected 
                      ? '最新の明細を取得' 
                      : 'Zaim連携後に利用可能'}
                  </Text>
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
                  <Text style={styles.settingDesc}>1.0.1</Text>
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

      {/* PIN入力モーダル */}
      <Modal
        visible={showPINModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAuth}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={handleCancelAuth}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <View style={styles.modalIconBox}>
              <Key size={32} color="#F59E0B" />
            </View>
            
            <Text style={styles.modalTitle}>認証コードを入力</Text>
            <Text style={styles.modalDesc}>
              Safariで認証を完了すると、{'\n'}
              画面に表示されるコードを入力してください
            </Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinCode}
              onChangeText={setPinCode}
              placeholder="認証コード"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={[styles.submitButton, !pinCode.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmitPIN}
              disabled={isSubmittingPIN || !pinCode.trim()}
            >
              {isSubmittingPIN ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>連携を完了</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAuth}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  // Modal styles
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
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  pinInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
