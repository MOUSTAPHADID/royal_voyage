import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

const T = {
  ar: {
    title: 'eSIM Go',
    subtitle: 'اتصل بالعالم بسهولة',
    searchPlans: 'البحث عن خطط',
    myEsims: 'eSIMs الخاصة بي',
    popularDestinations: 'الوجهات الشهيرة',
    dataPlans: 'خطط البيانات',
    gb: 'GB',
    days: 'يوم',
    price: 'السعر',
    buy: 'شراء الآن',
    active: 'نشط',
    expired: 'منتهي الصلاحية',
    pending: 'قيد الانتظار',
    noEsims: 'لا توجد eSIMs حالياً',
  },
  fr: {
    title: 'eSIM Go',
    subtitle: 'Connectez-vous au monde facilement',
    searchPlans: 'Rechercher des plans',
    myEsims: 'Mes eSIMs',
    popularDestinations: 'Destinations populaires',
    dataPlans: 'Plans de données',
    gb: 'GB',
    days: 'jours',
    price: 'Prix',
    buy: 'Acheter maintenant',
    active: 'Actif',
    expired: 'Expiré',
    pending: 'En attente',
    noEsims: 'Aucun eSIM actuellement',
  },
};

interface EsimPlan {
  id: string;
  destination: string;
  data: number;
  validity: number;
  price: number;
  flag: string;
}

interface MyEsim {
  id: string;
  destination: string;
  data: number;
  dataUsed: number;
  status: 'active' | 'expired' | 'pending';
  expiresAt: string;
}

export default function EsimScreen() {
  const colors = useColors();
  const router = useRouter();
  const t = T['ar'];

  const [activeTab, setActiveTab] = useState<'plans' | 'myEsims'>('plans');

  const popularPlans: EsimPlan[] = [
    { id: '1', destination: 'فرنسا', data: 5, validity: 7, price: 15, flag: '🇫🇷' },
    { id: '2', destination: 'إسبانيا', data: 10, validity: 14, price: 25, flag: '🇪🇸' },
    { id: '3', destination: 'إيطاليا', data: 5, validity: 7, price: 15, flag: '🇮🇹' },
    { id: '4', destination: 'ألمانيا', data: 10, validity: 14, price: 28, flag: '🇩🇪' },
    { id: '5', destination: 'بريطانيا', data: 5, validity: 7, price: 18, flag: '🇬🇧' },
    { id: '6', destination: 'هولندا', data: 10, validity: 14, price: 26, flag: '🇳🇱' },
  ];

  const myEsims: MyEsim[] = [
    { id: '1', destination: 'فرنسا', data: 10, dataUsed: 3.5, status: 'active', expiresAt: '2026-05-18' },
    { id: '2', destination: 'إسبانيا', data: 5, dataUsed: 5, status: 'expired', expiresAt: '2026-04-10' },
  ];

  const renderPlanCard = (plan: EsimPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/esim/plan-details?id=${plan.id}`)}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planFlag}>{plan.flag}</Text>
        <Text style={[styles.planDestination, { color: colors.foreground }]}>{plan.destination}</Text>
      </View>
      <View style={styles.planDetails}>
        <View style={styles.planDetail}>
          <Text style={[styles.planLabel, { color: colors.muted }]}>البيانات</Text>
          <Text style={[styles.planValue, { color: colors.foreground }]}>{plan.data} {t.gb}</Text>
        </View>
        <View style={styles.planDetail}>
          <Text style={[styles.planLabel, { color: colors.muted }]}>الصلاحية</Text>
          <Text style={[styles.planValue, { color: colors.foreground }]}>{plan.validity} {t.days}</Text>
        </View>
      </View>
      <View style={styles.planFooter}>
        <Text style={[styles.planPrice, { color: colors.primary }]}>{plan.price} MRU</Text>
        <TouchableOpacity style={[styles.buyBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.buyBtnText}>{t.buy}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEsimCard = (esim: MyEsim) => (
    <TouchableOpacity
      key={esim.id}
      style={[styles.esimCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/esim/details?id=${esim.id}`)}
    >
      <View style={styles.esimHeader}>
        <Text style={styles.esimDestination}>{esim.destination}</Text>
        <View
          style={[
            styles.esimStatus,
            {
              backgroundColor:
                esim.status === 'active' ? '#22C55E20' : esim.status === 'expired' ? '#EF444420' : '#F59E0B20',
            },
          ]}
        >
          <Text
            style={[
              styles.esimStatusText,
              {
                color: esim.status === 'active' ? '#22C55E' : esim.status === 'expired' ? '#EF4444' : '#F59E0B',
              },
            ]}
          >
            {esim.status === 'active' ? t.active : esim.status === 'expired' ? t.expired : t.pending}
          </Text>
        </View>
      </View>
      <View style={styles.esimProgress}>
        <View style={[styles.esimProgressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.esimProgressFill,
              {
                width: `${(esim.dataUsed / esim.data) * 100}%`,
                backgroundColor: esim.status === 'active' ? colors.primary : '#ccc',
              },
            ]}
          />
        </View>
        <Text style={[styles.esimProgressText, { color: colors.muted }]}>
          {esim.dataUsed} / {esim.data} {t.gb}
        </Text>
      </View>
      <Text style={[styles.esimExpires, { color: colors.muted }]}>ينتهي في: {esim.expiresAt}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'plans' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('plans')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'plans' ? colors.primary : colors.muted, fontWeight: activeTab === 'plans' ? 'bold' : 'normal' },
              ]}
            >
              {t.dataPlans}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'myEsims' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('myEsims')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'myEsims' ? colors.primary : colors.muted, fontWeight: activeTab === 'myEsims' ? 'bold' : 'normal' },
              ]}
            >
              {t.myEsims}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'plans' ? (
          <View style={styles.content}>
            <FlatList
              data={popularPlans}
              renderItem={({ item }) => renderPlanCard(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              numColumns={1}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12 }}
            />
          </View>
        ) : (
          <View style={styles.content}>
            {myEsims.length > 0 ? (
              <FlatList
                data={myEsims}
                renderItem={({ item }) => renderEsimCard(item)}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={1}
                contentContainerStyle={{ gap: 12 }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.muted }]}>{t.noEsims}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14 },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  planCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 12 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFlag: { fontSize: 24 },
  planDestination: { fontSize: 16, fontWeight: 'bold' },
  planDetails: { flexDirection: 'row', gap: 16 },
  planDetail: { flex: 1 },
  planLabel: { fontSize: 11, marginBottom: 2 },
  planValue: { fontSize: 14, fontWeight: 'bold' },
  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planPrice: { fontSize: 16, fontWeight: 'bold' },
  buyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  esimCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 12 },
  esimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  esimDestination: { fontSize: 16, fontWeight: 'bold' },
  esimStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  esimStatusText: { fontSize: 11, fontWeight: 'bold' },
  esimProgress: { gap: 4 },
  esimProgressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  esimProgressFill: { height: '100%' },
  esimProgressText: { fontSize: 11, textAlign: 'right' },
  esimExpires: { fontSize: 11 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 14 },
});
