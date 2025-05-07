'use client';

import { useChatStore } from '@/store/chatStore';
import { motion } from 'framer-motion';

export default function StatsPanel() {
  const { stats } = useChatStore();

  const StatItem = ({ 
    label, 
    value, 
    color, 
    gradientFrom, 
    gradientTo 
  }: {
    label: string;
    value: number;
    color: string;
    gradientFrom: string;
    gradientTo: string;
  }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-bold mb-3">{value}%</div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatItem
        label="민수 로직력"
        value={stats.logicPowerA}
        color="blue"
        gradientFrom="from-blue-500"
        gradientTo="to-blue-600"
      />
      <StatItem
        label="소영 로직력"
        value={stats.logicPowerB}
        color="red"
        gradientFrom="from-red-500"
        gradientTo="to-red-600"
      />
      <StatItem
        label="억지 지수"
        value={stats.bullshitMeter}
        color="orange"
        gradientFrom="from-orange-500"
        gradientTo="to-orange-600"
      />
      <StatItem
        label="증거 강도"
        value={stats.evidenceStrength}
        color="green"
        gradientFrom="from-green-500"
        gradientTo="to-green-600"
      />
    </div>
  );
}
