import React from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const ChatTimer: React.FC = () => {
  // chatStore에서 타이머 관련 함수와 상태 가져오기
  const { 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    getTimeLeft, 
    timerActive 
  } = useChatStore();
  
  const [timeLeft, setTimeLeft] = React.useState<number>(300); // 5분 (초)
  
  // 타이머 업데이트 함수
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getTimeLeft]);
  
  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // 타이머 시작 핸들러
  const handleStartTimer = () => {
    if (!timerActive) {
      startTimer();
    } else {
      pauseTimer();
    }
  };
  
  // 타이머 리셋 핸들러
  const handleResetTimer = () => {
    if (window.confirm('타이머를 리셋하시겠습니까? 현재 진행 상황이 초기화됩니다.')) {
      resetTimer();
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`timer-display px-3 py-1 rounded-full ${
        timeLeft < 60 ? 'bg-red-500' : 'bg-indigo-700'
      } flex items-center text-white`}>
        <Clock className="w-4 h-4 mr-2" />
        <span className="font-mono text-lg font-bold">
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="timer-controls flex space-x-2">
        <button 
          onClick={handleStartTimer}
          className={`p-2 ${
            timerActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
          } rounded-full text-white`}
          title={timerActive ? '일시 정지' : '재판 시작'}
        >
          {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <button 
          onClick={handleResetTimer}
          className="p-2 bg-red-500 rounded-full hover:bg-red-600 text-white"
          title="재설정"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatTimer; 