import { CreditCard, Smartphone, Building2, type LucideIcon } from 'lucide-react';

interface PaymentMethod {
  value: string;
  label: string;
  icon: LucideIcon;
}

const METHODS: PaymentMethod[] = [
  { value: 'CARD', label: '신용카드', icon: CreditCard },
  { value: 'MOBILE', label: '휴대폰', icon: Smartphone },
  { value: 'TRANSFER', label: '계좌이체', icon: Building2 },
];

interface PaymentMethodSelectorProps {
  selected: string;
  onChange: (method: string) => void;
  accentText: string;
  accentBorder: string;
  accentBg: string;
}

export default function PaymentMethodSelector({
  selected,
  onChange,
  accentText,
  accentBorder,
  accentBg,
}: PaymentMethodSelectorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-gray-500 mb-4 tracking-wide uppercase">
        결제수단
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map((method) => {
          const isSelected = selected === method.value;
          const Icon = method.icon;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all ${
                isSelected
                  ? `${accentBorder} ${accentBg} ${accentText}`
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1.5 ${isSelected ? '' : ''}`} />
              <span className={`text-xs font-medium ${isSelected ? accentText : 'text-gray-600'}`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
