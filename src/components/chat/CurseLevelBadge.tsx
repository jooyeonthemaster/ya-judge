import { AlertTriangle } from 'lucide-react';
import { CurseLevelBadgeProps } from '@/types/chat';

export default function CurseLevelBadge({ level }: CurseLevelBadgeProps) {
  // Define colors based on curse level
  const getColor = () => {
    if (level <= 3) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (level <= 6) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  // Get appropriate emoji based on curse level
  const getEmoji = () => {
    if (level <= 3) return '😐';
    if (level <= 6) return '😠';
    return '🤬';
  };

  const colorClass = getColor();
  const emoji = getEmoji();

  return (
    <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full flex items-center ${colorClass} border`}>
      <AlertTriangle className="w-3 h-3 mr-0.5" />
      <span>{emoji} {level}/10</span>
    </span>
  );
} 