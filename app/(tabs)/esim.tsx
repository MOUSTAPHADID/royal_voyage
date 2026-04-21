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
    price
