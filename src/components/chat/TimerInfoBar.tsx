import { Clock } from 'lucide-react';
import { TimerInfoBarProps } from '@/types/chat';

export default function TimerInfoBar({ isActive, remainingTimeFormatted }: TimerInfoBarProps) {
  if (!isActive) return null;
  
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100 to-purple-100 p-2 flex items-center justify-center shadow-sm border-b border-pink-200 flex-shrink-0">
      <Clock className="text-pink-600 h-4 w-4 mr-2 animate-pulse" />
      <span className="text-pink-800 text-sm font-medium">
        재판 진행 중 - 판결까지 {remainingTimeFormatted} 남음
      </span>
    </div>
  );
} 