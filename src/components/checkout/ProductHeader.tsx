import type { ProductConfig } from '@/config/paymentProducts';

interface ProductHeaderProps {
  config: ProductConfig;
  itemName?: string;
}

export default function ProductHeader({ config, itemName }: ProductHeaderProps) {
  const Icon = config.icon;
  const { headerFrom, headerTo } = config.colorScheme;

  return (
    <div className={`bg-gradient-to-r ${headerFrom} ${headerTo} px-6 py-8 text-white`}>
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-white/80 text-sm mt-0.5">{config.subtitle}</p>
          {config.type === 'gift' && itemName && (
            <p className="text-white/90 text-xs mt-1 bg-white/15 inline-block px-2 py-0.5 rounded-full">
              {itemName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
