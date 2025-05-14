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
  Clock
} from 'lucide-react';
import { 
  getFinalVerdict,
  analyzeConversation,
  VerdictData,
  PersonalizedResponse,
} from '@/lib/gemini';
import { ref, onValue, set, remove, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useParams } from 'next/navigation';

// 새 컴포넌트 임포트
import ChatTimer from '../ChatTimer';
import IssuesSidebar from '../IssuesSidebar';
import MessageComposer from './MessageComposer';
import JudgeIntervention from '../JudgeIntervention';
import CourtReadyModal from './CourtReadyModal';

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

export default function ChatRoom({ 
  roomId, 
  userType, 
  customUsername, 
  onShare, 
  initialStage = 'waiting',
  activeChattersCount = 0
}: ChatRoomProps) {
  const { roomId: nextRoomId } = useParams<{ roomId: string }>();
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
    clearChat
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
      }
      return;
    }
    
    // 이름이 설정되지 않은 경우 채팅방 참여는 하지 않음
    // 사용자가 이름 모달에서 이름을 설정하면 그때 joinRoom이 호출됨
  }, [roomId, joinRoom, leaveRoom]);

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

  // 메시지 추가에 따른 AI 판사 자동 개입 관리 (이 부분은 새롭게 추가)
  useEffect(() => {
    // 첫 번째 렌더링은 무시 (초기 마운트 시)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // 타이머가 활성화되어 있고 분석 중이 아닐 때만 자동 개입 검사
    if (timerActive && !isAnalyzing && messages.length > 0) {
      // 일정 간격으로 자동 판사 분석 요청
      const lastMessage = messages[messages.length - 1];
      
      // 마지막 메시지가 사용자 메시지이고 시스템이나 판사가 아닌 경우에만 분석
      if (lastMessage.user === 'user-general') {
        console.log('타이머 활성화 상태에서 새 메시지 감지: 자동 판사 분석 검토');
        // 일정 시간 후 자동 분석 요청 (중복 요청 방지를 위해 지연 추가)
        const timeoutId = setTimeout(() => {
          if (!isAnalyzing) {
            requestJudgeAnalysis();
          }
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages, timerActive, isAnalyzing, requestJudgeAnalysis]);

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
    // 타이머 시작
    startTimer();
    
    // 타이머 모드 UI 표시 (단계별 UI 숨김)
    setShowTimerMode(true);
    
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
      text: '안녕하세요, 여러분의 대화를 지켜보다가 필요할 때 개입하는 AI 판사입니다. 자유롭게 대화를 나누세요. 5분 후 최종 판결을 내리겠습니다.',
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
    if (isAnalyzing) return;
    requestJudgeAnalysis();
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
    if (isAnalyzing) {
      console.log('이미 판사 요청 중입니다.');
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
      
      // 실시간 AI 판사 분석 요청
      await requestJudgeAnalysis();
      
      setJudgeAttempts(0);
    } catch (error) {
      console.error('판사 호출 오류:', error);
      setJudgeError('판사 요청 중 오류가 발생했습니다.');
      
      // 에러 메시지 추가
      addMessage({
        user: 'system',
        name: '시스템',
        text: '판사 요청 중 오류가 발생했습니다. 다시 시도해주세요.',
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
      .replace(/(?:충격|놀라|믿을 수 없)/g, '$& 😱');

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

  // 사용자 아이콘 표시
  const getUserIcon = (userType: string) => {
    switch (userType) {
      case 'user-general':
        return <UserCircle className="text-blue-500" />;
      case 'judge':
        return <Gavel className="text-yellow-600" />;
      case 'system':
        return <CheckCircle2 className="text-green-500" />;
      default:
        return <MessageSquare />;
    }
  };

  // 현재 채팅 참여자 수 계산 - 시스템 계정 제외
  const calculatedChattersCount = roomUsers
    .filter(user => !user.username.includes('System') && user.username !== 'System')
    .length;
  
  // 타이핑 중인 사용자 목록
  const typingUsersList = Object.values(typingUsers)
    .filter(user => user.isTyping)
    .map(user => user.username);

  // 판사 요청 처리
  const requestJudge = () => {
    if (!roomId || !database) return;
    
    // 이미 요청 중이면 중복 방지
    if (judgeRequested) {
      console.log('이미 판사 요청 중입니다.');
      return;
    }
    
    console.log('판사 요청 시작 - 승인 필요');
    
    // 로컬 상태 업데이트
    setJudgeRequested(true);
    setShowJudgeModal(true);
    
    // Firebase에 판사 요청 상태 저장
    const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
    set(judgeRequestRef, {
      requester: username,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    // 자신은 자동 승인 처리
    const userId = localStorage.getItem('userId') || '';
    if (userId) {
      const approvalRef = ref(database, `rooms/${roomId}/judgeApprovals/${userId}`);
      set(approvalRef, { username, approved: true });
      setLocalApproval(true);
    }
    
    // 판사 요청 메시지 추가
    addMessage({
      user: 'system',
      name: '시스템',
      text: `${username}님이 판사 호출을 요청했습니다. 모든 참여자의 승인이 필요합니다.`,
      roomId: roomId,
    });
  };

  // 판사 요청에 대한 승인 처리
  const approveJudgeRequest = () => {
    if (!roomId || !database) return;
    
    const userId = localStorage.getItem('userId') || '';
    if (userId) {
      // Firebase에 승인 상태 저장
      const approvalRef = ref(database, `rooms/${roomId}/judgeApprovals/${userId}`);
      set(approvalRef, { username, approved: true });
      setLocalApproval(true);
    }
  };

  // 채팅방 링크 공유 기능 구현
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

  // 사용자 준비 상태 변경 함수
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

  // 모든 사용자가 준비되었는지 확인
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

  // 채팅방 참여 시 준비 상태 구독
  useEffect(() => {
    if (!roomId || !database) return;
    
    const readyRef = ref(database, `rooms/${roomId}/ready`);
    
    // 실시간 준비 상태 변경 감지
    onValue(readyRef, (snapshot) => {
      const data = snapshot.val() || {};
      setReadyUsers(data);
    });
    
    return () => {
      // 구독 해제
      off(readyRef);
    };
  }, [roomId, database]);

  // 사용자 활동 없음 감지 타이머
  const startInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // 마지막 사용자 메시지 이후 20초 이상 경과했는지 확인
      const userMessages = messages.filter(m => m.user === 'user-general');
      if (userMessages.length > 0) {
        const lastUserMessageTime = new Date(userMessages[userMessages.length - 1].timestamp).getTime();
        const elapsed = Date.now() - lastUserMessageTime;
        
        if (elapsed > 20000) { // 20초 이상 경과
          // 판사 개입 요청
          requestJudgeAnalysis();
        }
      }
      
      // 다시 타이머 시작
      startInactivityTimer();
    }, 20000); // 20초마다 확인
  };

  // 채팅방 UI 렌더링
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      {/* 헤더 영역 (일반적으로 스크롤됨) */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-800">채팅방</h2>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
              {calculatedChattersCount}명 참여 중
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                title="채팅방 공유"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            {!onShare && (
              <button
                onClick={handleShareRoom}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                title="채팅방 링크 복사"
              >
                <Share className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* 타이머가 활성화된 경우 타이머 표시 */}
        {timerActive && (
          <div className="bg-blue-50 p-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="text-blue-500 h-5 w-5" />
              <span className="text-blue-700 font-medium">
                남은 시간: {Math.floor(getTimeLeft() / 60)}:{(getTimeLeft() % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-xs text-blue-600">
              시간 종료 후 판사가 최종 판결을 내립니다
            </div>
          </div>
        )}
      </div>

      {/* 스크롤 영역 전체를 감싸는 컨테이너 */}
      <div className="relative flex-1 overflow-hidden">
        {/* 채팅 내용 영역 */}
        <div 
          ref={chatContainerRef}
          className="overflow-y-auto bg-gray-50"
          style={{ height: 'calc(100vh - 230px)' }}
        >
          {/* 메시지 목록 */}
          <div className="p-4 space-y-4">
            {messages.map((message, index) => {
              const isMine = message.sender?.username === username;
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
                  {message.user === 'judge' && <div className="w-3/4 h-px bg-amber-300 mx-auto my-6" />}
                  
                  {/* 프로필 이미지 표시 조건 수정 */}
                  {(message.user === 'judge' || (!isMine && message.user !== 'system')) && (
                    <div className={message.user === 'judge' ? 'mb-2' : ''}>
                      <ProfileInitial name={message.name} isMine={false} />
                    </div>
                  )}
                  
                  {/* 메시지 컨텐츠 컨테이너 너비 확장 */}
                  <div className={`mx-2 ${
                    message.user === 'judge'
                      ? 'max-w-[95%] w-full'
                      : 'max-w-[80%]'
                  } ${isMine ? 'order-1' : 'order-2'}`}>
                    {/* 메시지 정보 (이름, 시간) 중앙 정렬 */}
                    {message.user !== 'system' && (
                      <div className={`flex items-center mb-1 ${message.user === 'judge' ? 'justify-center' : ''}`}>
                        <span className={`text-sm font-medium ${message.user === 'judge' ? 'text-amber-700' : 'text-gray-700'}`}>{message.name}</span>
                        {message.timestamp && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(message.timestamp)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* 메시지 말풍선 스타일 강화 */}
                    <div 
                      className={`rounded-lg px-4 py-2.5 ${
                        message.user === 'system' 
                          ? 'bg-gray-200 text-gray-800 text-sm mx-auto max-w-md' 
                          : message.user === 'judge'
                            ? 'bg-amber-100 border border-amber-300 text-gray-800 shadow-lg'
                            : isMine
                              ? 'bg-indigo-100 text-gray-800'
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
                              ? 'bg-green-100 text-green-800' 
                              : message.messageType === 'objection'
                                ? 'bg-red-100 text-red-800'
                                : message.messageType === 'closing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}>
                            {message.messageType === 'evidence' && '증거'}
                            {message.messageType === 'objection' && '반론'}
                            {message.messageType === 'closing' && '최종변론'}
                            {message.messageType === 'question' && '질문'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 판사 메시지 구분선 끝 */}
                  {message.user === 'judge' && <div className="w-3/4 h-px bg-amber-300 mx-auto my-6" />}
                </div>
              );
            })}
            
            {/* 타이핑 중인 사용자 표시 */}
            {Object.values(typingUsers)
              .filter(user => user.isTyping && user.username !== username).length > 0 && (
              <div className="flex items-center space-x-2 ml-12 mt-1">
                <div className="bg-gray-100 rounded-lg px-3 py-1.5">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {Object.values(typingUsers)
                    .filter(user => user.isTyping && user.username !== username)
                    .map(user => user.username).join(', ')} 입력 중...
                </span>
              </div>
            )}
            
            {/* 메시지 리스트 끝부분 스크롤 참조 */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {!timerActive ? (
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">재판을 시작하세요</h3>
            <p className="text-sm text-gray-600 text-center">
              모든 참여자가 입장한 후 재판을 시작할 수 있습니다.
            </p>
            {!Object.keys(readyUsers).includes(localStorage.getItem('userId') || '') ? (
              <button
                onClick={handleUserReady}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                준비하기
              </button>
            ) : (
              <div className="text-sm text-green-600 font-medium">
                준비 완료! 다른 참가자를 기다리는 중...
              </div>
            )}
            <button
              onClick={initiateCourtProcess}
              disabled={!allUsersReady()}
              className={`px-4 py-2 font-medium rounded-lg transition-colors shadow-sm ${
                allUsersReady()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              재판 시작하기
            </button>
            {!allUsersReady() && (
              <p className="text-xs text-amber-600">
                모든 참가자가 준비되어야 재판을 시작할 수 있습니다.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="flex-1 h-10 min-h-10 max-h-32 px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-y"
            />
            <button
              onClick={() => {
                if (input.trim()) {
                  sendMessage(input);
                  setInput('');
                }
              }}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  전송 중
                </div>
              ) : (
                '전송'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* 재판 준비 모달 */}
      {showCourtReadyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border-2 border-amber-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900">실시간 AI 판사 모드</h2>
            <p className="mb-4 text-gray-800 font-medium">
              이 모드에서는 참가자들이 자유롭게 대화하는 동안 AI 판사가 실시간으로 개입합니다.
              5분 타이머가 시작되며, 시간이 종료되면 AI 판사가 최종 판결을 내립니다.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowCourtReadyModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleStartTrial}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 시작 확인 모달 */}
      {showConfirmStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border-2 border-amber-300">
            <h2 className="text-lg font-bold mb-3 text-gray-900">기존 대화 내용 확인</h2>
            <p className="mb-4 text-gray-800">
              기존 대화 내용이 있습니다. 어떻게 하시겠습니까?
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  clearChat();
                  setShowConfirmStartModal(false);
                  setShowCourtReadyModal(false);
                  startTimerMode();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                대화 내용 지우고 새로 시작
              </button>
              <button
                onClick={() => {
                  setShowConfirmStartModal(false);
                  setShowCourtReadyModal(false);
                  startTimerMode();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                기존 대화 유지하고 시작
              </button>
              <button
                onClick={() => setShowConfirmStartModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 감지된 쟁점 사이드바 (타이머 모드일 때만 표시) */}
      {timerActive && detectedIssues.length > 0 && (
        <div className="fixed right-4 top-20 w-64 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">감지된 쟁점</h3>
          <ul className="space-y-2">
            {detectedIssues.map((issue, index) => (
              <li key={index} className="text-sm bg-gray-50 p-2 rounded-md">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}