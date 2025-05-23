import { motion } from 'framer-motion';
import { Gavel, Share2, Share } from 'lucide-react';

interface ChatRoomHeaderProps {
  activeChattersCount: number;
  onShare?: () => void;
  showShareButton?: boolean;
}

export default function ChatRoomHeader({ 
  activeChattersCount, 
  onShare,
  showShareButton = true 
}: ChatRoomHeaderProps) {
  
  const handleShareRoom = () => {
    if (onShare) {
      onShare();
    } else {
      // 기본 공유 동작
      const roomId = window.location.pathname.split('/').pop();
      if (!roomId) return;
      
      const shareUrl = `${window.location.origin}/chat/${roomId}`;
      
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
        
        {showShareButton && (
          <div className="flex items-center space-x-2">
            {onShare ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onShare}
                className="p-2 text-pink-500 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-colors"
                title="법정 참석자 소환"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShareRoom}
                className="p-2 text-pink-500 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-colors"
                title="법정 링크 복사"
              >
                <Share className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 