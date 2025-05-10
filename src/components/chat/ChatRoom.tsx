'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore, Message, CourtStage } from '@/store/chatStore';
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
  Share
} from 'lucide-react';
import { 
  getJudgeResponse, 
  generateIssues, 
  generateDiscussion, 
  generateQuestions,
  generateClosing,
  generateVerdict,
  generateJudgeMessage,
  VerdictData,
  PersonalizedResponse,
  IssuesData,
  DiscussionData,
  QuestionsData,
  ClosingData,
  JudgeMessageData
} from '@/lib/gemini';
import { ref, onValue, set, remove, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useParams } from 'next/navigation';

// 새 컴포넌트 임포트
import StageTimer from './StageTimer';
import CourtProgressBar from './CourtProgressBar';
import IssuesList from './IssuesList';
import EvidenceRequest from './EvidenceRequest';
import MessageComposer from './MessageComposer';
import VerdictDisplay from './VerdictDisplay';
import CourtReadyModal from './CourtReadyModal';
import JudgeMessageDisplay from './JudgeMessageDisplay';

interface ChatRoomProps {
  roomId: string | null;
  userType?: string;
  customUsername?: string;
  onShare?: () => void;
  initialStage?: string;
  activeChattersCount?: number;
}

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
    // 재판 관련 상태와 메서드
    court,
    startCourt,
    moveToNextStage,
    setStage,
    toggleStageTimer,
    setIssues,
    moveToNextIssue,
    setCurrentIssue,
    addEvidenceRequest,
    fulfillEvidenceRequest,
    setVerdict,
    requestAppeal,
    // 추가된 준비 상태 관련 메서드
    setParticipantReady,
    isAllParticipantsReady,
    getReadyParticipants
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

  // 메시지 보내기
  const sendMessage = (text: string, type?: string, relatedIssue?: string) => {
    if (!text.trim() || !roomId) return;
    
    const userId = localStorage.getItem('userId') || uuidv4();
    
    // Firebase에 undefined 값을 저장할 수 없으므로 null 처리
    const cleanRelatedIssue = relatedIssue || undefined; // null 대신 undefined 사용
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
      relatedIssue: cleanRelatedIssue,
      stage: court.stage
    });
  };

  // 재판 시작 - 수정된 버전
  const initiateCourtProcess = () => {
    // 이미 진행 중인 경우 중복 시작 방지
    if (court.stage !== 'waiting') {
      console.log('이미 재판이 진행 중입니다.');
      return;
    }
    
    console.log('재판 준비 모달 표시');
    console.log('현재 참가자 목록:', roomUsers);
    
    // 재판 준비 모달 표시
    setShowCourtReadyModal(true);
  };
  
  // 사용자 준비 완료 처리
  const handleUserReady = () => {
    const userId = localStorage.getItem('userId') || uuidv4();
    setUserReady(true);
    setParticipantReady(userId, true);
  };
  
  // 모달에서 실제 재판 시작을 처리하는 함수
  const startCourtAfterReady = () => {
    console.log("startCourtAfterReady 함수 호출됨");
    console.log("readyParticipants:", getReadyParticipants());
    console.log("roomUsers:", roomUsers);
    
    // 모달 닫기
    setShowCourtReadyModal(false);
    
    // 재판 시작 - 바로 opening 단계로 설정
    console.log("재판 시작: opening 단계로 설정");
    setStage('opening');
    
    // 시작 메시지 추가
    addMessage({
      user: 'system',
      name: '시스템',
      text: '재판이 시작되었습니다. 모두 진술 단계에서 각 참여자는 자신의 입장을 설명해주세요.',
      roomId: roomId || '',
      stage: 'opening'
    });
    
    // 판사 메시지 추가
    addMessage({
      user: 'judge',
      name: '판사',
      text: '안녕하세요, 법정에 오신 것을 환영합니다.\n\n' +
            '지금부터 모두 진술 단계를 시작하겠습니다. 각 참여자는 자신의 입장을 설명해주세요.\n' + 
            '예시: "저는 이 사건에서 ~한 피해를 입었습니다" 또는 "저는 ~한 이유로 이러한 행동을 했습니다"\n\n' + 
            '말씀하실 때 증거가 있다면 화면 아래 특수 메시지 기능을 사용해 제출해주시고, 상대방 의견에 반박이 있으시면 반론 기능을 이용해주세요.',
      roomId: roomId || '',
      stage: 'opening'
    });
    
    console.log("재판 시작 완료");
  };
  
  // 다음 단계로 이동
  const handleMoveToNextStage = () => {
    // 모든 참가자 동의 필요 (실제 구현 시 추가)
    moveToNextStage();
    
    // 판사 호출이 필요한 단계 확인
    const nextStage = getNextStage(court.stage);
    const needsJudgeCall = ['intro', 'opening', 'issues', 'questions', 'verdict'].includes(nextStage);
    
    if (needsJudgeCall) {
      // 약간의 지연 후 판사 호출 (UI가 업데이트된 후)
      setTimeout(() => callJudge(), 500);
    }
  };
  
  // 다음 단계 계산 (헬퍼 함수)
  const getNextStage = (currentStage: CourtStage): CourtStage => {
    const stages: CourtStage[] = [
      'waiting', 'intro', 'opening', 'issues', 'discussion', 
      'questions', 'closing', 'verdict', 'appeal'
    ];
    
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return currentStage;
    }
    
    return stages[currentIndex + 1];
  };
  
  // 판사 요청 핸들러
  const handleJudgeRequest = () => {
    if (isAnalyzing) return;
    
    // 단계에 따라 다른 요청 형태
    if (court.stage === 'verdict') {
      startJudgement();
    } else {
      callJudge();
    }
  };
  
  // 증거 제출 처리
  const handleEvidenceSubmit = (id: string, evidence: string) => {
    if (!evidence.trim()) return;
    
    // 증거 요청 이행 상태 업데이트
    fulfillEvidenceRequest(id);
    
    // 증거 메시지 추가
    sendMessage(evidence, 'evidence', court.issues[court.currentIssueIndex]);
  };
  
  // 항소 요청 처리
  const handleAppealRequest = () => {
    if (!appealReason.trim()) return;
    
    // 항소 요청
    requestAppeal(appealReason);
    
    // 항소 이유 메시지 추가
    addMessage({
      user: 'system',
      name: '시스템',
      text: `항소 이유: ${appealReason}`,
      roomId: roomId || '',
      stage: 'appeal'
    });
    
    // 모달 닫기
    setShowAppealModal(false);
    setAppealReason('');
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
      
      // Message 타입 불일치 해결을 위해 타입 변환 (user-a나 user-b를 user-general로 변환)
      const compatibleMessages = filteredMessages.map(msg => ({
        ...msg,
        user: (msg.user === 'user-a' || msg.user === 'user-b') ? 'user-general' : msg.user
      })) as import('@/lib/gemini').Message[];
      
      // 현재 단계에 맞는 API 호출
      switch (court.stage) {
        case 'intro':
          // 재판 소개 - 진행 방식 설명
          const introResponse = await generateJudgeMessage(compatibleMessages, 'intro');
          
          // 추가 지시사항을 새 메시지로 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: introResponse.judgeMessage.includes('판사 메시지') 
              ? '각 참여자는 지금 즉시 자신의 입장을 간략히 설명해 주세요. "저는 이 사건에서 ~한 입장입니다"와 같은 형식으로 말씀해주시면 됩니다.' 
              : introResponse.judgeMessage,
            roomId: roomId || '',
            stage: 'intro'
          });
          
          break;
          
        case 'opening':
          // 모두 진술 종료 - 쟁점 추출
          const issuesData = await generateIssues(compatibleMessages);
          
          // 쟁점 저장
          setIssues(issuesData.issues);
          
          // 판사 메시지 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: issuesData.judgeMessage,
            roomId: roomId || '',
            stage: 'opening'
          });
          
          // moveToNextStage(); // 이 부분 제거 - 타이머가 끝나면 자동으로 다음 단계로 이동
          break;
          
        case 'issues':
          // 쟁점 정리 완료 - 토론 시작
          addMessage({
            user: 'judge',
            name: '판사',
            text: `이제 각 쟁점에 대해 토론을 시작하겠습니다. 첫 번째 쟁점은 "${court.issues[0]}"입니다. 이 쟁점에 대한 의견을 자유롭게 말씀해주세요.`,
            roomId: roomId || '',
            stage: 'issues'
          });
          
          // moveToNextStage(); // 이 부분 제거 - 타이머가 끝나면 자동으로 다음 단계로 이동
          break;
          
        case 'discussion':
          // 현재 쟁점에 대한 토론 분석
          const currentIssue = court.issues[court.currentIssueIndex];
          const discussionData = await generateDiscussion(compatibleMessages, currentIssue);
          
          // 판사 메시지 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: discussionData.judgeMessage,
            roomId: roomId || '',
            stage: 'discussion',
            relatedIssue: currentIssue
          });
          
          // 증거 요청이 필요한 경우
          if (discussionData.evidenceRequired && discussionData.evidenceRequests) {
            discussionData.evidenceRequests.forEach(request => {
              addEvidenceRequest({
                targetUser: request.targetUser,
                claim: request.claim,
                requestReason: request.requestReason
              });
            });
          }
          
          // 마지막 쟁점인 경우 판사 질문 단계로 이동, 아니면 다음 쟁점으로
          if (court.currentIssueIndex >= court.issues.length - 1) {
            moveToNextStage(); // 판사 질문 단계로
          } else {
            moveToNextIssue(); // 다음 쟁점으로
          }
          break;
          
        case 'questions':
          // 판사 질문 생성
          const questionsData = await generateQuestions(compatibleMessages);
          
          // 판사 메시지 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: questionsData.judgeMessage,
            roomId: roomId || '',
            stage: 'questions'
          });
          
          // 질문 차례대로 추가
          questionsData.questions.forEach((question, i) => {
            setTimeout(() => {
              addMessage({
                user: 'judge',
                name: '판사',
                text: `${question.targetUser}님께 질문합니다: ${question.question}`,
                roomId: roomId || '',
                stage: 'questions'
              });
            }, (i + 1) * 3000); // 3초 간격으로 질문
          });
          
          // 최종 변론 단계로 이동 (마지막 질문 후) - 이 부분 제거
          // setTimeout(() => {
          //   moveToNextStage();
          // }, (questionsData.questions.length + 1) * 3000);
          break;
          
        case 'closing':
          // 최종 변론 안내
          const closingData = await generateClosing(compatibleMessages);
          
          // 판사 메시지 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: closingData.judgeMessage,
            roomId: roomId || '',
            stage: 'closing'
          });
          
          // 최종 변론 지침 추가
          addMessage({
            user: 'system',
            name: '시스템',
            text: closingData.closingInstructions,
            roomId: roomId || '',
            stage: 'closing'
          });
          break;
          
        case 'verdict':
          // 최종 판결
          const verdictData = await generateVerdict(compatibleMessages);
          
          // 판결 데이터 저장
          setVerdict(verdictData);
          
          // 판결 메시지 추가
          addMessage({
            user: 'judge',
            name: '판사',
            text: JSON.stringify(verdictData),
            roomId: roomId || '',
            stage: 'verdict'
          });
          break;
          
        case 'appeal':
          // 항소심 처리 (실제 구현 시 추가)
          break;
          
        default:
          console.log('알 수 없는 단계:', court.stage);
      }
      
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
      
      // Message 타입 불일치 해결을 위해 타입 변환 (user-a나 user-b를 user-general로 변환)
      const compatibleMessages = filteredMessages.map(msg => ({
        ...msg,
        user: (msg.user === 'user-a' || msg.user === 'user-b') ? 'user-general' : msg.user
      })) as import('@/lib/gemini').Message[];
      
      console.log('Gemini API 호출 시도');
      const judgeResponse = await getJudgeResponse(compatibleMessages, 'verdict');
      console.log('Gemini API 응답 받음:', judgeResponse ? '성공' : '실패');
      
      // 판결 데이터 저장
      try {
        const verdictData = JSON.parse(judgeResponse);
        setVerdict(verdictData);
      } catch (e) {
        console.error('판결 데이터 파싱 오류:', e);
      }
      
      // 판사 메시지 추가
      addMessage({
        user: 'judge',
        name: '판사',
        text: judgeResponse || '판단을 내릴 수 없습니다. 더 많은 대화가 필요합니다.',
        roomId: roomId || '',
        stage: 'verdict'
      });
      
      // 단계 업데이트
      setStage('verdict');
      
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

  // 판사 응답 렌더링
  const renderJudgeResponse = (text: string) => {
    try {
      console.log('판사 응답 원본:', text);
      
      // 일반 텍스트 메시지인지 확인 (JSON 형식이 아닌 경우)
      if (!text.startsWith('{') && !text.includes('{"responses"') && !text.includes('{"issues"')) {
        return <JudgeMessageDisplay text={text} stage={court.stage} />;
      }
      
      // 응답이 오류 메시지인 경우 바로 표시
      if (text.includes('판사를 불러오는 중 오류가 발생했습니다') || 
          text.includes('API 키가 설정되지 않았습니다')) {
        return (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="font-semibold text-red-800 mb-2">⚠️ 오류 발생</div>
            <p className="text-red-700 whitespace-pre-wrap">{text}</p>
            <p className="text-sm mt-2 text-red-600">잠시 후 다시 시도해주세요.</p>
          </div>
        );
      }
      
      // "알겠습니다"로 시작하는 일반 텍스트 응답 처리
      if (text.startsWith("알겠습니다") || 
          text.startsWith("네,") || 
          text.startsWith("이해했습니다")) {
        // JSON 부분 찾기 시도
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          // JSON 부분만 추출
          text = jsonMatch[1];
        } else {
          // JSON이 없으면 전체 텍스트를 그대로 표시
          return <JudgeMessageDisplay text={text} stage={court.stage} />;
        }
      }
      
      // 마크다운 코드 블록 제거 
      let cleanedText = text;
      
      // ```json 형태 처리
      cleanedText = cleanedText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
      
      // 단순 ``` 형태 처리
      cleanedText = cleanedText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
      
      // 앞뒤 공백 제거 및 이스케이프 처리
      cleanedText = cleanedText.trim();
      if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
        cleanedText = cleanedText.slice(1, -1);
      }
      cleanedText = cleanedText.replace(/\\\"/g, '"');
      
      console.log('정제된 텍스트:', cleanedText.substring(0, 100) + '...');
      
      // 응답이 JSON이 아닌 경우 처리
      let verdictData: VerdictData | null = null;
      try {
        // JSON 파싱 시도
        const parsed = JSON.parse(cleanedText);
        console.log('판사 응답 파싱 성공:', parsed);
        verdictData = parsed as VerdictData;
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        console.log('일반 텍스트 응답으로 처리');
        
        // 파싱 실패 시 일반 텍스트로 표시
        return <JudgeMessageDisplay text={text} stage={court.stage} />;
      }
      
      // 형식이 완전히 잘못된 경우 텍스트로 처리
      if (!verdictData || !verdictData.responses) {
        return <JudgeMessageDisplay text={text} stage={court.stage} />;
      }
      
      return (
        <div className="space-y-4">
          {/* 전체 요약 */}
          {verdictData.verdict && verdictData.verdict.summary && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">📋 판결 요약</h3>
              <p className="text-yellow-900">{verdictData.verdict.summary}</p>
            </div>
          )}
          
          {/* 개인별 판결 */}
          {verdictData.responses && Array.isArray(verdictData.responses) && verdictData.responses.length > 0 && (
            verdictData.responses.map((response: PersonalizedResponse, index: number) => (
              <div 
                key={index}
                className={`p-4 rounded-lg space-y-3 ${
                  response.targetUser === username 
                    ? 'bg-indigo-50 border-l-4 border-indigo-400' 
                    : 'bg-gray-50 border-l-4 border-gray-400'
                }`}
              >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg text-gray-800">📌 {response.targetUser}님에 대한 판결</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  response.percentage > 50 ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {response.percentage}% 책임
                </span>
              </div>
              
              <div className="space-y-3">
                {/* 판사 메시지 */}
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    판사의 말 ({response.style || '일반'})
                  </div>
                  <p className="whitespace-pre-wrap text-gray-900">
                    {response.message}
                  </p>
                </div>
                
                {/* 근거 및 처벌 */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      🔍 상세 분석
                    </div>
                    {response.reasoning && Array.isArray(response.reasoning) ? (
                      <ul className="text-sm text-gray-800 space-y-1">
                        {response.reasoning.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-800">분석 내용 없음</p>
                    )}
                  </div>
                  
                  <div className="bg-white p-3 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      ⚖️ 처벌/보상
                    </div>
                    <p className="text-sm text-gray-800">{response.punishment}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
          
            {/* 근본 원인 및 해결방안 */}
            {verdictData.verdict && (
              <div className="space-y-3">
                {verdictData.verdict.conflict_root_cause && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">🔬 갈등의 근본 원인</h3>
                    <p className="text-purple-900">{verdictData.verdict.conflict_root_cause}</p>
                  </div>
                )}
                
                {verdictData.verdict.recommendation && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">💡 해결 방안</h3>
                    <p className="text-green-900">{verdictData.verdict.recommendation}</p>
                  </div>
                )}
              </div>
            )}
        </div>
      );
    } catch (error) {
      console.error('판사 응답 파싱 실패:', error);
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>판사 응답을 처리할 수 없습니다. 다시 요청해주세요.</p>
          <p className="text-xs mt-2">오류 정보: {String(error)}</p>
        </div>
      );
    }
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
      
      // 로컬 상태 업데이트
      setLocalApproval(true);
    }
  };

  // Firebase에서 판사 요청 및 승인 상태 감시
  useEffect(() => {
    if (!roomId || !database) return;
    
    // 판사 요청 상태 감시
    const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
    onValue(judgeRequestRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === 'pending') {
        // 판사 요청이 있으면 UI 표시
        setJudgeRequested(true);
        setShowJudgeModal(true);
      } else if (data && data.status === 'in_progress') {
        // 판사 분석 중인 경우
        setIsJudgeInProgress(true);
        setJudgeRequested(false);
      } else if (!data || data.status === 'completed') {
        // 요청이 없거나 완료된 경우
        setJudgeRequested(false);
        setIsJudgeInProgress(false);
      }
    });
    
    // 승인 상태 감시
    const approvalsRef = ref(database, `rooms/${roomId}/judgeApprovals`);
    onValue(approvalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // 승인 데이터 처리
        const approvalData: Record<string, boolean> = {};
        Object.entries(data).forEach(([userId, userData]: [string, any]) => {
          if (userData.approved) {
            approvalData[userData.username] = true;
          }
        });
        
        // 자신의 승인 상태 확인
        const myUserId = localStorage.getItem('userId') || '';
        if (data[myUserId] && data[myUserId].approved) {
          setLocalApproval(true);
        }
        
        setApprovals(approvalData);
      }
    });
    
    return () => {
      // 컴포넌트 언마운트 시 리스너 제거
      off(judgeRequestRef);
      off(approvalsRef);
    };
  }, [roomId]);

  // 모든 참여자의 승인 여부 확인 및 판사 호출
  useEffect(() => {
    if (!judgeRequested || !roomId || isJudgeInProgress || isAnalyzing) return;
    
    // 승인 필요한 유저 수 (시스템 유저 제외)
    const activeUsers = roomUsers.filter(user => 
      !user.username.includes('System') && 
      user.username !== 'System'
    );
    
    // 모든 유저가 승인했는지 확인
    const allApproved = activeUsers.length > 0 && 
      activeUsers.every(user => approvals[user.username] || (user.username === username && localApproval));
    
    // 모든 유저가 승인했고 요청 상태인 경우 판사 호출
    if (allApproved && judgeRequested && activeUsers.length >= 1) {
      console.log('모든 사용자 승인 완료, 판사 호출 시작');
      
      // 판사 호출 중복 방지 플래그 설정
      setIsJudgeInProgress(true);
      
      // Firebase에서 판사 요청 상태를 진행 중으로 업데이트
      if (database) {
        const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
        set(judgeRequestRef, { 
          status: 'in_progress',
          startTime: new Date().toISOString() 
        });
      }
      
      // 판사 호출
      startJudgement().then(() => {
        // 판사 호출 완료 후 상태 리셋
        if (database) {
          const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
          set(judgeRequestRef, { status: 'completed' });
          
          // 승인 정보 초기화
          const approvalsRef = ref(database, `rooms/${roomId}/judgeApprovals`);
          remove(approvalsRef);
        }
        
        // 상태 초기화
        setJudgeRequested(false);
        setLocalApproval(false);
        setApprovals({});
        setIsJudgeInProgress(false);
        setShowJudgeModal(false);
      }).catch(error => {
        console.error('판사 호출 오류:', error);
        
        // 오류 발생 시 상태 리셋
        if (database) {
          const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
          set(judgeRequestRef, { status: 'error', error: String(error) });
        }
        
        setIsJudgeInProgress(false);
      });
    }
  }, [approvals, localApproval, judgeRequested, roomUsers, roomId, isJudgeInProgress, isAnalyzing, messages, stats, addMessage, updateStats, username]);

  // 모달 닫기 처리
  const closeJudgeModal = () => {
    if (isAnalyzing || isJudgeInProgress) return; // 분석 중에는 닫을 수 없음
    
    setShowJudgeModal(false);
    
    // 요청 취소 처리
    if (judgeRequested && roomId && database) {
      const judgeRequestRef = ref(database, `rooms/${roomId}/judgeRequest`);
      remove(judgeRequestRef);
      
      // 승인 정보 초기화
      const approvalsRef = ref(database, `rooms/${roomId}/judgeApprovals`);
      remove(approvalsRef);
      
      setJudgeRequested(false);
      setLocalApproval(false);
      setApprovals({});
      
      // 취소 메시지 추가
      addMessage({
        user: 'system',
        name: '시스템',
        text: `${username}님이 판사 호출 요청을 취소했습니다.`,
        roomId: roomId,
      });
    }
  };

  // 모달에서 직접 호출하는 대신 모달 표시만 처리
  const showJudgeRequestModal = () => {
    // 이미 요청 중이면 표시만
    if (judgeRequested || isAnalyzing || isJudgeInProgress) {
      setShowJudgeModal(true);
      return;
    }
    
    // 새 요청이면 모달만 표시 (실제 요청은 버튼 클릭 시)
    setShowJudgeModal(true);
  };

  return (
    <div className={`flex flex-col h-full ${court.stage !== 'waiting' ? 'pt-24' : ''}`}>
      {/* 진행 상황 표시줄 (재판 진행 중일 때만) */}
      {court.stage !== 'waiting' && (
        <CourtProgressBar
          currentStage={court.stage}
          stages={['opening', 'issues', 'discussion', 'questions', 'closing', 'verdict', 'appeal'] as CourtStage[]}
          stageTimeLeft={court.stageTimeLeft}
          stageTimerActive={court.stageTimerActive}
          onRequestJudge={handleJudgeRequest}
          onTimeEnd={() => {
            // 시간 종료 시 자동으로 판사 호출 또는 다음 단계로 이동
            if (['opening', 'discussion', 'questions', 'closing'].includes(court.stage)) {
              callJudge();
            } else {
              // 그 외의 경우에는 다음 단계로 자동 이동
              moveToNextStage();
            }
          }}
        />
      )}
      
      {/* 채팅방 헤더 */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="font-medium text-gray-900">대화방 #{roomId?.slice(0, 6)}</h2>
          </div>
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <UserCircle className="w-4 h-4 text-indigo-500 mr-1.5" />
            <span className="font-medium text-gray-700">{calculatedChattersCount}명 참여 중</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg shadow-sm transition-colors duration-200"
            >
              <Link className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">채팅방 공유</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 토론 단계에서 쟁점 목록 표시 */}
      {court.stage === 'discussion' && court.issues.length > 0 && (
        <IssuesList
          issues={court.issues}
          currentIssueIndex={court.currentIssueIndex}
          onSelectIssue={(index) => setCurrentIssue(index)}
          isDiscussionStage={court.stage === 'discussion'}
        />
      )}

      {/* 채팅 메시지 영역 */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* 증거 요청이 있는 경우 표시 */}
        {court.evidenceRequests.filter(req => !req.fulfilled).map(request => (
          <EvidenceRequest
            key={request.id}
            id={request.id}
            targetUser={request.targetUser}
            claim={request.claim}
            requestReason={request.requestReason}
            isMine={request.targetUser === username}
            onSubmit={handleEvidenceSubmit}
          />
        ))}
      
        {messages.map((message, index) => {
          // 메시지 유형에 따른 스타일 결정
          let messageTypeClass = '';
          if (message.messageType === 'evidence') {
            messageTypeClass = 'border-l-4 border-emerald-500';
          } else if (message.messageType === 'objection') {
            messageTypeClass = 'border-l-4 border-red-500';
          } else if (message.messageType === 'closing') {
            messageTypeClass = 'border-l-4 border-indigo-500';
          }
          
          return (
            <div 
              key={`${message.id}-${index}`} 
              className={`flex items-start space-x-2 ${
                message.user === 'judge' ? 'flex-col w-full' :
                message.sender?.username === username ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.user !== 'judge' && message.sender?.username !== username && (
                <div className="flex-shrink-0 bg-gray-200 rounded-full p-2 mt-1">
                  {getUserIcon(message.user)}
                </div>
              )}
              
              <div 
                className={`max-w-none w-full rounded-lg p-3 ${
                  message.user === 'system' 
                    ? 'bg-gray-100 text-gray-800' 
                    : message.user === 'judge' 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : message.sender?.username === username 
                    ? `bg-indigo-100 text-indigo-900 ${messageTypeClass}` 
                    : `bg-white border border-gray-200 text-gray-900 ${messageTypeClass}`
                }`}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <span className="font-medium text-sm text-gray-800">{message.name}</span>
                  <span className="text-xs text-gray-600">{message.timestamp}</span>
                  
                  {/* 메시지 유형 표시 */}
                  {message.messageType && message.messageType !== 'normal' && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      message.messageType === 'evidence' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : message.messageType === 'objection'
                          ? 'bg-red-100 text-red-800'
                          : message.messageType === 'closing'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ''
                    }`}>
                      {message.messageType === 'evidence' && '증거'}
                      {message.messageType === 'objection' && '반론'}
                      {message.messageType === 'closing' && '최종변론'}
                    </span>
                  )}
                  
                  {/* 관련 쟁점 표시 */}
                  {message.relatedIssue && (
                    <span className="ml-1 text-xs text-gray-500">
                      쟁점: {message.relatedIssue}
                    </span>
                  )}
                </div>
                
                {message.user === 'judge' && court.stage === 'verdict' 
                  ? <VerdictDisplay 
                      verdictData={court.verdictData || JSON.parse(message.text)} 
                      currentUsername={username}
                    />
                  : message.user === 'judge' 
                    ? renderJudgeResponse(message.text)
                    : <p className="whitespace-pre-wrap break-words text-gray-800">{message.text}</p>
                }
              </div>
              
              {message.user !== 'judge' && message.sender?.username === username && (
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mt-1">
                  {getUserIcon('user-general')}
                </div>
              )}
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 타이핑 표시기 */}
      <div className="h-6 px-4 bg-gray-50 border-t border-gray-100">
        {typingUsersList.length > 0 ? (
          <div className="text-xs text-gray-700 animate-pulse">
            {typingUsersList.join(', ')}님이 입력 중...
          </div>
        ) : (
          <div className="text-xs text-transparent">·</div>
        )}
      </div>

      {/* 메시지 입력 영역 - 새로운 컴포넌트 사용 */}
      <MessageComposer
        onSendMessage={sendMessage}
        isLoading={isLoading}
        stage={court.stage}
        currentIssue={court.issues[court.currentIssueIndex]}
        onStartCourt={initiateCourtProcess}
        onInputChange={handleInputChange}
      />
      
      {/* 재판 준비 모달 */}
      <CourtReadyModal 
        isOpen={showCourtReadyModal}
        onClose={() => {
          console.log('모달 닫기');
          setShowCourtReadyModal(false);
        }}
        onUserReady={() => {
          console.log('사용자 준비 완료');
          handleUserReady();
        }}
        onStartTrial={() => {
          console.log('재판 시작하기 콜백 호출됨');
          startCourtAfterReady();
        }}
        roomId={roomId || ''}
        userId={localStorage.getItem('userId') || uuidv4()}
        username={username}
        participants={roomUsers}
      />
      
      {/* 항소 모달 */}
      <AnimatePresence>
        {showAppealModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">항소 신청</h3>
              <p className="text-gray-700 mb-4">
                항소 이유를 구체적으로 작성해주세요.
              </p>
              
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="항소 이유..."
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={4}
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAppealRequest}
                  disabled={!appealReason.trim()}
                  className={`px-4 py-2 rounded-md ${
                    appealReason.trim()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } transition-colors`}
                >
                  항소 제출
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

