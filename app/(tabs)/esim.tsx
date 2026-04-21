import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';

const T = {
  ar: {
    title: 'eSIM Go',
    subtitle: 'اتصل بالعالم بسهولة',
    searchPlans: 'ابحث عن خطة',
    myEsims: 'eSIMs الخاصة بي',
    dataPlans: 'خطط البيانات',
    gb: 'GB',
    days: 'يوم',
    price: 'السعر',
    buy: 'اشترِ الآن',
    active: 'نشط',
    expired: 'منتهية الصلاحية',
    pending: 'قيد التفعيل',
    noEsims: 'لا توجد eSIMs حاليًا',
    noPlans: 'لا توجد خطط متاحة',
    loading: 'جاري التحميل...',
    destination: 'الوجهة',
    status: 'الحالة',
    used: 'المستهلك',
    expires: 'ينتهي في',
    details: 'التفاصيل',
    createSuccess: 'تم إنشاء الطلب بنجاح',
    createError: 'تعذر إنشاء الطلب',
  },
  fr: {
    title: 'eSIM Go',
    subtitle: 'Connectez-vous au monde facilement',
    searchPlans: 'Rechercher des plans',
    myEsims: 'Mes eSIMs',
    dataPlans: 'Plans de données',
    gb: 'GB',
    days: 'jours',
    price: 'Prix',
    buy: 'Acheter maintenant',
    active: 'Actif',
    expired: 'Expiré',
    pending: 'En attente',
    noEsims: 'Aucun eSIM actuellement',
    noPlans: 'Aucun plan disponible',
    loading: 'Chargement...',
    destination: 'Destination',
    status: 'Statut',
    used: 'Consommé',
    expires: 'Expire le',
    details: 'Détails',
    createSuccess: 'Commande créée avec succès',
    createError: 'Impossible de créer la commande',
  },
};

interface EsimPlan {
  id: string;
  destination: string;
  data: number;
  validity: number;
  price: number;
  flag: string;
  planName?: string;
  priceMru?: string;
}

interface MyEsim {
  id: string;
  destination: string;
  data: number;
  dataUsed: number;
  status: 'active' | 'expired' | 'pending';
  expiresAt: string;
  iccid?: string;
}

function normalizeCatalogueItem(item: any, index: number): EsimPlan {
  return {
    id: String(item?.id ?? item?.slug ?? item?.code ?? index + 1),
    destination: String(
      item?.destination ??
        item?.country ??
        item?.title ??
        item?.name ??
        'Unknown'
    ),
    data: Number(item?.data ?? item?.volume ?? item?.gb ?? item?.amount ?? 0),
    validity: Number(
      item?.validity ?? item?.days ?? item?.duration ?? item?.validityDays ?? 0
    ),
    price: Number(item?.price ?? item?.amount ?? item?.priceUsd ?? 0),
    flag: String(item?.flag ?? '🌍'),
    planName: String(item?.planName ?? item?.name ?? item?.title ?? 'Plan'),
    priceMru: String(item?.priceMru ?? item?.price ?? ''),
  };
}

function normalizeOrderItem(item: any, index: number): MyEsim {
  return {
    id: String(item?.id ?? index + 1),
    destination: String(item?.destination ?? item?.country ?? 'Unknown'),
    data: Number(item?.data ?? item?.volume ?? item?.gb ?? 0),
    dataUsed: Number(item?.dataUsed ?? item?.used ?? 0),
    status:
      item?.status === 'active' || item?.status === 'expired'
        ? item.status
        : 'pending',
    expiresAt: String(
      item?.expiresAt ?? item?.expiryDate ?? item?.expirationDate ?? '-'
    ),
    iccid: item?.iccid ? String(item.iccid) : undefined,
  };
}

export default function EsimScreen() {
  const colors = useColors();
  const router = useRouter();
  const t = T['ar'];

  const [activeTab, setActiveTab] = useState<'plans' | 'myEsims'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);

  const {
    data: catalogueData,
    isLoading: catalogueLoading,
    refetch: refetchCatalogue,
  } = trpc.esim.catalogue.useQuery();

  const {
    data: myOrdersData,
    isLoading: myOrdersLoading,
    refetch: refetchMyOrders,
  } = trpc.esim.myOrders.useQuery({ userId: 'user123' });

  const createOrderMutation = trpc.esim.createOrder.useMutation({
    onSuccess: () => {
      Alert.alert('نجاح', t.createSuccess);
      refetchMyOrders();
      setActiveTab('myEsims');
    },
    onError: () => {
      Alert.alert('خطأ', t.createError);
    },
  });

  const plans: EsimPlan[] = useMemo(() => {
    const raw = Array.isArray((catalogueData as any)?.bundles)
      ? (catalogueData as any).bundles
      : Array.isArray(catalogueData)
      ? catalogueData
      : [];
    return raw.map(normalizeCatalogueItem);
  }, [catalogueData]);

  const myEsims: MyEsim[] = useMemo(() => {
    const raw = Array.isArray(myOrdersData) ? myOrdersData : [];
    return raw.map(normalizeOrderItem);
  }, [myOrdersData]);

  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.trim().toLowerCase();
    return plans.filter(
      (plan) =>
        plan.destination.toLowerCase().includes(q) ||
        (plan.planName ?? '').toLowerCase().includes(q)
    );
  }, [plans, searchQuery]);

  const handleBuy = async (plan: EsimPlan) => {
    try {
      setBuyingPlanId(plan.id);
      await createOrderMutation.mutateAsync({
        destination: plan.destination,
        planName: plan.planName || `${plan.data}GB / ${plan.validity}D`,
        priceMru: plan.priceMru || String(plan.price),
      });
    } finally {
      setBuyingPlanId(null);
    }
  };

  const renderPlanCard = ({ item }: { item: EsimPlan }) => (
    <View
      style={[
        styles.planCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planFlag}>{item.flag}</Text>
        <Text style={[styles.planDestination, { color: colors.foreground }]}>
          {item.destination}
        </Text>
      </View>

      <View style={styles.planDetails}>
        <View style={styles.planDetail}>
          <Text style={[styles.planLabel, { color: colors.muted }]}>
            {t.dataPlans}
          </Text>
          <Text style={[styles.planValue, { color: colors.foreground }]}>
            {item.data} {t.gb}
          </Text>
        </View>

        <View style={styles.planDetail}>
          <Text style={[styles.planLabel, { color: colors.muted }]}>
            الصلاحية
          </Text>
          <Text style={[styles.planValue, { color: colors.foreground }]}>
            {item.validity} {t.days}
          </Text>
        </View>
      </View>

      <View style={styles.planFooter}>
        <Text style={[styles.planPrice, { color: colors.primary }]}>
          {item.priceMru || item.price}
        </Text>

        <TouchableOpacity
          style={[
            styles.buyBtn,
            {
              backgroundColor: buyingPlanId === item.id ? colors.muted : colors.primary,
              opacity: createOrderMutation.isPending && buyingPlanId === item.id ? 0.7 : 1,
            },
          ]}
          onPress={() => handleBuy(item)}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending && buyingPlanId === item.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyBtnText}>{t.buy}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEsimCard = ({ item }: { item: MyEsim }) => {
    const statusLabel =
      item.status === 'active'
        ? t.active
        : item.status === 'expired'
        ? t.expired
        : t.pending;

    const progress =
      item.data > 0 ? Math.min((item.dataUsed / item.data) * 100, 100) : 0;

    return (
      <TouchableOpacity
        style={[
          styles.esimCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => {
          if (item.iccid) {
            router.push(`/esim/details?iccid=${encodeURIComponent(item.iccid)}`);
          } else {
            Alert.alert('تنبيه', 'لا يوجد ICCID لهذا الطلب بعد');
          }
        }}
      >
        <View style={styles.esimHeader}>
          <Text style={[styles.esimDestination, { color: colors.foreground }]}>
            {item.destination}
          </Text>

          <View
            style={[
              styles.esimStatus,
              {
                backgroundColor:
                  item.status === 'active'
                    ? '#22C55E20'
                    : item.status === 'expired'
                    ? '#EF444420'
                    : '#F59E0B20',
              },
            ]}
          >
            <Text
              style={[
                styles.esimStatusText,
                {
                  color:
                    item.status === 'active'
                      ? '#22C55E'
                      : item.status === 'expired'
                      ? '#EF4444'
                      : '#F59E0B',
                },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.esimProgress}>
          <View
            style={[
              styles.esimProgressBar,
              { backgroundColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.esimProgressFill,
                {
                  width: `${progress}%`,
                  backgroundColor:
                    item.status === 'active' ? colors.primary : colors.muted,
                },
              ]}
            />
          </View>
          <Text style={[styles.esimProgressText, { color: colors.muted }]}>
            {item.dataUsed} / {item.data} {t.gb}
          </Text>
        </View>

        <Text style={[styles.esimExpires, { color: colors.muted }]}>
          {t.expires}: {item.expiresAt}
        </Text>

        {item.iccid ? (
          <TouchableOpacity
            style={[styles.detailsBtn, { borderColor: colors.primary }]}
            onPress={() =>
              router.push(`/esim/details?iccid=${encodeURIComponent(item.iccid!)}`)
            }
          >
            <Text style={[styles.detailsBtnText, { color: colors.primary }]}>
              {t.details}
            </Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        <View
          style={[
            styles.tabsContainer,
            { borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'plans' && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab('plans')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'plans' ? colors.primary : colors.foreground,
                },
              ]}
            >
              {t.dataPlans}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'myEsims' && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab('myEsims')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'myEsims'
                      ? colors.primary
                      : colors.foreground,
                },
              ]}
            >
              {t.myEsims}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'plans' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.searchPlans}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {activeTab === 'plans' ? (
          <View style={styles.content}>
            {catalogueLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.muted, marginTop: 10 }}>
                  {t.loading}
                </Text>
              </View>
            ) : filteredPlans.length > 0 ? (
              <FlatList
                data={filteredPlans}
                renderItem={renderPlanCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={1}
                contentContainerStyle={{ gap: 12 }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                  {t.noPlans}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {myOrdersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.muted, marginTop: 10 }}>
                  {t.loading}
                </Text>
              </View>
            ) : myEsims.length > 0 ? (
              <FlatList
                data={myEsims}
                renderItem={renderEsimCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={1}
                contentContainerStyle={{ gap: 12 }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                  {t.noEsims}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planFlag: {
    fontSize: 22,
  },
  planDestination: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  planDetail: {
    flex: 1,
  },
  planLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  planValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  esimCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  esimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  esimDestination: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  esimStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  esimStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  esimProgress: {
    gap: 6,
  },
  esimProgressBar: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  esimProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  esimProgressText: {
    fontSize: 12,
  },
  esimExpires: {
    fontSize: 12,
  },
  detailsBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailsBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});
