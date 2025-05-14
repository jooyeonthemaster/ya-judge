import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageList from './MessageList';
import IssuesSidebar from './IssuesSidebar';
import ChatTimer from './ChatTimer';
import { AlertTriangle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  loading: boolean;
}

// 임시 MessageInput 컴포넌트 (실제 구현시 분리가 필요합니다)
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled, loading }) => {
  const [text, setText] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text);
      setText('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="메시지를 입력하세요..."
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
      >
        {loading ? '전송 중...' : '전송'}
      </button>
    </form>
  );
};

const ChatRoom: React.FC = () => {
  const {
    messages,
    addMessage,
    timerActive,
    detectedIssues,
    judgeInterventions,
    requestJudgeAnalysis,
    requestFinalVerdict,
    clearChat,
    startTimer: startTimerFromStore,
    isLoading,
    error
  } = useChatStore();
  
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showVerdictModal, setShowVerdictModal] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // 메시지 자동 스크롤
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 판결 이후 컨페티 효과 
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);
  
  // 타이머 시작 핸들러
  const handleStartTrial = () => {
    // 기존 대화 유지 여부 확인
    if (messages.length > 0) {
      if (window.confirm('기존 대화 내용을 유지하고 타이머만 시작하시겠습니까?')) {
        startTimerFromStore();
      } else {
        clearChat();
        startTimerFromStore();
      }
    } else {
      startTimerFromStore();
      
      // 시작 메시지 추가
      addMessage({
        user: 'judge',
        name: '판사',
        text: '재판이 시작되었습니다. 각자의 입장을 자유롭게 설명해주세요. 저는 여러분의 대화를 지켜보다가 필요할 때 개입하겠습니다.'
      });
    }
  };
  
  // 수동 분석 요청 핸들러
  const handleRequestAnalysis = () => {
    requestJudgeAnalysis();
  };
  
  // 최종 판결 요청 핸들러
  const handleRequestVerdict = () => {
    if (window.confirm('정말 최종 판결을 요청하시겠습니까? 대화가 종료됩니다.')) {
      requestFinalVerdict();
      setShowConfetti(true);
      setShowVerdictModal(true);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto bg-white shadow-lg">
        {/* 헤더 영역 */}
        <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">AI 판사 재판실</h1>
          
          {/* 타이머 영역 */}
          <ChatTimer />
        </div>
        
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList 
            messages={messages} 
            interventions={judgeInterventions}
          />
          <div ref={messageEndRef} />
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* 입력 영역 */}
        <div className="border-t p-4">
          <MessageInput 
            onSendMessage={(text) => {
              addMessage({
                user: 'user-general',
                name: '사용자', // 실제 구현에서는 현재 사용자 이름 사용
                text
              });
            }}
            disabled={isLoading || !timerActive}
            loading={isLoading}
          />
          
          {/* 추가 버튼들 */}
          <div className="flex justify-between mt-2">
            <div className="space-x-2">
              <button
                onClick={handleRequestAnalysis}
                disabled={isLoading || !timerActive}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                판사 의견 요청
              </button>
            </div>
            
            <button
              onClick={handleRequestVerdict}
              disabled={isLoading || !timerActive}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              최종 판결 요청
            </button>
          </div>
        </div>
      </div>
      
      {/* 사이드바 - 감지된 쟁점 */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <IssuesSidebar issues={detectedIssues} />
      </div>
      
      {/* 판결 모달 */}
      {showVerdictModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">최종 판결</h2>
            {/* 판결 내용 표시 - 실제 구현에서는 API 응답에서 판결 데이터 사용 */}
            <div className="verdict-content prose">
              <p>판결이 내려졌습니다.</p>
            </div>
            <button
              onClick={() => setShowVerdictModal(false)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 