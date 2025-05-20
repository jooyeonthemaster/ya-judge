import { create } from 'zustand';
import { database } from '@/lib/firebase';
import { 
  onValue, 
  ref, 
  push, 
  set as firebaseSet, 
  remove, 
  off, 
  onDisconnect, 
  DatabaseReference, 
  Database,
  onChildAdded
} from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Message as GeminiMessage, InterventionData, InterventionType } from '../lib/gemini';
import { analyzeConversation, getFinalVerdict } from '../lib/gemini';
import { TIMER_DURATION_MS, MIN_INTERVENTION_INTERVAL_MS } from '../lib/timerConfig';

// 타이머 관련 상수
const MIN_MESSAGES_BEFORE_FIRST_INTERVENTION = 4; // 첫 개입 전 필요한 최소 메시지 수

// 패턴 기반 개입 감지를 위한 상수
const INTERVENTION_PATTERNS = {
  AGGRESSIVE: /씨발|시발|ㅅㅂ|ㅆㅂ|개새끼|ㄱㅐㅅㅐㄲㅣ|병신|ㅂㅅ|미친|ㅁㅊ|존나|ㅈㄴ|지랄/i,
  OFF_TOPIC: /날씨|점심|주식|게임/,
  INVALID_LOGIC: /무조건|항상|절대|모든/,
  EVIDENCE_NEEDED: /증거|증명|팩트|자료/
};

export interface Message {
  id: string;
  user: 'user-general' | 'judge' | 'system';
  name: string;
  text: string;
  timestamp: string;
  roomId?: string;
  sender?: {
    id: string;
    username: string;
  };
  // 메시지 확장 속성
  messageType?: 'normal' | 'evidence' | 'objection' | 'question' | 'closing'; // 메시지 유형
  relatedIssue?: string; // 관련 쟁점
}

export interface JudgeIntervention {
  id: string;
  type: InterventionType;
  timestamp: string;
  text: string;
  targetUser?: string;
}

export interface ChatState {
  messages: Message[];
  stats: {
    logicPowerA: number;
    logicPowerB: number;
    bullshitMeter: number;
    evidenceStrength: number;
  };
  currentUser: 'user-a' | 'user-b' | null;
  roomUsers: Array<{ id: string; username: string }>;
  typingUsers: Record<string, { username: string, isTyping: boolean }>;
  
  // 실시간 판사 시스템
  timerStartTime: number | null;
  timerDuration: number;
  timerActive: boolean;
  
  detectedIssues: string[];
  judgeInterventions: JudgeIntervention[];
  
  // 상태 플래그
  isLoading: boolean;
  error: string | null;
  
  // 사용자별 욕설 레벨 추적
  userCurseLevels: Record<string, number>;
  
  // 최종 판결 요청 여부
  finalVerdictRequested: boolean;
  
  // 호스트 여부 추적
  isHost: boolean;
  
  // 함수들
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStats: (partial: Partial<ChatState['stats']>) => void;
  setCurrentUser: (user: 'user-a' | 'user-b' | null) => void;
  clearMessages: () => void;
  setRoomUsers: (users: Array<{ id: string; username: string }>) => void;
  setTypingStatus: (userId: string, username: string, isTyping: boolean) => void;
  joinRoom: (roomId: string, username: string, asHost?: boolean) => void;
  leaveRoom: () => void;
  
      // 타이머 관련 함수
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    getTimeLeft: () => number;
    timeSinceLastIntervention: () => number;
    onTimerEnd: () => void;
  
  // 판사 개입 관련 함수
  requestJudgeAnalysis: (isFinal?: boolean, showMessage?: boolean) => Promise<void>;
  addJudgeIntervention: (type: InterventionType, text: string, targetUser?: string) => void;
  updateDetectedIssues: (issues: string[]) => void;
  requestFinalVerdict: () => Promise<void>;
  clearChat: () => void;
  
  // 사용자 욕설 레벨 관련 함수
  updateUserCurseLevel: (userId: string, increment: number) => void;
  getUserCurseLevel: (userId: string) => number;
}

export const useChatStore = create<ChatState>((set, get) => {
  // 초기 상태
  const initialState = {
    messages: [],
    stats: {
      logicPowerA: 50,
      logicPowerB: 50,
      bullshitMeter: 0,
      evidenceStrength: 50
    },
    currentUser: null,
    roomUsers: [],
    typingUsers: {},
    
    // 실시간 판사 시스템 상태
    timerStartTime: null,
    timerDuration: TIMER_DURATION_MS,
    timerActive: false,
    
    detectedIssues: [],
    judgeInterventions: [],
    
    // 상태 플래그
    isLoading: false,
    error: null,
    
    // 사용자별 욕설 레벨 추적
    userCurseLevels: {},
    
    // 최종 판결 요청 여부
    finalVerdictRequested: false,
    
    // 호스트 여부 초기값
    isHost: false,
  };

  // 방 참여 상태 관리
  let currentRoomRef: DatabaseReference | null = null;
  let roomUsersRef: DatabaseReference | null = null;
  let typingRef: DatabaseReference | null = null;
  let verdictStatusRef: DatabaseReference | null = null;
  let currentUserId: string = '';
  let db = database as Database | undefined;
  
  // 성능 개선을 위한 캐시 및 타이머
  let responseCache: Record<string, {
    timestamp: number;
    interventionData: InterventionData;
  }> = {};
  let preloadTimer: NodeJS.Timeout | null = null;
  let lastAnalysisTime = 0;
  const CACHE_EXPIRY = 30000; // 캐시 만료 시간: 30초
  const PRELOAD_INTERVAL = 15000; // 사전 로드 간격: 15초
  
  return {
    ...initialState,  // 초기 상태 값 포함

    // 채팅방 참여
    joinRoom: (roomId: string, username: string, asHost = false) => {
      if (!db) {
        console.error('Firebase database is not initialized');
        return;
      }
      
      console.log(`Joining room: ${roomId} as ${username}${asHost ? ' (host)' : ''}`);
      
      // 이전 연결 정리
      if (currentRoomRef) {
        console.log('Cleaning up previous connections');
        off(currentRoomRef);
        if (roomUsersRef) off(roomUsersRef);
        if (typingRef) off(typingRef);
        if (verdictStatusRef) off(verdictStatusRef);
      }

      try {
        // 사용자 ID 생성
        currentUserId = uuidv4();
        console.log(`Generated user ID: ${currentUserId}`);
        
        // 호스트 상태 설정
        set({ isHost: asHost });
        
        // 방 메시지 참조
        currentRoomRef = ref(db, `rooms/${roomId}/messages`);
        
        // 방에 사용자 추가 전 기존 연결 정리
        roomUsersRef = ref(db, `rooms/${roomId}/users`);
        
        // 먼저 현재 사용자 이름과 동일한 이전 연결이 있는지 확인하고 제거
        onValue(roomUsersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // 동일한 사용자 이름을 가진 이전 연결 찾기
            Object.entries(data).forEach(([userId, userData]: [string, any]) => {
              if (userData.username === username && userId !== currentUserId) {
                // 이전 연결 제거
                const oldUserRef = ref(db, `rooms/${roomId}/users/${userId}`);
                remove(oldUserRef)
                  .then(() => console.log(`Removed previous connection for ${username}`))
                  .catch(err => console.error('Failed to remove previous user:', err));
              }
            });
          }
          
          // 새 사용자 정보 추가
          const userRef = ref(db, `rooms/${roomId}/users/${currentUserId}`);
          firebaseSet(userRef, { username })
            .then(() => console.log('User added to room'))
            .catch(err => console.error('Failed to add user to room:', err));
          
          // 연결 종료시 사용자 제거
          onDisconnect(userRef).remove();
          
        }, { onlyOnce: true });
        
        // 초기 메시지 로드 및 새 메시지 리스너 설정
        onValue(currentRoomRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log('Initial messages loaded');
            const messageArray = Object.values(data) as Message[];
            set({ messages: messageArray });
            
            // 초기 로드 후 입장 메시지 추가 (한 번만 실행)
            const joinMessage = {
              user: 'system' as const,
              name: 'System',
              text: `${username}님이 입장하셨습니다.`,
              roomId
            };
            
            // 메시지 추가
            get().addMessage(joinMessage);
          } else {
            // 채팅방이 비어있는 경우 바로 입장 메시지 추가
            const joinMessage = {
              user: 'system' as const,
              name: 'System',
              text: `${username}님이 입장하셨습니다.`,
              roomId
            };
            
            // 메시지 추가
            get().addMessage(joinMessage);
          }
        }, { onlyOnce: true });
        
        // 새 메시지 추가될 때 핸들링 - 중복 방지 처리 추가
        onChildAdded(currentRoomRef, (snapshot) => {
          const message = snapshot.val() as Message;
          if (message) {
            console.log('New message received:', message.id);
            // 중복 방지를 위한 체크 추가
            set(state => {
              // 메시지 ID가 이미 존재하는지 확인
              const messageExists = state.messages.some(m => m.id === message.id);
              if (messageExists) {
                console.log('Duplicate message detected, skipping:', message.id);
                return state; // 상태 변경 없음
              }
              return {
                messages: [...state.messages, message]
              };
            });
          }
        });
        
        // 사용자 목록 구독
        onValue(roomUsersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const usersArray = Object.entries(data)
              .map(([id, user]: [string, any]) => ({
                id,
                username: user.username
              }))
              // 시스템 계정 제외 및 중복 사용자 제거
              .filter(user => {
                // 시스템 계정 제외
                return user.username !== 'System' && 
                       !user.username.includes('System') &&
                       user.username.trim() !== '';
              });
            
            console.log(`Room users updated: ${usersArray.length} actual users`);
            set({ roomUsers: usersArray });
          } else {
            set({ roomUsers: [] });
          }
        });
        
        // 타이핑 상태 구독
        typingRef = ref(db, `rooms/${roomId}/typing`);
        onValue(typingRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            set({ typingUsers: data });
          } else {
            set({ typingUsers: {} });
          }
        });
        
        // 판결 상태 참조 및 리스너 설정
        verdictStatusRef = ref(db, `rooms/${roomId}/verdictStatus`);
        onValue(verdictStatusRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // 판결 상태 업데이트
            const isRequested = data.finalVerdictRequested === true;
            
            if (isRequested && !get().finalVerdictRequested) {
              console.log('다른 클라이언트에서 판결이 요청됨');
              set({ finalVerdictRequested: true });
            }
          }
        });
      } catch (error) {
        console.error('Error joining room:', error);
      }
    },
    
    // 방 나가기
    leaveRoom: () => {
      console.log('Leaving room');
      if (!db || !currentRoomRef) {
        console.log('Nothing to leave - database or room reference not initialized');
        return;
      }
      
      try {
        // 구독 해제
        console.log('Unsubscribing from room events');
        off(currentRoomRef);
        if (roomUsersRef) off(roomUsersRef);
        if (typingRef) off(typingRef);
        if (verdictStatusRef) off(verdictStatusRef);
        
        // 사용자 제거
        if (currentUserId && roomUsersRef) {
          console.log(`Removing user ${currentUserId} from room`);
          const pathArray = roomUsersRef.toString().split('/');
          const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/users
          const userRef = ref(db, `rooms/${roomId}/users/${currentUserId}`);
          remove(userRef)
            .then(() => console.log('User removed from room'))
            .catch(err => console.error('Failed to remove user from room:', err));
        }
        
        // 상태 초기화
        console.log('Resetting state');
        set(initialState);
        
        // 참조 초기화
        currentRoomRef = null;
        roomUsersRef = null;
        typingRef = null;
        verdictStatusRef = null;
        currentUserId = '';
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    },
    
    // 메시지 추가
    addMessage: (message) => {
      if (!db || !currentRoomRef) {
        console.error('Cannot add message - database or room reference not initialized');
        return;
      }
      
      try {
        // 먼저 message에서 필요한 값을 추출
        const { relatedIssue, ...restMessage } = message;
        
        // Firebase에 undefined를 저장할 수 없으므로 undefined 값 정리
        const cleanMessage = {
          ...restMessage,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          messageType: message.messageType || 'normal',
          relatedIssue: relatedIssue || null, // undefined -> null
        };
        
        console.log('Adding new message:', cleanMessage.id);
        
        // Firebase에 메시지 추가
        push(currentRoomRef, cleanMessage)
          .then(() => {
            console.log('Message sent successfully');
            
            // 로컬 상태 즉시 업데이트 (Firebase 이벤트 기다리지 않고)
            // 중복 방지를 위해 이미 존재하는지 확인
            set(state => {
              const messageExists = state.messages.some(m => m.id === cleanMessage.id);
              if (messageExists) {
                return state;
              }
              return {
                messages: [...state.messages, cleanMessage as Message]
              };
            });
            
            // 메시지 추가 후 자동 판사 분석 호출 로직 추가
            const state = get();
            
            // 사용자 메시지이고 타이머가 활성화된 경우에만 판사 분석 고려
            if (
              message.user === 'user-general' && 
              state.timerActive && 
              !state.isLoading
            ) {
              // 패턴 기반 긴급 개입 체크
              const messageText = message.text.toLowerCase();
              
              // 욕설 감지 및 즉시 판사 개입
              if (INTERVENTION_PATTERNS.AGGRESSIVE.test(messageText)) {
                console.log('공격적 언어 감지: 판사 개입 요청');
                
                // Show analysis in progress message
                get().addMessage({
                  user: 'system',
                  name: '시스템',
                  text: '판사가 상황을 분석 중입니다...'
                });
                
                // Immediately request judge analysis when curse is detected
                get().requestJudgeAnalysis(false, true);
                
                return; // Skip normal analysis checks
              }
              
              // Normal message flow for non-aggressive messages
              let urgentIntervention = false;
              
              if (INTERVENTION_PATTERNS.EVIDENCE_NEEDED.test(messageText)) {
                console.log('증거 요청 감지: 긴급 개입 고려');
                urgentIntervention = true;
              }
              
              // 메시지 개수가 최소 개입 기준 이상인지 확인
              const userMessages = state.messages.filter(msg => msg.user === 'user-general');
              
              // 마지막 판사 개입 이후 경과 시간 확인
              const timeSinceLastJudge = state.timeSinceLastIntervention();
              
              // Normal check for judge intervention (no aggressive language case)
              if (
                urgentIntervention ||
                (userMessages.length >= MIN_MESSAGES_BEFORE_FIRST_INTERVENTION && 
                timeSinceLastJudge >= MIN_INTERVENTION_INTERVAL_MS)
              ) {
                console.log('자동 판사 분석 요청 조건 충족');
                setTimeout(() => {
                  // Only background analysis, no messages for normal analysis
                  get().requestJudgeAnalysis(false, false);
                }, urgentIntervention ? 200 : 500);
              } else {
                console.log(
                  '자동 판사 분석 조건 미충족:', 
                  `메시지 수: ${userMessages.length}/${MIN_MESSAGES_BEFORE_FIRST_INTERVENTION}, ` +
                  `경과 시간: ${timeSinceLastJudge}/${MIN_INTERVENTION_INTERVAL_MS}ms`
                );
              }
            }
          })
          .catch(err => console.error('Failed to send message:', err));
      } catch (error) {
        console.error('Error adding message:', error);
      }
    },
    
    // 타이핑 상태 설정
    setTypingStatus: (userId, username, isTyping) => {
      if (!db || !typingRef) {
        console.error('Cannot set typing status - database or typing reference not initialized');
        return;
      }
      
      try {
        const pathArray = typingRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/typing
        const userTypingRef = ref(db, `rooms/${roomId}/typing/${userId}`);
        
        // 현재 상태 확인
        const currentState = get().typingUsers[userId];
        const currentIsTyping = currentState?.isTyping;
        
        // 상태가 변경된 경우에만 업데이트
        if (currentIsTyping !== isTyping) {
          console.log(`User ${username} typing status changed to: ${isTyping}`);
          
          firebaseSet(userTypingRef, { username, isTyping })
            .catch(err => console.error('Failed to set typing status:', err));
          
          // 로컬 상태도 업데이트
          set(state => ({
            typingUsers: {
              ...state.typingUsers,
              [userId]: { username, isTyping }
            }
          }));
          
          // 타이핑 중인 경우, 자동 해제는 컴포넌트에서 관리
        }
      } catch (error) {
        console.error('Error setting typing status:', error);
      }
    },
    
    // 메시지 초기화
    clearMessages: () => {
      console.log('Clearing messages');
      set({ messages: [] });
    },
    
    // 현재 사용자 설정
    setCurrentUser: (user) => {
      console.log(`Setting current user to: ${user}`);
      set({ currentUser: user });
    },
    
    // 채팅방 사용자 목록 설정
    setRoomUsers: (users) => {
      console.log(`Setting room users: ${users.length} users`);
      set({ roomUsers: users });
    },
    
    // 통계 업데이트
    updateStats: (partial) => {
      console.log('Updating stats:', partial);
      set((state) => ({
        stats: {
          ...state.stats,
          ...partial
        }
      }));
    },

    // 타이머 관련 함수
    startTimer: () => {
      set({ 
        timerStartTime: Date.now(),
        timerActive: true,
        finalVerdictRequested: false
      });
      
      // 타이머가 끝나면 자동으로 최종 판결 요청
      const timerTimeout = setTimeout(() => {
        const state = get();
        // 타이머가 여전히 활성 상태인지, 아직 판결이 요청되지 않았는지 확인
        // 그리고 호스트만 타이머 종료시 최종 판결 요청 가능
        if (state.timerActive && !state.finalVerdictRequested && state.isHost) {
          console.log('타이머 종료: 자동으로 최종 판결 요청');
          state.onTimerEnd();
        }
      }, TIMER_DURATION_MS);
      
      // 전역 변수로 저장하여 필요시 취소할 수 있게 함
      (window as any).__timerTimeout = timerTimeout;
    },
    
    pauseTimer: () => {
      // 타이머 자동 종료 이벤트 취소
      if ((window as any).__timerTimeout) {
        clearTimeout((window as any).__timerTimeout);
        (window as any).__timerTimeout = null;
      }
      
      const state = get();
      if (state.timerStartTime) {
        const elapsedTime = Date.now() - state.timerStartTime;
        set({
          timerActive: false,
          timerDuration: Math.max(0, state.timerDuration - elapsedTime)
        });
      }
    },
    
    resetTimer: () => {
      // 타이머 자동 종료 이벤트 취소
      if ((window as any).__timerTimeout) {
        clearTimeout((window as any).__timerTimeout);
        (window as any).__timerTimeout = null;
      }
      
      set({
        timerStartTime: null,
        timerDuration: TIMER_DURATION_MS,
        timerActive: false,
        finalVerdictRequested: false
      });
    },
    
    getTimeLeft: () => {
      const state = get();
      if (!state.timerActive || !state.timerStartTime) {
        return state.timerDuration / 1000; // 초 단위로 반환
      }
      
      const elapsedTime = Date.now() - state.timerStartTime;
      const timeLeft = Math.max(0, state.timerDuration - elapsedTime);
      
      // 시간이 0에 가까워지면 자동으로 최종 판결 요청 (호스트인 경우에만)
      if (timeLeft <= 100 && state.timerActive && !state.finalVerdictRequested && state.isHost) {
        console.log('타이머 종료 감지 (getTimeLeft): 최종 판결 요청');
        state.onTimerEnd();
      }
      
      return Math.ceil(timeLeft / 1000); // 초 단위로 반환, 올림
    },
    
    timeSinceLastIntervention: () => {
      const state = get();
      const interventions = state.judgeInterventions;
      
      if (interventions.length === 0) {
        return Number.MAX_SAFE_INTEGER; // 개입이 없었으면 매우 큰 값 반환
      }
      
      const lastIntervention = interventions[interventions.length - 1];
      const lastTime = new Date(lastIntervention.timestamp).getTime();
      return Date.now() - lastTime;
    },
    
    onTimerEnd: () => {
      // 타이머가 끝나면 자동으로 최종 판결 요청
      const state = get();
      
      // 이미 최종 판결이 요청되었거나 타이머가 비활성 상태인지 확인
      if (state.finalVerdictRequested || !state.timerActive) {
        console.log('타이머 종료 핸들러: 이미 최종 판결이 요청되었거나 타이머가 비활성 상태입니다.');
        return;
      }
      
      // 호스트가 아니면 최종 판결 요청하지 않음
      if (!state.isHost) {
        console.log('호스트가 아닌 사용자의 타이머 종료 이벤트: 최종 판결 요청 건너뜀');
        return;
      }
      
      console.log('타이머 종료: 최종 판결 요청');
      
      // 타이머 자동 종료 이벤트 취소 (필요시)
      if ((window as any).__timerTimeout) {
        clearTimeout((window as any).__timerTimeout);
        (window as any).__timerTimeout = null;
      }
      
      // 최종 판결 요청
      state.requestFinalVerdict();
    },
    
    // 판사 분석 요청
    requestJudgeAnalysis: async (isFinal?: boolean, showMessage?: boolean) => {
      const state = get();
      const currentMessages = state.messages;
      
      // Don't do anything if final verdict has already been requested
      if (state.finalVerdictRequested) {
        console.log('Final verdict already requested, skipping analysis');
        return;
      }
      
      // 중복 요청 방지 및 최소 간격 확인
      const currentTime = Date.now();
      if (state.isLoading || (!isFinal && currentTime - lastAnalysisTime < 2000)) {
        console.log('분석 요청 무시: 이미 로딩 중이거나 최소 간격 미달');
        return;
      }
      
      set({ isLoading: true });
      lastAnalysisTime = currentTime;
      
      // 캐시 키 생성 (최근 3개 메시지의 해시)
      const recentMessages = currentMessages.slice(-3).map(m => m.text).join('|');
      
      // 한글 등 유니코드 문자를 안전하게 인코딩하는 함수
      const safeEncode = (str: string): string => {
        try {
          // encodeURIComponent로 먼저 변환 후 btoa 적용
          return btoa(encodeURIComponent(str));
        } catch (e) {
          // 여전히 오류 발생 시 MD5와 같은 해시 대신 간단한 해시 생성
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
          }
          return Math.abs(hash).toString(36); // 기수 36으로 문자열 변환 (0-9, a-z)
        }
      };
      
      const cacheKey = safeEncode(recentMessages).substring(0, 50);
      
      try {
        // Check again for verdict requested to prevent race conditions
        if (get().finalVerdictRequested) {
          console.log('Final verdict requested during analysis, aborting');
          set({ isLoading: false });
          return;
        }
        
        // 캐시 확인
        if (responseCache[cacheKey] && 
            (currentTime - responseCache[cacheKey].timestamp) < CACHE_EXPIRY) {
          console.log('캐시된 응답 사용');
          const cachedData = responseCache[cacheKey].interventionData;
          
          // 캐시된 응답 사용 (빠른 응답)
          if (cachedData.shouldIntervene && cachedData.interventionType && cachedData.interventionMessage) {
            // One more check before showing any messages
            if (get().finalVerdictRequested) {
              console.log('Final verdict requested while preparing cached response, aborting');
              set({ isLoading: false });
              return;
            }
            
            // 로딩 상태 해제 약간 지연 (너무 빠르면 부자연스러움)
            setTimeout(() => {
              // Final check before actually adding the message
              if (get().finalVerdictRequested) {
                console.log('Final verdict requested before timeout completed, aborting');
                set({ isLoading: false });
                return;
              }
              
              state.addJudgeIntervention(
                cachedData.interventionType!,
                cachedData.interventionMessage!,
                cachedData.targetUser
              );
              
              // 쟁점 업데이트
              if (cachedData.detectedIssues && cachedData.detectedIssues.length > 0) {
                state.updateDetectedIssues(cachedData.detectedIssues);
              }
              
              // 메시지 추가
              state.addMessage({
                user: 'judge',
                name: '판사',
                text: cachedData.interventionMessage!
              });
              
              set({ isLoading: false });
            }, 500);
            return;
          }
        }
        
        // 실제 API 호출 (캐시 없을 때)
        console.log('Gemini API 호출 시작');
        
        // Check again before showing any messages
        if (get().finalVerdictRequested) {
          console.log('Final verdict requested before showing loading message, aborting');
          set({ isLoading: false });
          return;
        }
        
        // Only show the loading message if showMessage parameter is true
        // By default in final analysis or when explicitly requested
        if (showMessage || isFinal) {
          // 즉시 로딩 메시지 표시
          state.addMessage({
            user: 'system',
            name: '시스템',
            text: '판사가 상황을 분석 중입니다...'
          });
        }
        
        // One final check before API call
        if (get().finalVerdictRequested) {
          console.log('Final verdict requested before API call, aborting');
          set({ isLoading: false });
          return;
        }
        
        const result = await analyzeConversation(
          state.messages as GeminiMessage[],
          state.judgeInterventions,
          state.detectedIssues
        );
        
        // Check again after API call
        if (get().finalVerdictRequested) {
          console.log('Final verdict requested after API call, aborting message display');
          set({ isLoading: false });
          return;
        }
        
        // 결과 캐시 저장
        responseCache[cacheKey] = {
          timestamp: currentTime,
          interventionData: result
        };
        
        // 개입이 필요하다면 판사 메시지 추가
        if (result.shouldIntervene && result.interventionType && result.interventionMessage) {
          // Final check before adding message
          if (get().finalVerdictRequested) {
            console.log('Final verdict requested before adding intervention, aborting');
            set({ isLoading: false });
            return;
          }
          
          // 판사 개입 기록
          state.addJudgeIntervention(
            result.interventionType,
            result.interventionMessage,
            result.targetUser
          );
          
          // 판사 메시지 추가
          const judgeMessage: Omit<Message, 'id' | 'timestamp'> = {
            user: 'judge',
            name: '판사',
            text: result.interventionMessage
          };
          
          // 쟁점 업데이트
          if (result.detectedIssues && result.detectedIssues.length > 0) {
            state.updateDetectedIssues(result.detectedIssues);
          }
          
          await state.addMessage(judgeMessage);
        }
        
        // Don't set up a new preload if final verdict requested
        if (get().finalVerdictRequested) {
          console.log('Final verdict requested, skipping preload setup');
          set({ isLoading: false });
          return;
        }
        
        // 백그라운드 사전 로딩 설정 (다음 호출을 빠르게 하기 위해)
        if (preloadTimer) {
          clearTimeout(preloadTimer);
        }
        
        preloadTimer = setTimeout(() => {
          // Check before starting preload
          if (get().finalVerdictRequested) {
            console.log('Final verdict requested, skipping preload');
            return;
          }
          
          console.log('백그라운드 분석 사전 로드');
          // 백그라운드에서 미리 분석 수행 (결과는 캐시만 하고 UI에 표시 안 함)
          analyzeConversation(
            get().messages as GeminiMessage[], 
            get().judgeInterventions,
            get().detectedIssues
          ).then(preloadResult => {
            // Skip caching if verdict has been requested
            if (get().finalVerdictRequested) {
              console.log('Final verdict requested, skipping preload caching');
              return;
            }
            
            const preloadMessages = get().messages.slice(-3).map(m => m.text).join('|');
            const preloadCacheKey = safeEncode(preloadMessages).substring(0, 50);
            responseCache[preloadCacheKey] = {
              timestamp: Date.now(),
              interventionData: preloadResult
            };
            console.log('백그라운드 분석 캐시 완료');
          }).catch(error => {
            console.error('백그라운드 분석 오류:', error);
          });
        }, PRELOAD_INTERVAL);
        
        set({ isLoading: false });
      } catch (error) {
        console.error('판사 분석 오류:', error);
        set({ 
          isLoading: false,
          error: '판사 분석 중 오류가 발생했습니다.'
        });
      }
    },
    
    // 판사 개입 기록
    addJudgeIntervention: (type, text, targetUser) => {
      const newIntervention: JudgeIntervention = {
        id: uuidv4(),
        type,
        text,
        timestamp: new Date().toISOString(),
        targetUser
      };
      
      set(state => ({
        judgeInterventions: [...state.judgeInterventions, newIntervention]
      }));
    },
    
    // 감지된 쟁점 업데이트
    updateDetectedIssues: (issues) => {
      // 중복 제거하며 추가
      set(state => {
        const currentIssues = new Set(state.detectedIssues);
        issues.forEach(issue => currentIssues.add(issue));
        return { detectedIssues: Array.from(currentIssues) };
      });
    },
    
    // 최종 판결 요청
    requestFinalVerdict: async () => {
      console.log('requestFinalVerdict 함수 호출됨');
      
      // 이미 최종 판결이 요청되었으면 중복 요청 방지
      if (get().finalVerdictRequested || !get().timerActive) {
        console.log('이미 최종 판결이 요청되었거나 타이머가 비활성 상태입니다.');
        return;
      }
      
      // 호스트가 아니면 최종 판결 요청 무시
      if (!get().isHost) {
        console.log('호스트가 아닌 사용자의 최종 판결 요청 무시');
        return;
      }
      
      // 최종 판결 요청 플래그 설정 - 다른 호출이 진행되는 것을 즉시 방지
      set({ 
        isLoading: true,
        finalVerdictRequested: true
      });
      
      try {
        const state = get();
        console.log('현재 메시지 수:', state.messages.length);
        
        // 타이머 중지
        state.pauseTimer();
        console.log('타이머 상태 중지됨');
        
        // Firebase에 판결 상태 업데이트
        if (verdictStatusRef && db) {
          try {
            await firebaseSet(verdictStatusRef, { 
              finalVerdictRequested: true,
              requestedAt: new Date().toISOString()
            });
            console.log('Firebase 판결 상태 업데이트 완료');
          } catch (firebaseError) {
            console.error('Firebase 판결 상태 업데이트 실패:', firebaseError);
            // 실패해도 계속 진행
          }
        }
        
        // 모든 클라이언트에게 판결 진행 중임을 알리는 시스템 메시지 추가
        await state.addMessage({
          user: 'system',
          name: '시스템',
          text: '최종 판결을 진행 중입니다...'
        });
        
        // 최종 판결 요청
        console.log('getFinalVerdict API 호출 시작');
        const verdict = await getFinalVerdict(
          state.messages as GeminiMessage[],
          state.detectedIssues
        );
        console.log('getFinalVerdict API 호출 완료:', verdict);
        
        // 판결 메시지 추가
        if (verdict.verdict && verdict.verdict.summary) {
          console.log('최종 판결 메시지 추가 중');
          
          try {
            const verdictMessage: Omit<Message, 'id' | 'timestamp'> = {
              user: 'judge',
              name: '판사',
              text: `## 최종 판결\n\n${verdict.verdict.summary}\n\n${verdict.verdict.conflict_root_cause || ''}\n\n${verdict.verdict.recommendation || ''}`,
              messageType: 'closing'
            };
            
            // 판사 개입 기록
            state.addJudgeIntervention(
              'verdict',
              verdict.verdict.summary,
            );
            
            // 메시지를 Firebase에 추가하여 모든 클라이언트에게 전파
            await state.addMessage(verdictMessage);
            console.log('최종 판결 메시지 추가 완료');
          } catch (messageError) {
            console.error('판결 메시지 추가 중 오류:', messageError);
            // 오류 발생 시 더 단순한 메시지로 다시 시도
            try {
              await state.addMessage({
                user: 'judge',
                name: '판사',
                text: `## 최종 판결\n\n${verdict.verdict.summary}`,
                messageType: 'closing'
              });
            } catch (retryError) {
              console.error('간소화된 판결 메시지 추가 중 오류:', retryError);
            }
          }
        } else {
          console.error('판결 데이터가 올바르지 않음:', verdict);
          
          // 판결 데이터 오류 시 기본 메시지 추가
          await state.addMessage({
            user: 'judge',
            name: '판사',
            text: '최종 판결을 생성하는 중 오류가 발생했습니다.',
            messageType: 'closing'
          });
        }
        
        set({ isLoading: false });
      } catch (error) {
        console.error('최종 판결 오류:', error);
        
        // 오류 발생 시 기본 메시지 추가
        try {
          await get().addMessage({
            user: 'judge',
            name: '판사',
            text: '최종 판결을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            messageType: 'closing'
          });
        } catch (msgError) {
          console.error('오류 메시지 추가 실패:', msgError);
        }
        
        set({ 
          isLoading: false,
          error: '최종 판결 중 오류가 발생했습니다.'
        });
      }
    },
    
    // 대화 초기화
    clearChat: () => {
      set({
        messages: [],
        judgeInterventions: [],
        detectedIssues: [],
        timerStartTime: null,
        timerDuration: TIMER_DURATION_MS,
        timerActive: false,
        finalVerdictRequested: false,
        error: null,
        isHost: false
      });
    },

    // 사용자 욕설 레벨 업데이트
    updateUserCurseLevel: (userId: string, increment: number) => {
      set(state => {
        const currentLevel = state.userCurseLevels[userId] || 0;
        // 최대 레벨을 30으로 증가 (욕설이 많으면 점수가 더 높게 누적될 수 있음)
        const newLevel = Math.min(30, Math.max(0, currentLevel + increment));
        
        return {
          userCurseLevels: {
            ...state.userCurseLevels,
            [userId]: newLevel
          }
        };
      });
    },
    
    // 사용자 욕설 레벨 조회
    getUserCurseLevel: (userId: string) => {
      return get().userCurseLevels[userId] || 0;
    },
  };
});
