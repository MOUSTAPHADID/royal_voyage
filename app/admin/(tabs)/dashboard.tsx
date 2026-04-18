import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const T = {
  ar: {
    title: 'لوحة التحكم',
    totalBookings: 'إجمالي الحجوزات',
    totalRevenue: 'إجمالي الإيرادات',
    activeUsers: 'مستخدمون نشطون',
    pendingPayments: 'دفعات قيد الانتظار',
    mru: 'أوق',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذا العام',
    revenueByType: 'الإيرادات حسب النوع',
    flights: 'رحلات',
    hotels: 'فنادق',
    esim: 'eSIM',
    topDestinations: 'أكثر الوجهات حجزاً',
    recentActivity: 'النشاط الأخير',
    newBooking: 'حجز جديد',
    newPayment: 'دفع جديد',
    cancelledBooking: 'حجز ملغى',
  },
  fr: {
    title: 'Tableau de bord',
    totalBookings: 'Total réservations',
    totalRevenue: 'Revenu total',
    activeUsers: 'Utilisateurs actifs',
    pendingPayments: 'Paiements en attente',
    mru: 'MRU',
    thisMonth: 'Ce mois',
    thisYear: 'Cette année',
    revenueByType: 'Revenu par type',
    flights: 'Vols',
    hotels: 'Hôtels',
    esim: 'eSIM',
    topDestinations: 'Destinations les plus réservées',
    recentActivity: 'Activité récente',
    newBooking: 'Nouvelle réservation',
    newPayment: 'Nouveau paiement',
    cancelledBooking: 'Réservation annulée',
  },
};

interface StatCard {
  label: string;
  value: string;
  trend: number;
  icon: string;
  color: string;
}

export default function DashboardScreen() {
  const colors = useColors();
  const t = T['ar'];
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const stats: StatCard[] = useMemo(() => [
    { label: t.totalBookings, value: '1,247', trend: 12.5, icon: '📊', color: '#3B82F6' },
    { label: t.totalRevenue, value: '2.5M', trend: 8.3, icon: '💰', color: '#22C55E' },
    { label: t.activeUsers, value: '856', trend: 5.2, icon: '👥', color: '#F59E0B' },
    { label: t.pendingPayments, value: '142', trend: -3.1, icon: '⏳', color: '#EF4444' },
  ], [t]);

  const revenueData = [
    { type: t.flights, value: 1500000, percentage: 60 },
    { type: t.hotels, value: 750000, percentage: 30 },
    { type: t.esim, value: 250000, percentage: 10 },
  ];

  const topDestinations = [
    { name: 'باريس', bookings: 245, revenue: 500000 },
    { name: 'دبي', bookings: 198, revenue: 450000 },
    { name: 'برشلونة', bookings: 167, revenue: 380000 },
    { name: 'لندن', bookings: 156, revenue: 370000 },
    { name: 'نيويورك', bookings: 142, revenue: 350000 },
  ];

  const recentActivities = [
    { type: 'booking', user: 'محمد علي', description: t.newBooking, time: 'منذ 5 دقائق' },
    { type: 'payment', user: 'فاطمة أحمد', description: t.newPayment, time: 'منذ 15 دقيقة' },
    { type: 'booking', user: 'حسن محمود', description: t.newBooking, time: 'منذ 30 دقيقة' },
    { type: 'cancelled', user: 'ليلى إبراهيم', description: t.cancelledBooking, time: 'منذ ساعة' },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'month' && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
              onPress={() => setPeriod('month')}
            >
              <Text style={styles.periodBtnText}>{t.thisMonth}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'year' && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
              onPress={() => setPeriod('year')}
            >
              <Text style={styles.periodBtnText}>{t.thisYear}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statTrend, { color: stat.trend > 0 ? '#22C55E' : '#EF4444' }]}>
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue by Type */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.revenueByType}</Text>
          {revenueData.map((item, i) => (
            <View key={i} style={styles.revenueItem}>
              <View style={styles.revenueInfo}>
                <Text style={[styles.revenueName, { color: colors.foreground }]}>{item.type}</Text>
                <Text style={[styles.revenueValue, { color: colors.muted }]}>
                  {(item.value / 1000000).toFixed(1)}M {t.mru}
                </Text>
              </View>
              <View style={[styles.revenueBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.revenueBarFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: i === 0 ? '#3B82F6' : i === 1 ? '#22C55E' : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.revenuePercent, { color: colors.muted }]}>{item.percentage}%</Text>
            </View>
          ))}
        </View>

        {/* Top Destinations */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.topDestinations}</Text>
          {topDestinations.map((dest, i) => (
            <View key={i} style={[styles.destItem, { borderBottomColor: colors.border, borderBottomWidth: i < topDestinations.length - 1 ? 1 : 0 }]}>
              <View style={styles.destRank}>
                <Text style={[styles.destRankText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <View style={styles.destInfo}>
                <Text style={[styles.destName, { color: colors.foreground }]}>{dest.name}</Text>
                <Text style={[styles.destStats, { color: colors.muted }]}>
                  {dest.bookings} حجز • {(dest.revenue / 1000).toFixed(0)}K {t.mru}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.recentActivity}</Text>
          {recentActivities.map((activity, i) => (
            <View key={i} style={[styles.activityItem, { borderBottomColor: colors.border, borderBottomWidth: i < recentActivities.length - 1 ? 1 : 0 }]}>
              <View style={[styles.activityIcon, { backgroundColor: activity.type === 'booking' ? '#3B82F620' : activity.type === 'payment' ? '#22C55E20' : '#EF444420' }]}>
                <Text style={styles.activityIconText}>
                  {activity.type === 'booking' ? '📅' : activity.type === 'payment' ? '💳' : '❌'}
                </Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityUser, { color: colors.foreground }]}>{activity.user}</Text>
                <Text style={[styles.activityDesc, { color: colors.muted }]}>{activity.description}</Text>
              </View>
              <Text style={[styles.activityTime, { color: colors.muted }]}>{activity.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  periodToggle: { flexDirection: 'row', gap: 8 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  periodBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 16, gap: 8 },
  statCard: { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: 12, padding: 12 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIcon: { fontSize: 24 },
  statTrend: { fontSize: 12, fontWeight: 'bold' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11 },
  section: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  revenueItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  revenueInfo: { width: 80 },
  revenueName: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  revenueValue: { fontSize: 11 },
  revenueBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  revenueBarFill: { height: '100%' },
  revenuePercent: { width: 30, textAlign: 'right', fontSize: 11 },
  destItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  destRank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F620' },
  destRankText: { fontWeight: 'bold', fontSize: 12 },
  destInfo: { flex: 1 },
  destName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  destStats: { fontSize: 11 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityIconText: { fontSize: 18 },
  activityContent: { flex: 1 },
  activityUser: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  activityDesc: { fontSize: 11 },
  activityTime: { fontSize: 10, textAlign: 'right' },
});
