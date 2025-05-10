'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  SendHorizonal,
  FileBadge,
  AlertTriangle,
  MessageSquare,
  History,
  Gavel,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { CourtStage } from '@/store/chatStore';

interface MessageComposerProps {
  onSendMessage: (text: string, messageType?: string, relatedIssue?: string) => void;
  isLoading: boolean;
  stage: CourtStage;
  currentIssue?: string;
  onStartCourt?: () => void;
  onInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function MessageComposer({
  onSendMessage,
  isLoading,
  stage,
  currentIssue,
  onStartCourt,
  onInputChange
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [messageType, setMessageType] = useState<string>('normal');
  const [showMessageTypes, setShowMessageTypes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 메시지 전송 핸들러
  const handleSendMessage = () => {
    if (!text.trim() || isLoading) return;
    
    onSendMessage(text, messageType, currentIssue);
    setText('');
    
    // 특별 메시지 타입은 전송 후 일반 메시지로 돌아가기
    if (messageType !== 'normal') {
      setMessageType('normal');
    }
    
    // 포커스 복원
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // 부모 컴포넌트의 타이핑 상태 업데이트 핸들러 호출
    if (onInputChange) {
      onInputChange(e);
    }
  };
  
  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 메시지 타입 선택
  const selectMessageType = (type: string) => {
    setMessageType(type);
    
    // 포커스 복원
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // 단계에 따른 메시지 타입 옵션 (토론 단계에선 증거/반론, 최종변론 단계에선 최종변론)
  const getAvailableMessageTypes = () => {
    if (stage === 'discussion') {
      return [
        { id: 'evidence', label: '증거 제출', icon: <FileBadge className="w-4 h-4" /> },
        { id: 'objection', label: '반론 제기', icon: <AlertTriangle className="w-4 h-4" /> }
      ];
    } else if (stage === 'closing') {
      return [
        { id: 'closing', label: '최종 변론', icon: <History className="w-4 h-4" /> }
      ];
    }
    
    // 특별한 메시지 타입이 필요없는 단계에서는 빈 배열 반환
    return [];
  };
  
  // 대기 상태일 때 재판 시작 버튼만 보여줌
  if (stage === 'waiting' as CourtStage) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <button
            onClick={onStartCourt}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center justify-center font-bold shadow-lg hover:bg-indigo-700 transition-colors duration-200 w-full max-w-md"
          >
            <Gavel className="w-5 h-5 mr-2" />
            재판 시작하기
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {/* 메인 입력 영역 */}
      <div className="flex space-x-2">
        {/* 메시지 입력 영역 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              messageType === 'evidence' ? '증거를 입력하세요...' :
              messageType === 'objection' ? '반론을 입력하세요...' :
              messageType === 'closing' ? '최종 변론을 입력하세요...' :
              '메시지를 입력하세요...'
            }
            className={`w-full px-4 py-2 resize-none rounded-lg border text-gray-900 ${
              messageType === 'normal' ? 'border-gray-300 focus:border-gray-400' :
              messageType === 'evidence' ? 'border-emerald-300 focus:border-emerald-400 bg-emerald-50' :
              messageType === 'objection' ? 'border-red-300 focus:border-red-400 bg-red-50' :
              messageType === 'closing' ? 'border-indigo-300 focus:border-indigo-400 bg-indigo-50' :
              'border-gray-300 focus:border-gray-400'
            } focus:outline-none focus:ring-1 ${
              messageType === 'normal' ? 'focus:ring-gray-400' :
              messageType === 'evidence' ? 'focus:ring-emerald-400' :
              messageType === 'objection' ? 'focus:ring-red-400' :
              messageType === 'closing' ? 'focus:ring-indigo-400' :
              'focus:ring-gray-400'
            }`}
            rows={1}
            disabled={isLoading}
          />
          
          {/* 현재 단계 표시 (특별 단계일 때만) */}
          {(stage === 'discussion' || stage === 'closing') && currentIssue && (
            <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-white px-2 py-0.5 text-xs font-medium rounded-full border hidden md:block">
              {stage === 'discussion' && (
                <span className="text-indigo-600">
                  <span className="font-normal text-gray-500 mr-1">쟁점:</span>
                  {currentIssue}
                </span>
              )}
              {stage === 'closing' && (
                <span className="text-purple-600">최종 변론 단계</span>
              )}
            </div>
          )}
        </div>
        
        {/* 전송 버튼 */}
        <button
          onClick={handleSendMessage}
          disabled={!text.trim() || isLoading}
          className={`p-2 rounded-lg bg-indigo-600 text-white flex items-center justify-center ${
            !text.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
          }`}
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
      
      {/* 메시지 타입 선택 버튼들 */}
      {getAvailableMessageTypes().length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {/* 메시지 타입 선택 버튼들 */}
          {getAvailableMessageTypes().map((type) => (
            <button
              key={type.id}
              onClick={() => selectMessageType(type.id)}
              className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${
                messageType === type.id 
                  ? type.id === 'evidence'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : type.id === 'objection'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : type.id === 'closing'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  : type.id === 'evidence'
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    : type.id === 'objection'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : type.id === 'closing'
                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
          
          {/* 기본 메시지 타입으로 돌아갈 수 있는 버튼 */}
          {messageType !== 'normal' && (
            <button
              onClick={() => selectMessageType('normal')}
              className="px-2 py-1 rounded-md text-xs font-medium flex items-center bg-gray-100 text-gray-700 border border-gray-200"
            >
              <span className="mr-1"><MessageSquare className="w-4 h-4" /></span>
              <span>일반 메시지</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}