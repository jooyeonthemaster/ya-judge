import { Loader2, Lock } from 'lucide-react';
import type { ProductConfig } from '@/config/paymentProducts';

interface CheckoutButtonProps {
  config: ProductConfig;
  amount: number;
  isLoading: boolean;
  disabled: boolean;
}

export default function CheckoutButton({ config, amount, isLoading, disabled }: CheckoutButtonProps) {
  const { buttonFrom, buttonTo, buttonHoverFrom, buttonHoverTo } = config.colorScheme;

  return (
    <div className="space-y-3">
      <button
        type="submit"
        disabled={disabled}
        className={`w-full py-4 px-6 rounded-2xl text-white font-semibold text-base transition-all shadow-lg ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed shadow-none'
            : `bg-gradient-to-r ${buttonFrom} ${buttonTo} ${buttonHoverFrom} ${buttonHoverTo} active:scale-[0.98]`
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>결제 처리 중...</span>
          </span>
        ) : (
          <span>{amount.toLocaleString()}원 결제하기</span>
        )}
      </button>
      <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        <span>안전한 결제 환경이 보장됩니다</span>
      </div>
    </div>
  );
}
