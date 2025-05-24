import { motion } from 'framer-motion';
import { Gavel, Share, Users, Clock } from 'lucide-react';

interface ChatRoomHeaderProps {
  activeChattersCount: number;
  onShare: () => void;
  timerActive: boolean;
  onInstantVerdict?: () => void;
  isInstantVerdictEnabled?: boolean;
}

export default function ChatRoomHeader({ 
  activeChattersCount,
  onShare,
  timerActive = false,
  onInstantVerdict,
  isInstantVerdictEnabled = true
}: ChatRoomHeaderProps) {
  
  const handleShareRoom = () => {
    if (onShare) {
      onShare();
    } else {
      // 기본 공유 동작 - 링크 복사
      const roomId = window.location.pathname.split('/').pop();
      if (!roomId) return;
      
      const shareUrl = `${window.location.origin}/room/${roomId}`;
      
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          // 성공 메시지는 부모 컴포넌트에서 처리
        })
        .catch(err => {
          console.error('클립보드 복사 실패:', err);
        });
    }
  };

  return (
    <div className="px-3 py-2 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0 h-[60px] min-h-[60px]">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center">
            <Gavel className="h-5 w-5 mr-2 text-pink-600" />
            재판실
          </h2>
          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full shadow-sm">
            {activeChattersCount}명 참석 중
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 즉시 판결받기 버튼 (재판 중일 때만 표시) */}
          {timerActive && onInstantVerdict && (
            <button
              onClick={isInstantVerdictEnabled ? onInstantVerdict : undefined}
              disabled={!isInstantVerdictEnabled}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 shadow-md text-sm font-medium ${
                isInstantVerdictEnabled
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 cursor-pointer'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              title={isInstantVerdictEnabled ? '' : '5개 이상의 사용자 메시지가 필요합니다'}
            >
              <span>⚡</span>
              <span>즉시 판결</span>
            </button>
          )}
          
          {/* 공유하기 버튼 */}
          <button
            onClick={onShare}
            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md text-sm font-medium"
          >
            <Share className="w-4 h-4" />
            <span>공유</span>
          </button>
        </div>
      </div>
    </div>
  );
} 