import type { PaymentProductType } from '@/types/verdict';
import { RotateCcw, Banknote, Gift, type LucideIcon } from 'lucide-react';

export interface ProductColorScheme {
  headerFrom: string;
  headerTo: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  buttonFrom: string;
  buttonTo: string;
  buttonHoverFrom: string;
  buttonHoverTo: string;
  focusRing: string;
  focusBorder: string;
}

export interface ProductConfig {
  type: PaymentProductType;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  colorScheme: ProductColorScheme;
  orderLabel: string;
  defaultAmount: number;
}

const PRODUCT_CONFIGS: Record<PaymentProductType, ProductConfig> = {
  retrial: {
    type: 'retrial',
    title: '재심 청구',
    subtitle: '판결에 이의가 있으신가요?',
    description: '재심을 통해 새로운 판결을 받아보세요. AI 판사가 다시 한번 공정하게 심리합니다.',
    icon: RotateCcw,
    colorScheme: {
      headerFrom: 'from-indigo-600',
      headerTo: 'to-blue-700',
      accentBg: 'bg-indigo-50',
      accentBorder: 'border-indigo-200',
      accentText: 'text-indigo-700',
      buttonFrom: 'from-indigo-600',
      buttonTo: 'to-blue-600',
      buttonHoverFrom: 'hover:from-indigo-700',
      buttonHoverTo: 'hover:to-blue-700',
      focusRing: 'focus:ring-indigo-500',
      focusBorder: 'focus:border-indigo-500',
    },
    orderLabel: '재심 참가비',
    defaultAmount: 1000,
  },
  penalty: {
    type: 'penalty',
    title: '벌금 납부',
    subtitle: 'AI 판사가 부과한 벌금입니다',
    description: '판결에 따른 벌금을 납부해주세요. 화해를 위한 첫걸음입니다.',
    icon: Banknote,
    colorScheme: {
      headerFrom: 'from-amber-600',
      headerTo: 'to-orange-600',
      accentBg: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentText: 'text-amber-700',
      buttonFrom: 'from-amber-500',
      buttonTo: 'to-orange-500',
      buttonHoverFrom: 'hover:from-amber-600',
      buttonHoverTo: 'hover:to-orange-600',
      focusRing: 'focus:ring-amber-500',
      focusBorder: 'focus:border-amber-500',
    },
    orderLabel: '화해 벌금',
    defaultAmount: 0,
  },
  gift: {
    type: 'gift',
    title: '화해 선물',
    subtitle: '화해의 마음을 전하세요',
    description: '작은 선물이 큰 화해의 시작이 될 수 있습니다.',
    icon: Gift,
    colorScheme: {
      headerFrom: 'from-rose-500',
      headerTo: 'to-pink-600',
      accentBg: 'bg-rose-50',
      accentBorder: 'border-rose-200',
      accentText: 'text-rose-700',
      buttonFrom: 'from-rose-500',
      buttonTo: 'to-pink-500',
      buttonHoverFrom: 'hover:from-rose-600',
      buttonHoverTo: 'hover:to-pink-600',
      focusRing: 'focus:ring-rose-500',
      focusBorder: 'focus:border-rose-500',
    },
    orderLabel: '화해 선물',
    defaultAmount: 0,
  },
};

export interface ParsedProductInfo {
  config: ProductConfig;
  amount: number;
  orderName: string;
  itemName?: string;
  penaltyReason?: string;
}

export function getProductFromURL(): ParsedProductInfo {
  if (typeof window === 'undefined') {
    return {
      config: PRODUCT_CONFIGS.retrial,
      amount: 1000,
      orderName: '재심 참가비',
    };
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') as PaymentProductType | null;
  const amount = params.get('amount');
  const item = params.get('item');

  if (type === 'penalty' && amount) {
    return {
      config: PRODUCT_CONFIGS.penalty,
      amount: Number(amount),
      orderName: '화해 벌금',
      penaltyReason: decodeURIComponent(params.get('reason') || ''),
    };
  }

  if (type === 'gift' && amount) {
    const itemName = item ? decodeURIComponent(item) : '선물';
    return {
      config: PRODUCT_CONFIGS.gift,
      amount: Number(amount),
      orderName: `화해 선물 (${itemName})`,
      itemName,
    };
  }

  return {
    config: PRODUCT_CONFIGS.retrial,
    amount: 1000,
    orderName: '재심 참가비',
  };
}
