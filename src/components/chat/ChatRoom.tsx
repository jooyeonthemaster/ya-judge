'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore, Message } from '@/store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { 
  Brain, 
  Gavel, 
  MessageSquare, 
  AlertTriangle,

  ThumbsUp,
  ThumbsDown,
  Quote,
  CheckCircle2,
  Scale,
  Shield,
  Zap,
  Flame,
  Sparkles,
  ChevronDown,
  Heart,
  Eye,
  Star,
  UserCircle,
  Link,
  Share2,
  Loader2,
  Share,
  Clock,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { 
  getFinalVerdict,
  analyzeConversation,
  VerdictData,
  PersonalizedResponse,
} from '@/lib/gemini';
import { ref, onValue, set, remove, off, get, onDisconnect } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useParams } from 'next/navigation';
// Import timer configurations
import { 
  DEFAULT_TIMER_DURATION, 
  TEST_TIMER_DURATION, 
  TimerState, 
  TimerData, 
  formatRemainingTime, 
  getTimerDuration 
} from '@/lib/timerConfig';

// 새 컴포넌트 임포트
import ChatTimer from '../ChatTimer';
import IssuesSidebar from '../IssuesSidebar';
import MessageComposer from './MessageComposer';
import JudgeIntervention from '../JudgeIntervention';
import CourtReadyModal from './CourtReadyModal';

// Import the timer configuration at the top of the file
import { TIMER_DURATION_SECONDS } from '../../lib/timerConfig';

interface ChatRoomProps {
  roomId: string | null;
  userType?: string;
  customUsername?: string;
  onShare?: () => void;
  initialStage?: string;
  activeChattersCount?: number;
}

// 프로필 이니셜 컴포넌트 - 이름의 첫 글자를 표시하는 프로필
const ProfileInitial: React.FC<{ name: string, isMine: boolean }> = ({ name, isMine }) => {
  const initial = name.charAt(0).toUpperCase();
  
  // 판사인 경우 이미지 사용
  if (name === '판사') {
    return (
      <img 
        src="/images/judge.png" 
        alt="판사" 
        className="w-20 h-20 object-contain"
      />
    );
  }
  
  return (
    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-base font-medium ${
      isMine ? 'bg-indigo-400 text-white' : 'bg-gray-300 text-gray-700'
    }`}>
      {initial}
    </div>
  );
};

// 시간 형식 포맷팅 함수 (ISO 문자열 -> 상대적 시간 표시)
const formatTime = (timestamp: string): string => {
  try {
    // 타임스탬프가 없는 경우 빈 문자열 반환
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // 유효하지 않은 날짜인 경우 빈 문자열 반환
    if (isNaN(date.getTime())) return '';
    
    // 모든 시간을 상대적 시간으로 표시
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    // 초 단위 표시 (1분 미만)
    if (diffSecs < 60) return '방금 전';
    
    // 분 단위 표시 (1시간 미만)
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}분 전`;
    
    // 시간 단위 표시 (1일 미만)
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    // 일 단위 표시 (30일 미만)
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;
    
    // 그 이상은 날짜 표시
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('시간 포맷팅 오류:', error);
    return '';
  }
};

// Add this interface for curse level display
interface CurseLevelIndicator {
  level: number;
  label: string;
  color: string;
}

// Add a function to get curse level indicator based on level
const getCurseLevelIndicator = (level: number): CurseLevelIndicator => {
  if (level >= 25) {
    return { level, label: '극도로 심각', color: 'bg-red-900 text-white' };
  } else if (level >= 20) {
    return { level, label: '매우 심각', color: 'bg-red-600 text-white' };
  } else if (level >= 15) {
    return { level, label: '심각', color: 'bg-red-500 text-white' };
  } else if (level >= 10) {
    return { level, label: '중대', color: 'bg-orange-500 text-white' };
  } else if (level >= 5) {
    return { level, label: '중간', color: 'bg-yellow-500 text-white' };
  } else if (level > 0) {
    return { level, label: '경미', color: 'bg-yellow-200 text-yellow-800' };
  } else {
    return { level, label: '없음', color: 'bg-green-100 text-green-800' };
  }
};

// Add the CurseLevelBadge component
const CurseLevelBadge: React.FC<{ level: number }> = ({ level }) => {
  const indicator = getCurseLevelIndicator(level);
  
  if (level === 0) return null;
  
  return (
    <div className={`px-2 py-1 rounded-full text-xs ${indicator.color} ml-2`}>
      욕설 수준: {indicator.label} ({level}/30)
    </div>
  );
};

// Add function to display cursing warning with level
const renderCurseWarning = (message: Message, curseLevel: number) => {
  const indicator = getCurseLevelIndicator(curseLevel);
  
  return (
    <div className="my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700 font-medium">공격적인 언어가 감지되었습니다</span>
        <div className={`ml-2 px-2 py-0.5 rounded-full text-xs ${indicator.color}`}>
          수준: {indicator.label}
        </div>
      </div>
      <p className="mt-1 text-sm text-red-600">
        상대를 존중하는 언어를 사용해주세요. 부적절한 언어 사용은 판결에 반영됩니다.
      </p>
    </div>
  );
};

export default function ChatRoom({ 
  roomId, 
  userType, 
  customUsername, 
  onShare, 
  initialStage = 'waiting',
  activeChattersCount = 0
}: ChatRoomProps) {
  const { roomId: nextRoomId } = useParams<{ roomId?: string }>() || {};
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showJudgeEntrance, setShowJudgeEntrance] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);
  const isFirstRender = useRef(true);
  
  // 판사 요청 승인 관련 상태 추가
  const [judgeRequested, setJudgeRequested] = useState(false);
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [localApproval, setLocalApproval] = useState(false);
  
  // 모달 관련 상태 추가
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [isJudgeInProgress, setIsJudgeInProgress] = useState(false);
  
  // 메시지 타입 관련 상태
  const [messageType, setMessageType] = useState<string | null>(null);
  
  // 항소 관련 상태
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  
  // 재판 준비 모달 상태 추가
  const [showCourtReadyModal, setShowCourtReadyModal] = useState(false);
  const [userReady, setUserReady] = useState(false);
  
  // 누락된 상태 추가
  const [readyUsers, setReadyUsers] = useState<Record<string, boolean>>({});
  const [showConfirmStartModal, setShowConfirmStartModal] = useState(false);
  
  // 고정된 프로그레스 바 표시 여부
  const [showFixedProgressBar, setShowFixedProgressBar] = useState(false);
  
  // 타이머 모드와 단계별 모드 간의 전환 관리
  const [showTimerMode, setShowTimerMode] = useState(false);
  
  // Add these state variables with the other states
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  // Use centralized timer config instead of hardcoded values
  const [timerDuration, setTimerDuration] = useState(getTimerDuration());
  const [remainingTime, setRemainingTime] = useState(getTimerDuration());
  // Replace with timer state from timerConfig
  const [timerState, setTimerState] = useState<TimerState>('idle');
  
  // Add state to track if final verdict has been triggered
  const [finalVerdictTriggered, setFinalVerdictTriggered] = useState(false);
  
  // Add state for trial ready status after verdict for non-host clients
  const [trialReady, setTrialReady] = useState(false);
  const [showTrialReadyButton, setShowTrialReadyButton] = useState(false);
  
  // Add state to track post-verdict ready status for all users
  const [postVerdictReadyUsers, setPostVerdictReadyUsers] = useState<Record<string, boolean>>({});
  const [showPostVerdictStartButton, setShowPostVerdictStartButton] = useState(false);
  
  // Import this at the top of the file, near the other imports
  const [apiCallsEnabled, setApiCallsEnabled] = useState(true);
  
  // State variables for issue notification
  const [isIssueNotificationOpen, setIsIssueNotificationOpen] = useState(false);
  const [hasNewIssues, setHasNewIssues] = useState(false);
  const [previousIssuesCount, setPreviousIssuesCount] = useState(0);
  
  // Add state to track room host
  const [isRoomHost, setIsRoomHost] = useState(false);
  
  // Add state for host left modal
  const [showHostLeftModal, setShowHostLeftModal] = useState(false);
  
  const { 
    messages, 
    stats, 
    addMessage, 
    updateStats, 
    clearMessages, 
    setCurrentUser,
    roomUsers,
    typingUsers,
    setTypingStatus,
    joinRoom,
    leaveRoom,
    // 타이머 관련 메서드
    startTimer,
    resetTimer,
    timerActive,
    getTimeLeft,
    requestJudgeAnalysis,
    judgeInterventions,
    detectedIssues,
    clearChat,
    requestFinalVerdict,
    // 욕설 레벨 관련 메서드
    userCurseLevels,
    getUserCurseLevel
  } = useChatStore();

  // 사용자 이름 처리
  useEffect(() => {
    if (!roomId) return;
    
    const userId = localStorage.getItem('userId') || uuidv4();
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
    
    // 이미 저장된 사용자 이름 확인 또는 커스텀 이름 사용
    // 이름 모달에서 최종 확정된 이름만 사용
    let storedUsername = localStorage.getItem(`chat_username_${roomId}`);
    
    if (storedUsername) {
      // 이름이 이미 설정되어 있을 때만 채팅방 참여
      setUsername(storedUsername);
      if (roomId) {
        joinRoom(roomId, storedUsername);
        // Initialize curse level tracking
        initializeUserCurseLevels();
        
        // Check if this user is the room host
        checkAndSetRoomHost(userId);
      }
      return;
    }
    
    // 이름이 설정되지 않은 경우 채팅방 참여는 하지 않음
    // 사용자가 이름 모달에서 이름을 설정하면 그때 joinRoom이 호출됨
  }, [roomId, joinRoom, leaveRoom, userCurseLevels, getUserCurseLevel]);

  // Add function to check and set room host
  const checkAndSetRoomHost = (userId: string) => {
    if (!roomId || !database) return;
    
    const hostRef = ref(database, `rooms/${roomId}/host`);
    
    // Check if a host exists
    get(hostRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // No host exists, set this user as host
        set(hostRef, userId);
        setIsRoomHost(true);
      } else {
        // Host exists, check if it's this user
        const hostId = snapshot.val();
        setIsRoomHost(hostId === userId);
      }
    }).catch((error) => {
      console.error("Error checking room host:", error);
    });
  };

  // 메시지 자동 스크롤
  useEffect(() => {
    if (!messagesEndRef.current || !isAutoScrollEnabled.current) return;
    
    // 스크롤 위치 계산
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // 약간의 지연을 주어 렌더링이 완료된 후 스크롤
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);
  
  // 사용자 스크롤 감지
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      // 스크롤이 바닥에서 100px 이상 떨어져 있으면 자동 스크롤 비활성화
      isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    
    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // 스크롤 감지하여 고정 프로그레스바 표시 여부 결정
  useEffect(() => {
    // chatContainerRef가 없으면 실행하지 않음
    if (!chatContainerRef.current) return;
    
    const chatContainer = chatContainerRef.current;
    
    const handleScroll = () => {
      // 헤더 높이(약 60px) 이상 스크롤했을 때 고정 프로그레스바 표시
      if (chatContainer.scrollTop > 60) {
        setShowFixedProgressBar(true);
      } else {
        setShowFixedProgressBar(false);
      }
    };
    
    // 스크롤 이벤트 리스너 등록
    chatContainer.addEventListener('scroll', handleScroll);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 메시지 추가에 따른 AI 판사 자동 개입 관리
  useEffect(() => {
    // 첫 번째 렌더링은 무시 (초기 마운트 시)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Don't trigger automatic analysis if API calls are disabled or final verdict is triggered
    if (!timerActive || isAnalyzing || !apiCallsEnabled || finalVerdictTriggered) {
      console.log('Automatic analysis disabled - timer, API calls, or verdict status', 
        {timerActive, isAnalyzing, apiCallsEnabled, finalVerdictTriggered});
      return;
    }
    
    // 이 부분을 제거하여 자동 개입을 비활성화합니다.
    // 타이머가 활성화되어 있고 분석 중이 아니더라도 자동 개입하지 않음
  }, [messages, timerActive, isAnalyzing, apiCallsEnabled, finalVerdictTriggered]);

  // 메시지 보내기
  const sendMessage = (text: string, type?: string, relatedIssue?: string) => {
    if (!text.trim() || !roomId) return;
    
    const userId = localStorage.getItem('userId') || uuidv4();
    
    // Firebase에 undefined 값을 저장할 수 없으므로 null 처리
    const cleanType = type || 'normal';
    
    addMessage({
      user: 'user-general',
      name: username,
      text: text,
      roomId: roomId,
      sender: {
        id: userId,
        username
      },
      messageType: cleanType as any,
      relatedIssue: relatedIssue || undefined // relatedIssue가 없으면 undefined 사용
    });
  };

  // 재판 시작 - 실시간 모드로 수정
  const initiateCourtProcess = () => {
    console.log('재판 준비 모달 표시');
    console.log('현재 참가자 목록:', roomUsers);
    
    // 재판 준비 모달 표시
    setShowCourtReadyModal(true);
  };
  
  // 사용자 준비 완료 처리
  const handleUserReady = () => {
    const userId = localStorage.getItem('userId') || uuidv4();
    updateUserReadyStatus(userId, true);
  };
  
  // 타이머 모드와 단계별 모드 간의 전환 관리
  const startTimerMode = () => {
    // Reset verdict flag
    setFinalVerdictTriggered(false);
    
    // Set start time
    const startTime = new Date();
    setTimerStartTime(startTime);
    setTimerState('running');
    
    // Update local timer state
    startTimer();
    setShowTimerMode(true);
    
    // Reset remaining time to full duration
    setRemainingTime(timerDuration);
    
    // Firebase에 타이머 시작 상태 저장 (다른 참가자와 동기화)
    if (roomId && database) {
      const timerRef = ref(database, `rooms/${roomId}/timer`);
      // Using TimerData interface
      const timerData: TimerData = {
        active: true,
        startTime: startTime.toISOString(),
        durationSeconds: timerDuration
      };
      set(timerRef, timerData);
    }
    
    // 시작 메시지 추가
    addMessage({
      user: 'system',
      name: '시스템',
      text: '실시간 AI 판사 모드가 시작되었습니다. 자유롭게 대화하세요. 판사는 필요할 때 자동으로 개입합니다.',
      roomId: roomId || ''
    });
    
    // 판사 소개 메시지 추가
    addMessage({
      user: 'judge',
      name: '판사',
      text: `안녕하세요, 여러분의 대화를 지켜보다가 필요할 때 개입하는 AI 판사입니다. 자유롭게 대화를 나누세요. ${Math.floor(timerDuration / 60)}분 후 최종 판결을 내리겠습니다.`,
      roomId: roomId || ''
    });
  };
  
  // 재판 시작 함수를 수정하여 타이머 모드로 전환
  const handleStartTrial = () => {
    // 이전 사용하던 confirm 대화상자 대신 모달 사용
    if (messages.length > 0) {
      setShowConfirmStartModal(true);
    } else {
      // 메시지가 없는 경우 바로 시작
      clearChat();
      setShowCourtReadyModal(false);
      startTimerMode();
    }
  };
  
  // 판사 요청 핸들러
  const handleJudgeRequest = () => {
    if (isAnalyzing || !apiCallsEnabled || finalVerdictTriggered) return;
    requestJudgeAnalysis(false, true);
  };
  
  // 타이핑 상태 관리
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    const userId = localStorage.getItem('userId') || uuidv4();
    if (!userId) {
      localStorage.setItem('userId', uuidv4());
    }
    
    // 타이핑 상태 전송 (디바운스 처리)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 입력 중일 때만 상태 업데이트 (이전 상태와 다를 경우에만)
    if (e.target.value.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setTypingStatus(userId, username, true);
        
        // 타이핑 끝남 처리 타이머
        timeoutRef.current = setTimeout(() => {
          setTypingStatus(userId, username, false);
        }, 3000);
      }, 300); // 300ms 디바운스
    } else {
      // 입력 내용이 없으면 바로 타이핑 상태 해제
      setTypingStatus(userId, username, false);
    }
  };

  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 인자를 전달하여 sendMessage 호출
      sendMessage(input);
      setInput('');
    }
  };

  // 심판 판정 시작
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [judgeAttempts, setJudgeAttempts] = useState(0);
  
  // 단계별 판사 호출 함수
  const callJudge = async () => {
    if (isAnalyzing || !apiCallsEnabled || finalVerdictTriggered) {
      console.log('API calls disabled or already analyzing');
      return;
    }
    
    setIsAnalyzing(true);
    setJudgeError(null);
    
    try {
      // 시스템 메시지 제외한 메시지 필터링
      const filteredMessages = messages.filter(msg => msg.user !== 'system');
      
      if (filteredMessages.length < 2) {
        setJudgeError('판사가 분석할 충분한 대화가 없습니다.');
        setIsAnalyzing(false);
        return;
      }
      
      // Add check before making the API call
      if (!apiCallsEnabled || finalVerdictTriggered) {
        console.log('API calls disabled during analysis - aborting');
        setIsAnalyzing(false);
        return;
      }
      
      // Real-time AI judge analysis request - show message for user-initiated analysis
      await requestJudgeAnalysis(false, true);
      
      setJudgeAttempts(0);
    } catch (error) {
      console.error('Judge call error:', error);
      setJudgeError('Error occurred during judge request.');
      
      // Add error message
      addMessage({
        user: 'system',
        name: '시스템',
        text: 'Error during judge request. Please try again.',
        roomId: roomId || '',
      });
      
      setJudgeAttempts(prev => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 기존 판결 함수 (for backward compatibility)
  const startJudgement = async () => {
    // 이미 분석 중이면 중복 호출 방지
    if (isAnalyzing) {
      console.log('이미 판사 분석 중입니다. 중복 호출 방지.');
      return Promise.resolve();
    }
    
    setIsAnalyzing(true);
    setJudgeError(null);
    
    try {
      console.log('판사 기능 시작: API 호출 준비');
      console.log('환경 변수 확인:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '설정됨' : '미설정');
      
      // 재시도 횟수 증가
      setJudgeAttempts(prev => prev + 1);
      
      // API 호출을 위한 메시지 필터링 (시스템 메시지 제외)
      const filteredMessages = messages.filter(msg => msg.user !== 'system');
      console.log('필터링된 메시지:', filteredMessages.length);
      
      if (filteredMessages.length < 2) {
        setJudgeError('판결을 내리기에 충분한 대화가 없습니다. 더 많은 대화가 필요합니다.');
        setIsAnalyzing(false);
        return Promise.reject('대화 내용 부족');
      }
      
      // Message 타입 호환성 확보 (실제로는 user-a, user-b는 더 이상 사용되지 않음)
      const compatibleMessages = filteredMessages as Message[];
      
      console.log('Gemini API 호출 시도');
      const judgeResponse = await getFinalVerdict(compatibleMessages, detectedIssues);
      console.log('Gemini API 응답 받음:', judgeResponse ? '성공' : '실패');
      
      // 판사 메시지 추가
      addMessage({
        user: 'judge',
        name: '판사',
        text: judgeResponse.verdict ? judgeResponse.verdict.summary : '판단을 내릴 수 없습니다. 더 많은 대화가 필요합니다.',
        roomId: roomId || ''
      });
      
      // 성공 시 재시도 횟수 초기화
      setJudgeAttempts(0);
      setIsAnalyzing(false);
      
      // 성공 반환
      return Promise.resolve();
    } catch (error) {
      console.error('판사 기능 오류:', error);
      setIsAnalyzing(false);
      setJudgeError('판사 호출 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.');
      
      // 에러 메시지 추가
      addMessage({
        user: 'system',
        name: '시스템',
        text: '판사 호출 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.',
        roomId: roomId || '',
      });
      
      // 오류 반환
      return Promise.reject(error);
    }
  };

  // Update the main timer completion handler
  useEffect(() => {
    if (!timerActive || !timerStartTime) return;
    
    // Calculate and update timer display every second
    const timerInterval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      
      setRemainingTime(remaining);
      
      // Check if timer has completed - local timer only updates UI and server state
      if (remaining <= 0 && timerState !== 'completed' && !finalVerdictTriggered) {
        setTimerState('completed');
        clearInterval(timerInterval);
        
        // Add timer expiration message
        addMessage({
          user: 'system',
          name: '시스템',
          text: '재판 시간이 종료되었습니다. 판사가 최종 판결을 내립니다.',
          roomId: roomId || ''
        });
        
        // Update Firebase to indicate timer completed - let the server trigger the verdict
        if (roomId && database) {
          const timerRef = ref(database, `rooms/${roomId}/timer`);
          // Using TimerData interface
          const timerData: TimerData = {
            active: false,
            completed: true,
            completedAt: new Date().toISOString(),
            endReason: 'time_expired',
            durationSeconds: timerDuration
          };
          set(timerRef, timerData);
          
          // Show analysis in progress message
          addMessage({
            user: 'system',
            name: '시스템',
            text: '판사가 상황을 분석 중입니다...',
            roomId: roomId || ''
          });
          
          // LOCAL TIMER NO LONGER REQUESTS FINAL VERDICT
          // Let the server-side handler do it
        }
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [timerActive, timerStartTime, timerDuration, timerState, roomId, database, addMessage, finalVerdictTriggered]);

  // Update the server-side timer completion handler to ensure it uses requestFinalVerdict properly
  useEffect(() => {
    if (!roomId || !database) return;
    
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    
    // Timer state change listener
    onValue(timerRef, (snapshot) => {
      const timerData = snapshot.val() as TimerData | null;
      
      if (!timerData) return;
      
      // Handle timer activation
      if (timerData.active && !timerActive) {
        console.log('Timer started by another participant, syncing...');
        startTimer();
        setShowTimerMode(true);
        
        // Set the start time from server
        if (timerData.startTime) {
          setTimerStartTime(new Date(timerData.startTime));
        }
        
        // Set duration if provided
        if (timerData.durationSeconds) {
          setTimerDuration(timerData.durationSeconds);
        }
        
        setTimerState('running');
      }
      
      // Handle timer completion from server - ONLY THE SERVER TRIGGERS THE FINAL VERDICT
      if (timerData.completed && timerState !== 'completed' && !finalVerdictTriggered && apiCallsEnabled) {
        console.log('Timer completed signal received from server', timerData.endReason);
        
        // Update local state to reflect timer stopped
        setTimerState('completed');
        setRemainingTime(0);
        
        // Show timer completion message based on end reason
        if (timerData.endReason === 'aggressive_language') {
          // For aggressive language, don't end the trial or provide final verdict
          // Just show a warning
          addMessage({
            user: 'system',
            name: '시스템',
            text: '공격적인 언어가 감지되어 경고합니다. 상대를 존중하는 언어를 사용해주세요.',
            roomId: roomId || ''
          });
          
          // Continue the timer as normal
          return; // Skip the verdict request
        } else {
          // Set the flag BEFORE requesting verdict to prevent race conditions
          setFinalVerdictTriggered(true);
          // Disable all future API calls
          setApiCallsEnabled(false);
          
          // Normal timer expiration message (don't add if local timer already did)
          if (!timerData.messagesSent) {
            addMessage({
              user: 'system',
              name: '시스템',
              text: '재판 시간이 종료되었습니다. 판사가 최종 판결을 내립니다.',
              roomId: roomId || ''
            });
            
            // Show analysis in progress message
            addMessage({
              user: 'system',
              name: '시스템',
              text: '판사가 상황을 분석 중입니다...',
              roomId: roomId || ''
            });
            
            // Update Firebase to indicate messages sent
            // Only proceed if database is defined
            if (database) {
              const updatedTimerRef = ref(database, `rooms/${roomId}/timer`);
              // Using spread operator with TimerData
              const updatedTimerData: TimerData = {
                ...timerData,
                messagesSent: true
              };
              set(updatedTimerRef, updatedTimerData);
            }
          }
          
          // Only the host should call the final verdict API
          if (isRoomHost) {
            console.log('Host is calling requestFinalVerdict ONE TIME ONLY');
            // SERVER-SIDE TIMER TRIGGERS THE FINAL VERDICT - ONLY FROM HOST
            requestFinalVerdict();
            
            // Clear any previous trial ready status first
            if (database) {
              const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
              remove(trialReadyRef);
            }
            
            // Reset ready status for all clients to force them to indicate readiness again
            if (database) {
              const readyRef = ref(database, `rooms/${roomId}/ready`);
              remove(readyRef);
              
              // Also clear local ready users state
              setReadyUsers({});
            }
            
            // Update Firebase to indicate final verdict is in progress
            if (database) {
              const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
              set(verdictStatusRef, {
                inProgress: true,
                startedAt: new Date().toISOString()
              });
            }
          } else {
            console.log('Non-host client, skipping final verdict API call');
            // Non-host clients will just wait for verdict status update
          }
        }
      }
    });
    
    return () => {
      // Clean up listener
      off(timerRef);
    };
  }, [roomId, database, timerActive, timerState, startTimer, requestFinalVerdict, addMessage, finalVerdictTriggered, apiCallsEnabled]);

  // Add this effect to handle automatic judge intervention based on messages
  useEffect(() => {
    // Only run this effect when we have a message change AND timer is active AND API calls are enabled
    if (!timerActive || !apiCallsEnabled) return;
    
    // Don't trigger automatic analysis if the final verdict has already been triggered
    if (finalVerdictTriggered) return;
    
    // Rest of the automatic intervention logic can remain the same
    // This gate will prevent any automatic analysis after the final verdict is triggered
  }, [messages, timerActive, apiCallsEnabled, finalVerdictTriggered]);

  // Add synchronization when joining a room
  useEffect(() => {
    if (!roomId || !database) return;
    
    // Check if there's already an active timer when joining
    const checkExistingTimer = async () => {
      try {
        // Type guard to ensure database is not undefined
        if (!database) return;
        
        const timerRef = ref(database, `rooms/${roomId}/timer`);
        const snapshot = await get(timerRef);
        const timerData = snapshot.val();
        
        if (timerData && timerData.active) {
          console.log('Room has active timer, synchronizing...');
          
          // Calculate remaining time based on server start time
          if (timerData.startTime) {
            const startTime = new Date(timerData.startTime);
            setTimerStartTime(startTime);
            
            // Set timer duration if available
            if (timerData.durationSeconds) {
              setTimerDuration(timerData.durationSeconds);
            }
            
            // Calculate elapsed time and remaining time
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const remaining = Math.max(0, timerDuration - elapsed);
            
            // If timer should still be running, activate it
            if (remaining > 0) {
              startTimer();
              setShowTimerMode(true);
              setTimerState('running');
              setRemainingTime(remaining);
            } 
            // If timer has already completed
            else if (timerData.completed) {
              setTimerState('completed');
            }
          }
        }
      } catch (error) {
        console.error('Timer sync error:', error);
      }
    };
    
    // Run the check when component mounts
    checkExistingTimer();
  }, [roomId, database, timerDuration, startTimer]);

  // 판사 메시지 템플릿 렌더링 (JudgeMessageDisplay 대체)
  const renderJudgeMessage = (text: string) => {
    // 텍스트 내에서 이모티콘과 다양한 스타일 적용
    const processedText = text
      // 강조할 단어 볼드체와 컬러 강조
      .replace(/(?:판결|결정|중요|증거|책임|잘못)/g, '<span class="font-bold text-red-600">$&</span>')
      // 감정 표현 추가
      .replace(/(?:아니|문제|거짓|틀림)/g, '<span class="font-bold text-red-600">$& 🤦‍♂️</span>')
      .replace(/(?:맞|좋|옳|훌륭)/g, '<span class="font-bold text-green-600">$& 👍</span>')
      .replace(/(?:생각해|고민해|판단해)/g, '$& 🤔')
      // 재미있는 표현 추가
      .replace(/(?:그러나|하지만)/g, '$& 😏')
      .replace(/(?:사실|진실|진짜)/g, '$& 😎')
      .replace(/(?:충격|놀라|믿을 수 없)/g, '$& 😱')
          // 욕설 레벨 관련 표현을 첫 글자만 남기고 X로 대체
    .replace(/(?:씨발|시발|ㅅㅂ|ㅆㅂ|개새끼|ㄱㅐㅅㅐㄲㅣ|병신|ㅂㅅ|미친|ㅁㅊ|존나|ㅈㄴ|지랄)/g, (match) => {
      const firstChar = match.charAt(0);
      const restChars = 'X'.repeat(match.length - 1);
      return `<span class="font-bold text-red-600">${firstChar}${restChars}</span>`;
    })
      .replace(/(?:공격적 언어|공격적 표현|상스러운 표현)/g, '<span class="font-bold text-red-600">$& ⚠️</span>');

    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-md">
                <Gavel className="w-5 h-5 text-white animate-bounce" />
              </div>
              <h3 className="font-bold text-white">판사님의 폭격 💥</h3>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded-md text-xs">
              <span className="animate-pulse">생각 중... 🧠</span>
            </div>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-b from-amber-50 to-white">
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: processedText }}></div>
          <div className="mt-4 text-right">
            <span className="text-xs text-gray-500 italic">판사님이 현명하신 판단을 내리셨습니다! 🧙‍♂️</span>
          </div>
        </div>
      </div>
    );
  };

  // Add this helper function within the component to fix the error
  const calculatedChattersCount = () => {
    return roomUsers
      .filter(user => !user.username.includes('System') && user.username !== 'System')
      .length;
  };

  // Fix for allUsersReady function
  const allUsersReady = (): boolean => {
    // 채팅방에 참여한 사용자 수 (시스템 계정 제외)
    const userCount = roomUsers
      .filter(user => !user.username.includes('System') && user.username !== 'System')
      .length;
    
    // 준비된 사용자 수
    const readyCount = Object.values(readyUsers).filter(isReady => isReady).length;
    
    // 모든 사용자가 준비되었는지 확인
    return userCount > 0 && readyCount === userCount;
  };

  // Fix for updateUserReadyStatus function
  const updateUserReadyStatus = (userId: string, ready: boolean) => {
    if (!roomId || !database) return;
    
    const readyRef = ref(database, `rooms/${roomId}/ready/${userId}`);
    set(readyRef, ready);
    
    // 로컬 상태 업데이트
    setReadyUsers(prev => ({
      ...prev,
      [userId]: ready
    }));
  };

  // Fix for handleShareRoom function
  const handleShareRoom = () => {
    if (!roomId) return;
    
    // 현재 URL 기반으로 공유 링크 생성
    const shareUrl = `${window.location.origin}/chat/${roomId}`;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        // 성공 메시지 추가
        addMessage({
          user: 'system',
          name: '시스템',
          text: '채팅방 링크가 클립보드에 복사되었습니다! 친구들에게 공유해보세요. 👍',
          roomId: roomId
        });
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        // 실패 시 링크 직접 표시
        addMessage({
          user: 'system',
          name: '시스템',
          text: `채팅방 링크를 수동으로 복사해주세요: ${shareUrl}`,
          roomId: roomId
        });
      });
  };

  // 메시지 목록 렌더링
  const renderMessages = () => {
    // 메시지가 없을 경우
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80 space-y-3">
          <Gavel className="w-12 h-12 text-pink-300" />
          <p className="text-gray-400 text-center">
            아직 대화 내용이 없습니다.<br/>재판이 시작되면 여기에 대화 내용이 표시됩니다.
          </p>
        </div>
      );
    }
    
    // Find the index of the final verdict message
    let lastVerdictIndex = -1;
    let hasFinalVerdict = false;
    
    // First check if we have a final verdict message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].user === 'judge' && messages[i].text.includes('최종 판결')) {
        lastVerdictIndex = i;
        hasFinalVerdict = true;
        break;
      }
    }
    
    // Apply filtering only if we have a final verdict
    const filteredMessages = messages.filter((message, index) => {
      // If we found a verdict message:
      if (hasFinalVerdict) {
        // 1. Filter out any analysis messages that come after the verdict
        if (index > lastVerdictIndex && 
            message.user === 'system' && message.text.includes('판사가 상황을 분석 중입니다')) {
          return false;
        }
        
        // 2. Filter out any other judge messages that are not the final verdict
        // EXCEPT keep judge messages about cursing/aggressive language
        if (message.user === 'judge' && 
            !message.text.includes('최종 판결') && 
            !message.text.includes('공격적인 언어') && 
            !message.text.includes('욕설') && 
            !message.text.includes('부적절한 표현') && 
            index !== lastVerdictIndex) {
          return false;
        }
      }
      return true;
    });
    
    return filteredMessages.map((message, index) => {
      const isMine = message.sender?.username === username;
      const userId = message.sender?.id || '';
      const curseLevel = userId ? getUserCurseLevel(userId) : 0;
      
      return (
        <div 
          key={message.id || index} 
          className={`flex ${
            message.user === 'judge'
              ? 'flex-col items-center'
              : isMine 
                ? 'justify-end' 
                : 'justify-start'
          }`}
        >
          {/* 판사 메시지 구분선 시작 */}
          {message.user === 'judge' && (
            <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto my-4" />
          )}
          
          {/* 프로필 이미지 표시 조건 수정 */}
          {(message.user === 'judge' || (!isMine && message.user !== 'system')) && (
            <div className={message.user === 'judge' ? 'mb-2' : ''}>
              <ProfileInitial name={message.name} isMine={false} />
            </div>
          )}
          
          {/* 메시지 컨텐츠 컨테이너 */}
          <div className={`mx-2 ${
            message.user === 'judge'
              ? 'max-w-[90%] w-full transform transition-all duration-300 hover:scale-[1.01]'
              : 'max-w-[80%]'
          } ${isMine ? 'order-1' : 'order-2'}`}>
            {/* 메시지 정보 (이름, 시간) 중앙 정렬 */}
            {message.user !== 'system' && (
              <div className={`flex items-center mb-1 ${message.user === 'judge' ? 'justify-center' : ''}`}>
                <span className={`text-sm font-medium ${
                  message.user === 'judge' 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800' 
                    : isMine 
                      ? 'text-pink-700' 
                      : 'text-purple-700'
                }`}>
                  {message.user === 'judge' ? (
                    <span className="flex items-center justify-center">
                      <Gavel className="w-4 h-4 mr-1.5 text-amber-600" />
                      {message.name}
                    </span>
                  ) : (
                    message.name
                  )}
                </span>
                {message.timestamp && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTime(message.timestamp)}
                  </span>
                )}
                {/* @ts-ignore - 타입 체크 무시 */}
                {curseLevel > 0 && message.user !== 'judge' && message.user !== 'system' && (
                  <CurseLevelBadge level={curseLevel} />
                )}
              </div>
            )}
            
            {/* 메시지 말풍선 스타일 강화 */}
            <div
              className={`rounded-lg px-4 py-2.5 shadow-sm ${
                message.user === 'system' 
                  ? 'bg-gray-100 text-gray-800 text-sm mx-auto max-w-md border border-gray-200' 
                  : message.user === 'judge'
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-gray-800'
                    : isMine
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200 text-gray-800'
                      : 'bg-white border border-gray-200 text-gray-800'
              }`}
              style={message.user === 'judge' ? {
                boxShadow: '0 4px 6px rgba(251, 191, 36, 0.05), 0 1px 3px rgba(251, 191, 36, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
              } : {}}
            >
              {message.user === 'system' ? (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-600" />
                  <span>{message.text}</span>
                </div>
              ) : message.user === 'judge' ? (
                <div>
                  {renderJudgeMessage(message.text)}
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              )}
              
              {/* 메시지 타입 표시 중앙 정렬 */}
              {message.messageType && message.messageType !== 'normal' && (
                <div className={`mt-1 flex items-center ${message.user === 'judge' ? 'justify-center' : 'justify-end'}`}>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    message.messageType === 'evidence' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : message.messageType === 'objection'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : message.messageType === 'closing'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {message.messageType === 'evidence' && <Scale className="w-3 h-3 mr-1 inline" />}
                    {message.messageType === 'objection' && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                    {message.messageType === 'closing' && <Gavel className="w-3 h-3 mr-1 inline" />}
                    {message.messageType === 'question' && <HelpCircle className="w-3 h-3 mr-1 inline" />}
                    {message.messageType === 'evidence' && '증거'}
                    {message.messageType === 'objection' && '반론'}
                    {message.messageType === 'closing' && '최종변론'}
                    {message.messageType === 'question' && '질문'}
                  </span>
                </div>
              )}
            </div>
            
            {/* 관련 쟁점 표시 */}
            {message.relatedIssue && (
              <div className="mt-1 ml-1">
                <span className="text-xs flex items-center text-pink-600">
                  <Scale className="w-3 h-3 mr-1" /> 
                  관련 쟁점: {message.relatedIssue}
                </span>
              </div>
            )}
          </div>
          
          {/* 내 프로필 이미지 */}
          {isMine && message.user !== 'system' && message.user !== 'judge' && (
            <div className="order-2">
              <ProfileInitial name={message.name || '익명'} isMine={true} />
            </div>
          )}
          
          {/* 판사 메시지 구분선 끝 */}
          {message.user === 'judge' && (
            <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto my-4" />
          )}
        </div>
      );
    });
  };

  // Add function to initialize user curse level tracking
  const initializeUserCurseLevels = () => {
    // Check if there are any existing curse levels already tracked
    Object.keys(userCurseLevels).forEach(userId => {
      const level = getUserCurseLevel(userId);
      if (level > 0) {
        console.log(`사용자(${userId}) 욕설 레벨: ${level}/10`);
      }
    });
  };
  
  // Debug function to log ready status
  const logReadyStatus = () => {
    console.log('=================== READY STATUS DEBUG ===================');
    console.log('Current user ID:', localStorage.getItem('userId'));
    console.log('Is room host:', isRoomHost);
    console.log('Ready users:', readyUsers);
    console.log('All users ready?', allUsersReady());
    console.log('Final verdict triggered?', finalVerdictTriggered);
    console.log('Show trial ready button?', showTrialReadyButton);
    console.log('=================== END DEBUG ===================');
  };

  // Add effect to track new issues
  useEffect(() => {
    const currentIssuesCount = detectedIssues.length;
    if (currentIssuesCount > previousIssuesCount) {
      setHasNewIssues(true);
    }
    setPreviousIssuesCount(currentIssuesCount);
  }, [detectedIssues, previousIssuesCount]);
  
  // Update toggle function to clear new issues flag when opening
  const toggleIssueNotification = () => {
    setIsIssueNotificationOpen(!isIssueNotificationOpen);
    if (!isIssueNotificationOpen) {
      setHasNewIssues(false);
    }
  };

  // Add listener for ready status changes in Firebase
  useEffect(() => {
    if (!roomId || !database) return;
    
    const readyRef = ref(database, `rooms/${roomId}/ready`);
    
    // Listen for ready status changes
    onValue(readyRef, (snapshot) => {
      const readyData = snapshot.val();
      if (readyData) {
        setReadyUsers(readyData);
      }
    });
    
    return () => {
      // Clean up listener
      off(readyRef);
    };
  }, [roomId, database]);

  // Add listener for detected issues
  useEffect(() => {
    if (!roomId || !database) return;
    
    const issuesRef = ref(database, `rooms/${roomId}/detectedIssues`);
    
    // When issues are detected by any user, sync the data
    onValue(issuesRef, (snapshot) => {
      const issuesData = snapshot.val();
      if (issuesData && Array.isArray(issuesData)) {
        // Update local store with the synced issues
        useChatStore.getState().updateDetectedIssues(issuesData);
      }
    });
    
    return () => {
      off(issuesRef);
    };
  }, [roomId, database]);

  // Add effect to sync detected issues to Firebase
  useEffect(() => {
    if (!roomId || !database || detectedIssues.length === 0) return;
    
    // Update Firebase with current issues
    const issuesRef = ref(database, `rooms/${roomId}/detectedIssues`);
    set(issuesRef, detectedIssues);
  }, [detectedIssues, roomId, database]);

  // Add effect to listen for host presence
  useEffect(() => {
    if (!roomId || !database) return;
    
    const hostRef = ref(database, `rooms/${roomId}/host`);
    const hostPresenceRef = ref(database, `rooms/${roomId}/hostPresence`);
    
    // Check if host is present and update presence
    get(hostRef).then((snapshot) => {
      if (snapshot.exists()) {
        const hostId = snapshot.val();
        const userId = localStorage.getItem('userId') || '';
        
        // If current user is host, update presence
        if (hostId === userId) {
          // Set host presence with onDisconnect to detect if host leaves
          set(hostPresenceRef, true);
          const onDisconnectRef = onDisconnect(hostPresenceRef);
          onDisconnectRef.set(false);
        }
      }
    });
    
    // Listen for host presence changes
    const hostPresenceListener = onValue(hostPresenceRef, (snapshot) => {
      const isHostPresent = snapshot.val();
      
      // If host is not present and current user is not host, show modal
      if (isHostPresent === false && !isRoomHost) {
        setShowHostLeftModal(true);
      }
    });
    
    return () => {
      // Remove host presence listeners
      hostPresenceListener();
    };
  }, [roomId, database, isRoomHost]);

  // Add effect to listen for verdict status
  useEffect(() => {
    if (!roomId || !database) return;
    
    const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
    
    // Listen for verdict status changes
    const verdictStatusListener = onValue(verdictStatusRef, (snapshot) => {
      const verdictStatus = snapshot.val();
      
      if (verdictStatus && verdictStatus.inProgress) {
        // Set final verdict triggered for all clients
        setFinalVerdictTriggered(true);
        
        // For non-host clients, clear ready status and show ready button
        if (!isRoomHost) {
          // Make sure client is marked as NOT ready
          const userId = localStorage.getItem('userId') || '';
          if (userId) {
            // Clear this user's ready status in local state
            setReadyUsers(prev => {
              const newState = {...prev};
              delete newState[userId];
              return newState;
            });
          }
          
          setShowTrialReadyButton(true);
          
          // Add system message about verdict in progress
          addMessage({
            user: 'system',
            name: '시스템',
            text: '판사가 최종 판결을 준비 중입니다. 재판이 끝난 후 새 재판을 위해 준비 버튼을 눌러주세요.',
            roomId: roomId || ''
          });
        }
      }
    });
    
    return () => {
      // Remove verdict status listener
      verdictStatusListener();
    };
  }, [roomId, database, isRoomHost, addMessage]);
  
  // Add effect to listen for post-verdict ready status
  useEffect(() => {
    if (!roomId || !database) return;
    
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
    
    console.log('Setting up trialReady listener, isRoomHost:', isRoomHost);
    
    // Listen for trial ready status changes
    const trialReadyListener = onValue(trialReadyRef, (snapshot) => {
      const readyData = snapshot.val() || {};
      
      console.log('DEBUG: Trial ready data updated from Firebase:', readyData);
      
      // Update ready users state even if data is null/undefined (set to empty object)
      setPostVerdictReadyUsers(readyData);
      
      // If host and there's a final verdict, show the start button
      if (isRoomHost && finalVerdictTriggered) {
        setShowPostVerdictStartButton(true);
        console.log('DEBUG: showPostVerdictStartButton set to true for host');
      }
      
      // Force check for button condition immediately after state update
      setTimeout(() => {
        console.log('DEBUG: Delayed check of ready status:');
        console.log('postVerdictReadyUsers state after update:', postVerdictReadyUsers);
        console.log('allPostVerdictUsersReady():', allPostVerdictUsersReady());
      }, 100);
    });
    
    return () => {
      // Remove trial ready listener
      off(trialReadyRef);
    };
  }, [roomId, database, isRoomHost, finalVerdictTriggered]);

  // Handle redirect to home page
  const handleRedirectToHome = () => {
    window.location.href = '/';
  };

  // Add handler for trial ready status after verdict
  const handleTrialReady = () => {
    if (!roomId || !database) return;
    
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;
    
    console.log('SIMPLE: handleTrialReady called for user:', userId);
    
    // Update trial ready status in Firebase - THIS IS THE KEY PART
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady/${userId}`);
    
    // Set to true in Firebase
    set(trialReadyRef, true)
      .then(() => {
        console.log('SIMPLE: Trial ready status updated in Firebase successfully');
      })
      .catch(error => {
        console.error('SIMPLE: Error updating trial ready status:', error);
      });
    
    // Update UI immediately
    setTrialReady(true);
    setShowTrialReadyButton(false);
    
    // Add message
    addMessage({
      user: 'system',
      name: '시스템',
      text: '재판 준비가 완료되었습니다.',
      roomId: roomId || ''
    });
  };
  
  // Helper function to check if all users are ready for a new trial after verdict
  const allPostVerdictUsersReady = (): boolean => {
    // Explicitly extract non-system users using destructuring for clarity
    const nonSystemUsers = roomUsers.filter(user => 
      !user.username.includes('System') && 
      user.username !== 'System' &&
      user.id !== localStorage.getItem('userId')
    );
    
    console.log('----- DEBUG FINAL FIX: allPostVerdictUsersReady check -----');
    
    // Check only for non-system, non-host users who are actually in the room
    const activeUsersForCheck = nonSystemUsers;
    
    // Get current user ID for clarity
    const currentUserId = localStorage.getItem('userId') || '';
    
    // Detailed logging of EXACTLY what we're checking
    console.log('FINAL DEBUG: Current user ID (host):', currentUserId);
    console.log('FINAL DEBUG: Active users to check:', activeUsersForCheck);
    console.log('FINAL DEBUG: postVerdictReadyUsers state:', postVerdictReadyUsers);
    
    // If there are no other users besides the host, return true
    if (activeUsersForCheck.length === 0) {
      console.log('FINAL DEBUG: No users to check, returning TRUE');
      return true;
    }
    
    // SPECIFIC LOG for each user's ready status 
    const readyStatuses: Record<string, boolean> = {};
    for (const user of activeUsersForCheck) {
      readyStatuses[user.id] = !!postVerdictReadyUsers[user.id];
    }
    console.log('FINAL DEBUG: Ready status for each user:', readyStatuses);
    
    // FIX: Use Array.every() for cleaner code and to avoid loop issues
    const allUsersReady = activeUsersForCheck.every(user => 
      postVerdictReadyUsers[user.id] === true
    );
    
    console.log('FINAL DEBUG: All users ready?', allUsersReady);
    return allUsersReady;
  };

  // Handle starting a new trial after verdict
  const handleStartNewTrial = () => {
    if (!roomId || !database) return;
    
    // Safety check - if not all users are ready, don't allow starting a new trial
    if (!checkAllUsersReady()) {
      console.log('Prevented start of new trial - not all users ready');
      
      // Get list of users who aren't ready
      const allRealUsers = roomUsers.filter(user => 
        !user.username.includes('System') && 
        user.username !== 'System'
      );
      const notReadyUsers = allRealUsers.filter(user => !postVerdictReadyUsers[user.id]);
      
      // Show warning message with specific user names
      addMessage({
        user: 'system',
        name: '시스템',
        text: `아직 준비되지 않은 참석자가 있습니다: ${notReadyUsers.map(u => u.username).join(', ')}`,
        roomId: roomId || ''
      });
      return;
    }
    
    // Reset state for new trial
    setFinalVerdictTriggered(false);
    setApiCallsEnabled(true);
    setShowPostVerdictStartButton(false);
    
    // Clear the verdict status in Firebase
    const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
    remove(verdictStatusRef);
    
    // Clear ready status in Firebase
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
    remove(trialReadyRef);
    
    // Reset Timer
    resetTimer();
    
    // Clear messages and start new trial
    clearChat();
    addMessage({
      user: 'system',
      name: '시스템',
      text: '호스트가 새 재판을 시작했습니다. 모두 준비해주세요.',
      roomId: roomId || ''
    });
    
    // Show court ready modal to start a new trial
    setShowCourtReadyModal(true);
  };

  // Just check if every non-system user is ready WITHOUT excluding host
  const checkAllUsersReady = () => {
    // Get all users excluding system
    const allRealUsers = roomUsers.filter(user => 
      !user.username.includes('System') && 
      user.username !== 'System'
    );
    
    console.log('SIMPLE CHECK: All real users:', allRealUsers.map(u => u.username));
    console.log('SIMPLE CHECK: postVerdictReadyUsers:', postVerdictReadyUsers);
    
    // Check if number of ready users matches number of real users
    const readyCount = Object.keys(postVerdictReadyUsers).length;
    const expectedCount = allRealUsers.length;
    
    console.log(`SIMPLE CHECK: Ready users: ${readyCount}, Expected users: ${expectedCount}`);
    
    if (readyCount >= expectedCount) {
      return true;
    }
    
    // Check each user directly
    for (const user of allRealUsers) {
      console.log(`SIMPLE CHECK: User ${user.username} (${user.id}) ready status: ${postVerdictReadyUsers[user.id]}`);
      if (!postVerdictReadyUsers[user.id]) {
        return false;
      }
    }
    
    return true;
  };

  // 채팅방 UI 렌더링
  return (
    <div className="flex flex-col h-full max-h-[100dvh] bg-gradient-to-b from-white to-pink-50 rounded-lg shadow-lg overflow-hidden border border-pink-100 w-[380px] mx-auto">
      {/* 헤더 영역 */}
      <div className="p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center">
              <Gavel className="h-5 w-5 mr-2 text-pink-600" />
              재판실
            </h2>
            <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full shadow-sm">
              {calculatedChattersCount()}명 참석 중
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {onShare && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onShare}
                className="p-2 text-pink-500 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-colors"
                title="법정 참석자 소환"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            )}
            {!onShare && (
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
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 타이머 표시 - 상단 고정 */}
        {timerActive && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100 to-purple-100 p-2 flex items-center justify-center shadow-sm border-b border-pink-200 flex-shrink-0">
            <Clock className="text-pink-600 h-4 w-4 mr-2 animate-pulse" />
            <span className="text-pink-800 text-sm font-medium">
              재판 진행 중 - 판결까지 {formatRemainingTime(remainingTime)} 남음
            </span>
          </div>
        )}
        
        {/* 감지된 쟁점 알림 - 타이머 바로 아래 */}
        {timerActive && detectedIssues.length > 0 && (
          <div className={`flex-shrink-0 mt-3 opacity-60 hover:opacity-100 transition-opacity duration-300 bg-white shadow-lg rounded-lg ${isIssueNotificationOpen ? 'p-4' : 'p-4 pb-2'} border border-pink-200 mx-2 ${hasNewIssues && !isIssueNotificationOpen ? 'border-pink-500 animate-pulse' : ''}`}>
            <div 
              className="flex items-center justify-between cursor-pointer mb-2" 
              onClick={toggleIssueNotification}
            >
              <h3 className={`font-bold ${hasNewIssues && !isIssueNotificationOpen ? 'text-pink-600' : 'text-gray-800'} flex items-center`}>
                <Scale className="h-4 w-4 mr-1.5 text-pink-600" />
                {hasNewIssues && !isIssueNotificationOpen 
                  ? "새로운 쟁점이 제기되었습니다" 
                  : `현재 쟁점 목록: ${detectedIssues.length}개`}
              </h3>
              {isIssueNotificationOpen 
                ? <ChevronUp className="w-4 h-4 text-pink-600" /> 
                : <ChevronDown className="w-4 h-4 text-pink-600" />}
            </div>
            
            {isIssueNotificationOpen && (
              <ul className="space-y-2 max-h-[180px] overflow-y-auto">
                {detectedIssues.map((issue, index) => (
                  <li key={index} className="text-sm bg-pink-50 p-2 rounded-md border border-pink-100 shadow-sm">
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* 채팅 내용 영역 */}
        <div 
          ref={chatContainerRef}
          className="overflow-y-auto bg-gradient-to-b from-white to-pink-50 flex-1"
          style={{ maxHeight: 'calc(100dvh - 200px)' }}
        >
          {/* 메시지 목록 */}
          <div className="p-3 space-y-3">
            {renderMessages()}
            
            {/* 타이핑 중인 사용자 표시 */}
            {Object.values(typingUsers)
              .filter(user => user.isTyping && user.username !== username).length > 0 && (
              <div className="flex items-center space-x-2 ml-12 mt-1">
                <div className="bg-pink-100 rounded-lg px-3 py-1.5 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
                <span className="text-xs text-pink-500">
                  {Object.values(typingUsers)
                    .filter(user => user.isTyping && user.username !== username)
                    .map(user => user.username).join(', ')} 변론 작성 중...
                </span>
              </div>
            )}
            
            {/* 메시지 리스트 끝부분 스크롤 참조 */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className={`px-3 py-1 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0 overflow-hidden ${timerActive ? 'h-[80px]' : 'auto'}`}>
        {!timerActive && !finalVerdictTriggered ? (
          <div className="flex flex-col items-start h-auto">
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center compact-text">
              <Gavel className="h-5 w-5 mr-2 text-pink-600" />
              재판 진행 준비
            </h3>
            <p className="text-sm text-gray-600 text-center compact-text">
              모든 참석자의 준비가 완료되면 재판을 시작할 수 있습니다.
            </p>
            {!Object.keys(readyUsers).includes(localStorage.getItem('userId') || '') ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUserReady}
                className="px-4 py-1 mt-1 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-pink-700 hover:to-purple-800 compact-btn"
              >
                재판 준비 완료
              </motion.button>
            ) : (
              <div className="text-sm text-pink-600 font-medium compact-text flex items-center mt-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-pink-600" />
                준비 완료! 다른 참석자를 기다리는 중...
              </div>
            )}
            {isRoomHost ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={initiateCourtProcess}
                disabled={!allUsersReady()}
                className={`px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn ${
                  allUsersReady()
                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:shadow-xl hover:from-pink-700 hover:to-purple-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Gavel className="w-4 h-4 mr-2" />
                  재판 개시 선언
                </div>
              </motion.button>
            ) : (
              <div className="text-sm text-amber-600 compact-text flex items-center mt-1">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                방장만 재판을 시작할 수 있습니다.
              </div>
            )}
            {!allUsersReady() && isRoomHost && (
              <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
                <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" />
                모든 참석자가 준비되어야 재판을 시작할 수 있습니다.
              </p>
            )}
          </div>
        ) : finalVerdictTriggered && !timerActive && !isRoomHost ? (
          // Show special post-verdict disabled UI when timer is not active but verdict has been triggered - ONLY FOR NON-HOSTS
          <div className="flex flex-col items-start h-auto">
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center compact-text">
              <Gavel className="h-5 w-5 mr-2 text-amber-600" />
              판결 완료
            </h3>
            <p className="text-sm text-gray-600 text-center compact-text">
              이 채팅방의 최종 판결이 완료되었습니다.
            </p>
            
            <div className="px-4 py-1 mt-1 font-medium rounded-lg shadow-sm compact-btn bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 flex items-center">
              <Gavel className="w-4 h-4 mr-2" />
              재판 개시 불가
            </div>
            
            <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              <strong>호스트만 재판을 시작할 수 있습니다.</strong>
            </p>
          </div>
        ) : finalVerdictTriggered && !timerActive && isRoomHost ? (
          // Host version with ability to start new trial if all users are ready
          <div className="flex flex-col items-start h-auto">
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center compact-text">
              <Gavel className="h-5 w-5 mr-2 text-amber-600" />
              최종 판결 완료
            </h3>
            <p className="text-sm text-gray-600 text-center compact-text">
              {Object.values(postVerdictReadyUsers).filter(isReady => isReady).length}/{roomUsers.filter(user => !user.username.includes('System')).length} 참석자가 새 재판 준비를 완료했습니다.
            </p>
            
            {/* Add ready button for host */}
            {!postVerdictReadyUsers[localStorage.getItem('userId') || ''] ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTrialReady}
                className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
              >
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  재판 준비 완료 (호스트)
                </div>
              </motion.button>
            ) : (
              <div className="text-sm text-amber-600 font-medium compact-text flex items-center mt-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-600" />
                호스트 준비 완료! 다른 참석자를 기다리는 중...
              </div>
            )}
            
            {/* Show clickable button when all users are ready */}
            {checkAllUsersReady() ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartNewTrial}
                className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
              >
                <div className="flex items-center">
                  <Gavel className="w-4 h-4 mr-2" />
                  새 재판 개시 선언
                </div>
              </motion.button>
            ) : (
              <div className="px-4 py-1 mt-1 font-medium rounded-lg shadow-sm compact-btn bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 flex items-center">
                <Gavel className="w-4 h-4 mr-2" />
                새 재판 개시 선언 (준비 중...)
              </div>
            )}
            
            {(() => {
  // Get unready users
  const allRealUsers = roomUsers.filter(user => 
    !user.username.includes('System') && 
    user.username !== 'System'
  );
  
  const notReadyUsers = allRealUsers.filter(user => !postVerdictReadyUsers[user.id]);
  
  if (notReadyUsers.length > 0) {
    return (
      <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
        <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" />
        <strong>
          아직 준비되지 않은 참석자: {notReadyUsers.map(u => u.username).join(', ')}
        </strong>
      </p>
    );
  }
  
  return null;
})()}
          </div>
        ) : finalVerdictTriggered && isRoomHost && showPostVerdictStartButton ? (
          // Show host controls after final verdict - button enabled when all users are ready
          <div className="flex flex-col items-start h-auto">
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center compact-text">
              <Gavel className="h-5 w-5 mr-2 text-amber-600" />
              최종 판결 완료
            </h3>
            <p className="text-sm text-gray-600 text-center compact-text">
              {Object.values(postVerdictReadyUsers).filter(isReady => isReady).length}/{roomUsers.filter(user => !user.username.includes('System')).length} 참석자가 새 재판 준비를 완료했습니다.
            </p>
            
            {/* Add ready button for host */}
            {postVerdictReadyUsers[localStorage.getItem('userId') || ''] !== true ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTrialReady}
                className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
              >
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  호스트 준비 완료하기
                </div>
              </motion.button>
            ) : (
              <div className="text-sm text-amber-600 font-medium compact-text flex items-center mt-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-600" />
                호스트 준비 완료! 다른 참석자를 기다리는 중...
              </div>
            )}
            
            {/* Show clickable button when all users are ready */}
            {checkAllUsersReady() ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartNewTrial}
                className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
              >
                <div className="flex items-center">
                  <Gavel className="w-4 h-4 mr-2" />
                  새 재판 개시 선언
                </div>
              </motion.button>
            ) : (
              <div className="px-4 py-1 mt-1 font-medium rounded-lg shadow-sm compact-btn bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 flex items-center">
                <Gavel className="w-4 h-4 mr-2" />
                새 재판 개시 선언 (준비 중...)
              </div>
            )}
            
            {(() => {
  // Get unready users
  const allRealUsers = roomUsers.filter(user => 
    !user.username.includes('System') && 
    user.username !== 'System'
  );
  
  const notReadyUsers = allRealUsers.filter(user => !postVerdictReadyUsers[user.id]);
  
  if (notReadyUsers.length > 0) {
    return (
      <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
        <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" />
        <strong>
          아직 준비되지 않은 참석자: {notReadyUsers.map(u => u.username).join(', ')}
        </strong>
      </p>
    );
  }
  
  return null;
})()}
          </div>
        ) : showTrialReadyButton ? (
          // Show trial ready button for non-host clients when final verdict is triggered
          <div className="flex items-center justify-center h-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTrialReady}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
            >
              <div className="flex items-center">
                <Gavel className="w-5 h-5 mr-2" />
                재판 준비 완료
              </div>
            </motion.button>
          </div>
        ) : finalVerdictTriggered && !isRoomHost ? (
          // Show disabled input for non-host clients when final verdict is triggered
          <div className="flex items-center space-x-2 h-full">
            <div className="flex-1 h-[60px] min-h-[60px] max-h-[60px] px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <span className="text-gray-500">판사가 최종 판결을 준비 중입니다...</span>
            </div>
            <button
              disabled
              className="px-4 h-[60px] rounded-lg font-medium transition-all shadow-sm bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              <div className="flex items-center">
                <Gavel className="w-4 h-4 mr-2" />
                제출
              </div>
            </button>
          </div>
        ) : (
          // Normal chat input for host and non-ready clients
          <div className="flex items-center space-x-2 h-full">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="변론 내용을 작성하세요..."
              className="flex-1 h-[60px] min-h-[60px] max-h-[60px] px-3 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 border border-pink-200 transition-all resize-none placeholder:text-gray-400"
              disabled={finalVerdictTriggered && !isRoomHost}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (input.trim()) {
                  sendMessage(input);
                  setInput('');
                }
              }}
              disabled={isLoading || !input.trim() || (finalVerdictTriggered && !isRoomHost)}
              className={`px-4 h-[60px] rounded-lg font-medium transition-all shadow-lg ${
                isLoading || !input.trim() || (finalVerdictTriggered && !isRoomHost)
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
        )}
      </div>

      {/* 재판 준비 모달 */}
      {showCourtReadyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
            className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-[350px] w-full p-6 border border-pink-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center mb-4">
                <Gavel className="h-5 w-5 mr-2 text-pink-600" />
                실시간 AI 판사 재판
              </h2>
              <p className="mb-4 text-gray-800 text-sm">
                이 모드에서는 참석자들이 변론을 진행하는 동안 AI 판사가 공정하게 심리합니다.
                5분 타이머가 시작되며, 시간이 종료되면 AI 판사가 최종 판결을 내립니다.
              </p>
              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCourtReadyModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium compact-btn"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartTrial}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg compact-btn"
                >
                  <div className="flex items-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    재판 시작
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 시작 확인 모달 */}
      {showConfirmStartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
            className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-[350px] w-full p-6 border border-pink-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-pink-600" />
                재판 개시 확인
              </h2>
              <p className="mb-4 text-gray-800 text-sm bg-pink-50 p-3 rounded-lg border border-pink-100">
                재판 과정에서 감정이 격해질 수 있습니다. 상호 존중하는 자세로 진행해주시기 바랍니다.
              </p>
              <div className="flex flex-col space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    clearChat();
                    setShowConfirmStartModal(false);
                    setShowCourtReadyModal(false);
                    startTimerMode();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg compact-btn"
                >
                  <div className="flex items-center justify-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    재판 개시를 선언합니다
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmStartModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium compact-btn"
                >
                  취소
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Host left modal */}
      {showHostLeftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
            className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-[350px] w-full p-6 border border-red-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                판사가 퇴정했습니다
              </h2>
              <p className="mb-5 text-gray-800 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                방장이 법정을 나갔습니다. 더 이상 재판이 진행될 수 없습니다.
              </p>
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRedirectToHome}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg"
                >
                  <div className="flex items-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    메인으로 돌아가기
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}