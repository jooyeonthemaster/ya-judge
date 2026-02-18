import type { ProductConfig } from '@/config/paymentProducts';

interface OrderSummaryProps {
  config: ProductConfig;
  amount: number;
  itemName?: string;
  penaltyReason?: string;
}

export default function OrderSummary({ config, amount, itemName, penaltyReason }: OrderSummaryProps) {
  const { accentBg, accentBorder, accentText } = config.colorScheme;

  return (
    <div className={`${accentBg} ${accentBorder} border rounded-2xl p-5`}>
      <h2 className={`text-sm font-semibold ${accentText} mb-4 tracking-wide uppercase`}>
        주문 정보
      </h2>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-900 font-medium">{config.orderLabel}</p>
          {config.type === 'gift' && itemName && (
            <p className="text-gray-500 text-sm mt-0.5">{itemName}</p>
          )}
          {config.type === 'penalty' && penaltyReason && (
            <p className="text-gray-500 text-sm mt-0.5">사유: {penaltyReason}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {amount.toLocaleString()}
            <span className="text-base font-medium text-gray-500 ml-0.5">원</span>
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200/60 pt-3">
        <p className="text-xs text-gray-500">{config.description}</p>
      </div>
    </div>
  );
}
