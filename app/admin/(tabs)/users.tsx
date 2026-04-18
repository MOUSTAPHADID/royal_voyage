import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const T = {
  ar: { title: 'إدارة المستخدمين', search: 'ابحث عن مستخدم...', name: 'الاسم', email: 'البريد', joinDate: 'تاريخ الانضمام', bookings: 'الحجوزات', spending: 'الإنفاق', status: 'الحالة', active: 'نشط', suspended: 'معلق', view: 'عرض', suspend: 'تعليق', noUsers: 'لا يوجد مستخدمون', totalUsers: 'إجمالي المستخدمين', activeUsers: 'مستخدمون نشطون', mru: 'أوق' },
  fr: { title: 'Gestion des utilisateurs', search: 'Rechercher un utilisateur...', name: 'Nom', email: 'Email', joinDate: 'Date d\'adhésion', bookings: 'Réservations', spending: 'Dépenses', status: 'Statut', active: 'Actif', suspended: 'Suspendu', view: 'Voir', suspend: 'Suspendre', noUsers: 'Aucun utilisateur', totalUsers: 'Total utilisateurs', activeUsers: 'Utilisateurs actifs', mru: 'MRU' },
};

interface User { id: number; name: string; email: string; joinDate: string; bookings: number; spending: number; status: 'active' | 'suspended'; }

export default function UsersScreen() {
  const colors = useColors();
  const t = T['ar'];
  const [search, setSearch] = useState('');
  const [loading] = useState(false);
  const [users] = useState<User[]>([
    { id: 1, name: 'محمد علي', email: 'mohammed@example.com', joinDate: '2025-01-10', bookings: 5, spending: 25000, status: 'active' },
    { id: 2, name: 'فاطمة أحمد', email: 'fatima@example.com', joinDate: '2025-01-15', bookings: 3, spending: 15000, status: 'active' },
    { id: 3, name: 'حسن محمود', email: 'hassan@example.com', joinDate: '2024-12-20', bookings: 8, spending: 45000, status: 'active' },
    { id: 4, name: 'ليلى إبراهيم', email: 'layla@example.com', joinDate: '2024-11-05', bookings: 2, spending: 8000, status: 'suspended' },
  ]);

  const filtered = useMemo(() => users.filter(u => u.name.includes(search) || u.email.includes(search)), [search, users]);
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{users.length} {t.totalUsers} · {activeCount} {t.activeUsers}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder={t.search}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noUsers}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(user => (
              <View key={user.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.muted }]}>{user.email}</Text>
                    <Text style={[styles.joinDate, { color: colors.muted }]}>{t.joinDate}: {user.joinDate}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: user.status === 'active' ? '#22C55E20' : '#EF444420' }]}>
                    <Text style={[styles.statusText, { color: user.status === 'active' ? '#22C55E' : '#EF4444' }]}>
                      {user.status === 'active' ? t.active : t.suspended}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardStats, { borderTopColor: colors.border }]}>
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{t.bookings}</Text>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{user.bookings}</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{t.spending}</Text>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{user.spending.toLocaleString('ar-SA')} {t.mru}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t.view}</Text>
                  </TouchableOpacity>
                  {user.status === 'active' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${colors.warning}20` }]}>
                      <Text style={[styles.actionBtnText, { color: colors.warning }]}>{t.suspend}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  card: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 12, marginBottom: 2 },
  joinDate: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardStats: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  statDivider: { width: 1, height: 30 },
  cardActions: { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 0 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: 'bold' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
