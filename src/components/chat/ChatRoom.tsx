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
  Link
} from 'lucide-react';
import { getJudgeResponse, VerdictData, PersonalizedResponse } from '@/lib/gemini';
import { ref, onValue, set, remove, off } from 'firebase/database';
import { database } from '@/lib/firebase';

interface Props {
  roomId?: string;
  userType?: 'user-a' | 'user-b' | null;
  customUsername?: string;  // 커스텀 사용자 이름 추가
  onShare?: () => void;     // 공유 버튼 클릭 핸들러 추가
}

export default function ChatRoom({ roomId, userType, customUsername, onShare }: Props) {
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
    leaveRoom
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
  const sendMessage = () => {
    if (!input.trim() || !roomId) return;
    
    const userId = localStorage.getItem('userId') || uuidv4();
    
    addMessage({
      user: 'user-general',
      name: username,
      text: input,
      roomId: roomId,
      sender: {
        id: userId,
        username
      }
    });
    
    setInput('');
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
      sendMessage();
    }
  };

  // 심판 판정 시작
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [judgeAttempts, setJudgeAttempts] = useState(0);
  
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
        user: msg.user === 'user-a' || msg.user === 'user-b' ? 'user-general' as const : msg.user
      }));
      
      console.log('Gemini API 호출 시도');
      const judgeResponse = await getJudgeResponse(compatibleMessages);
      console.log('Gemini API 응답 받음:', judgeResponse ? '성공' : '실패');
      
      // 판사 메시지 추가
      addMessage({
        user: 'judge',
        name: '판사',
        text: judgeResponse || '판단을 내릴 수 없습니다. 더 많은 대화가 필요합니다.',
        roomId: roomId || '',
      });
      
      // 스탯 업데이트 (판정 결과에 따라 다르게 적용할 수 있음)
      updateStats({
        logicPowerA: Math.min(100, stats.logicPowerA + 5),
        logicPowerB: Math.max(0, stats.logicPowerB - 3),
        bullshitMeter: Math.max(0, stats.bullshitMeter - 5),
        evidenceStrength: Math.min(100, stats.evidenceStrength + 3)
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

  // 판사 응답 렌더링
  const renderJudgeResponse = (text: string) => {
    try {
      console.log('판사 응답 원본:', text);
      
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
          return (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800 mb-2">판사 판결</div>
              <p className="text-yellow-900 whitespace-pre-wrap">{text}</p>
            </div>
          );
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
        
        // JSON 파싱 실패 시 중괄호로 둘러싸인 부분 찾기 시도
        try {
          const jsonPattern = /\{[\s\S]*\}/g;
          const matches = text.match(jsonPattern);
          
          if (matches && matches.length > 0) {
            // 가장 긴 중괄호 부분을 JSON으로 파싱 시도
            const longestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
            verdictData = JSON.parse(longestMatch) as VerdictData;
            console.log('중괄호 추출 후 JSON 파싱 성공');
          }
        } catch (e) {
          console.error('중괄호 추출 후 JSON 파싱 실패:', e);
        }
        
        // 여전히 파싱 실패 시 기본 구조 생성
        if (!verdictData) {
          verdictData = {
            responses: [
              {
                targetUser: "모든 참여자",
                analysis: "",
                message: cleanedText,
                style: "일반",
                percentage: 50,
                reasoning: ["판결 내용 참조"],
                punishment: "판결 내용 참조"
              }
            ],
            verdict: {
              summary: "판사의 판결",
              conflict_root_cause: "",
              recommendation: ""
            }
          };
        }
      }
      
      // 형식이 완전히 잘못된 경우 텍스트로 처리
      if (!verdictData || !verdictData.responses) {
        return (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="font-semibold text-yellow-800 mb-2">판사 판결</div>
            <p className="text-yellow-900 whitespace-pre-wrap">{text}</p>
          </div>
        );
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
  const activeChattersCount = roomUsers
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
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* 채팅방 헤더 */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h2 className="font-medium text-gray-900">대화방 #{roomId?.slice(0, 6)}</h2>
          <div className="flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            <UserCircle className="w-3 h-3 mr-1" />
            <span>{activeChattersCount}명 참여 중</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onShare && (
            <button
              onClick={onShare}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full flex items-center font-medium hover:bg-indigo-100 transition-colors"
            >
              <Link className="w-3 h-3 mr-1" />
              <span>채팅방 공유</span>
            </button>
          )}
        </div>
      </div>

      {/* 판사 부르기 플로팅 버튼 - 직접 요청에서 모달 표시로 변경 */}
      <div className="fixed bottom-6 right-6 z-30">
        <button 
          onClick={showJudgeRequestModal}
          disabled={isAnalyzing || isJudgeInProgress}
          className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-full flex items-center font-medium hover:from-yellow-600 hover:to-amber-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Gavel className="w-4 h-4 mr-2" />
          <span>판사 부르기</span>
        </button>
      </div>

      {/* 판사 모달 */}
      {showJudgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gavel className="h-6 w-6" />
                  <h3 className="text-xl font-bold">판사 호출</h3>
                </div>
                {!isAnalyzing && !isJudgeInProgress && (
                  <button 
                    onClick={closeJudgeModal}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6 space-y-4">
              {isAnalyzing || isJudgeInProgress ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                  <p className="text-gray-700 font-medium text-center">
                    판사가 대화 내용을 분석하고 있습니다...
                  </p>
                  <p className="text-sm text-gray-500">
                    {judgeAttempts > 1 ? `재시도 중... (${judgeAttempts}번째)` : '약 10-20초 정도 소요됩니다.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <p className="text-amber-800">
                      {judgeRequested 
                        ? "판사를 호출하기 위해 모든 참여자의 승인이 필요합니다." 
                        : "판사를 불러 현재 논쟁에 대한 판정을 요청하시겠습니까?"}
                    </p>
                  </div>
                  
                  {/* 판사 호출 가이드 */}
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium mb-2">💡 판사 기능 이용 가이드</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>두 명 이상이 대화에 참여해야 판결이 가능합니다.</li>
                      <li>충분한 대화 내용이 있어야 정확한 판결이 가능합니다.</li>
                      <li>분석에는 약 10-20초 정도 소요됩니다.</li>
                      {judgeRequested && <li className="font-medium text-amber-700">모든 대화 참여자의 승인이 필요합니다!</li>}
                    </ul>
                  </div>
                  
                  {/* 에러 메시지 표시 */}
                  {judgeError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      <p className="font-medium">⚠️ 오류</p>
                      <p>{judgeError}</p>
                    </div>
                  )}
                  
                  {/* 승인 상태 표시 */}
                  {judgeRequested && activeChattersCount > 0 && (
                    <div className="bg-white border border-gray-200 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-3">참여자 승인 상태:</p>
                      <div className="space-y-2">
                        {/* 현재 사용자 승인 상태 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="bg-indigo-100 p-1 rounded-full">
                              <UserCircle className="h-4 w-4 text-indigo-700" />
                            </div>
                            <span className="text-sm">{username} <span className="text-xs text-gray-500">(나)</span></span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${localApproval 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}`}>
                            {localApproval ? '승인됨' : '대기 중'}
                          </span>
                        </div>
                        
                        {/* 다른 참여자들 승인 상태 */}
                        {roomUsers
                          .filter(user => user.username !== username && !user.username.includes('System'))
                          .map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="bg-gray-100 p-1 rounded-full">
                                  <UserCircle className="h-4 w-4 text-gray-700" />
                                </div>
                                <span className="text-sm">{user.username}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${approvals[user.username] 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'}`}>
                                {approvals[user.username] ? '승인됨' : '대기 중'}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* 액션 버튼 */}
                  <div className="flex justify-end space-x-3 pt-2">
                    {!judgeRequested && (
                      <>
                        <button 
                          onClick={closeJudgeModal}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          취소
                        </button>
                        <button 
                          onClick={requestJudge}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md hover:from-amber-600 hover:to-orange-600 transition-colors"
                        >
                          판사 요청
                        </button>
                      </>
                    )}
                    
                    {judgeRequested && (
                      <>
                        <button 
                          onClick={closeJudgeModal}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                          disabled={isAnalyzing}
                        >
                          취소
                        </button>
                        <button 
                          onClick={approveJudgeRequest}
                          disabled={localApproval}
                          className={`px-4 py-2 rounded-md ${
                            localApproval
                              ? 'bg-green-500 text-white cursor-not-allowed'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          } transition-colors`}
                        >
                          {localApproval ? '승인됨' : '승인하기'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
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
                  ? 'bg-indigo-100 text-indigo-900' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-1 mb-1">
                <span className="font-medium text-sm text-gray-800">{message.name}</span>
                <span className="text-xs text-gray-600">{message.timestamp}</span>
              </div>
              {message.user === 'judge' ? 
                renderJudgeResponse(message.text) :
                <p className="whitespace-pre-wrap break-words text-gray-800">{message.text}</p>
              }
            </div>
            
            {message.user !== 'judge' && message.sender?.username === username && (
              <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mt-1">
                {getUserIcon('user-general')}
              </div>
            )}
          </div>
        ))}
        
        {/* 분석 진행 중 UI - 모달로 이동했기 때문에 중복 제거 */}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 타이핑 표시기 - 고정 높이로 변경 */}
      <div className="h-6 px-4 bg-gray-50 border-t border-gray-100">
        {typingUsersList.length > 0 ? (
          <div className="text-xs text-gray-700 animate-pulse">
            {typingUsersList.join(', ')}님이 입력 중...
          </div>
        ) : (
          <div className="text-xs text-transparent">·</div>
        )}
      </div>

      {/* 메시지 입력 영역 */}
      <div className="bg-white p-4 border-t">
        <div className="flex items-stretch space-x-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 placeholder-gray-400"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-4 rounded-lg flex items-center justify-center ${
              !input.trim() || isLoading
                ? 'bg-gray-200 text-gray-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              '전송'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

