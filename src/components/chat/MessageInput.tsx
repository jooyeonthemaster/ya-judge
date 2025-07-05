import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Loader2 } from 'lucide-react';
import { MessageInputProps } from '@/types/chat';

export default function MessageInput({
  disabled,
  isLoading,
  onSendMessage,
  onTypingStatus
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // 타이핑 상태 전송 (디바운스 처리)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 입력 중일 때만 상태 업데이트
    if (e.target.value.length > 0) {
      timeoutRef.current = setTimeout(() => {
        onTypingStatus(true);
        
        // 타이핑 끝남 처리 타이머
        timeoutRef.current = setTimeout(() => {
          onTypingStatus(false);
        }, 3000);
      }, 300); // 300ms 디바운스
    } else {
      // 입력 내용이 없으면 바로 타이핑 상태 해제
      onTypingStatus(false);
    }
  };

  // Korean IME composition handlers
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent submission during Korean IME composition
      if (isComposing || (e.nativeEvent as any).isComposing) {
        return;
      }
      
      e.preventDefault();
      if (input.trim()) {
        onSendMessage(input);
        setInput('');
      }
    }
  };
  
  const handleSendClick = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex items-center space-x-2 h-full">
      <textarea
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="변론 내용을 작성하세요..."
        className="flex-1 h-[60px] min-h-[60px] max-h-[60px] px-3 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 border border-pink-200 transition-all resize-none placeholder:text-gray-400 korean-input"
        disabled={disabled}
      />
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSendClick}
        disabled={isLoading || !input.trim() || disabled}
        className={`px-4 h-[60px] rounded-lg font-medium transition-all shadow-lg ${
          isLoading || !input.trim() || disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:shadow-xl hover:from-pink-700 hover:to-purple-800'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            제출
          </div>
        ) : (
          <div className="flex items-center">
            <Gavel className="w-4 h-4 mr-2" />
            제출
          </div>
        )}
      </motion.button>
    </div>
  );
} 