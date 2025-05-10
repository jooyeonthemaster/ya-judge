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

// 재판 단계 정의
export type CourtStage = 
  'waiting' |     // 재판 시작 전 대기
  'intro' |       // 재판 소개
  'opening' |     // 모두 진술
  'issues' |      // 쟁점 정리
  'discussion' |  // 쟁점별 토론
  'questions' |   // 판사 질문
  'closing' |     // 최종 변론
  'verdict' |     // 판결
  'appeal';       // 항소

// 단계별 설정
export interface StageConfig {
  title: string;         // 단계 제목
  description: string;   // 단계 설명
  duration: number;      // 지속 시간(초)
  judgePrompt: string;   // 판사 프롬프트
}

// 단계별 설정 정의
export const STAGE_CONFIGS: Record<CourtStage, StageConfig> = {
  waiting: {
    title: '재판 대기',
    description: '참여자들이 모이고 있습니다. 자유롭게 대화하세요.',
    duration: 0, // 무제한
    judgePrompt: '아직 재판이 시작되지 않았습니다. 참여자들이 모이면 재판을 시작할 수 있습니다.'
  },
  intro: {
    title: '재판 소개',
    description: 'AI 판사가 재판의 진행 방식을 설명합니다.',
    duration: 60, // 1분
    judgePrompt: '재판의 진행 방식과 규칙을 설명하고, 참여자들에게 공정한 토론을 당부하세요.'
  },
  opening: {
    title: '모두 진술',
    description: '각 참여자가 자신의 입장에서 상황을 설명합니다.',
    duration: 300, // 5분
    judgePrompt: '각 참여자의 모두 진술을 듣고, 그들의 주장과 입장을 명확하게 파악하세요. 진술이 끝나면 핵심 쟁점을 추출하세요.'
  },
  issues: {
    title: '쟁점 정리',
    description: 'AI 판사가 사건의 핵심 쟁점을 정리합니다.',
    duration: 60, // 1분
    judgePrompt: '지금까지의 진술을 바탕으로 이 사건의 핵심 쟁점 3-5개를 추출하고 명확하게 설명하세요.'
  },
  discussion: {
    title: '쟁점별 토론',
    description: '각 쟁점에 대해 차례대로 토론합니다.',
    duration: 240, // 4분
    judgePrompt: '현재 쟁점에 대한 양측의 주장을 듣고, 필요시 증거를 요청하세요. 토론 내용을 요약하고 다음 쟁점으로 넘어가세요.'
  },
  questions: {
    title: '판사 질문',
    description: 'AI 판사가 추가 질문을 합니다.',
    duration: 180, // 3분
    judgePrompt: '불명확한 부분이나 추가 정보가 필요한 부분에 대해 참여자들에게 구체적인 질문을 하세요.'
  },
  closing: {
    title: '최종 변론',
    description: '각 참여자가 최종 변론을 합니다.',
    duration: 120, // 2분
    judgePrompt: '각 참여자에게 최종 변론 기회를 주고, 그들의 핵심 주장을 요약하세요.'
  },
  verdict: {
    title: '판결',
    description: 'AI 판사가 최종 판결을 내립니다.',
    duration: 0, // 무제한
    judgePrompt: '모든 주장과 증거를 종합적으로 분석하여 공정한 판결을 내리세요. 각 쟁점별 판단과 책임 비율을 명확히 하고, 각 참여자에게 맞춤형 판결문을 작성하세요.'
  },
  appeal: {
    title: '항소',
    description: '판결에 불복하여 항소를 진행합니다.',
    duration: 0, // 무제한
    judgePrompt: '항소 이유를 검토하고, 1심 판결의 문제점을 분석하세요. 필요시 새로운 증거나 주장을 고려하여 최종 판결을 내리세요.'
  }
};

export interface Message {
  id: string;
  user: 'user-a' | 'user-b' | 'user-general' | 'judge' | 'system';
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
  stage?: CourtStage; // 작성된 단계
}

// 재판 관련 상태 인터페이스
export interface CourtState {
  stage: CourtStage;                  // 현재 단계
  stageStartTime: number;             // 단계 시작 시간 (타임스탬프)
  stageTimeLeft: number;              // 남은 시간 (초)
  stageTimerActive: boolean;          // 타이머 활성화 여부
  issues: string[];                   // 쟁점 목록
  currentIssueIndex: number;          // 현재 토론 중인 쟁점 인덱스
  evidenceRequests: Array<{          // 증거 요청 목록
    id: string;
    targetUser: string;
    claim: string;
    requestReason: string;
    fulfilled: boolean;
  }>;
  verdictData: any | null;            // 판결 데이터
  appealRequested: boolean;           // 항소 요청 여부
  appealReason: string;               // 항소 이유
  readyParticipants: Record<string, boolean>; // 참가자 준비 상태 - 추가된 필드
}

interface ChatState {
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
  
  // 재판 관련 상태
  court: CourtState;
  
  // 메서드들
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStats: (partial: Partial<ChatState['stats']>) => void;
  setCurrentUser: (user: 'user-a' | 'user-b' | null) => void;
  clearMessages: () => void;
  setRoomUsers: (users: Array<{ id: string; username: string }>) => void;
  setTypingStatus: (userId: string, username: string, isTyping: boolean) => void;
  joinRoom: (roomId: string, username: string) => void;
  leaveRoom: () => void;
  
  // 재판 관련 메서드
  startCourt: () => void;                              // 재판 시작
  moveToNextStage: () => void;                         // 다음 단계로 이동
  setStage: (stage: CourtStage) => void;               // 특정 단계로 이동
  toggleStageTimer: (active: boolean) => void;         // 타이머 활성화/비활성화
  setIssues: (issues: string[]) => void;               // 쟁점 설정
  moveToNextIssue: () => void;                         // 다음 쟁점으로 이동
  setCurrentIssue: (index: number) => void;            // 특정 쟁점으로 이동
  addEvidenceRequest: (request: Omit<CourtState['evidenceRequests'][0], 'id' | 'fulfilled'>) => void; // 증거 요청 추가
  fulfillEvidenceRequest: (id: string) => void;        // 증거 요청 이행
  setVerdict: (data: any) => void;                     // 판결 설정
  requestAppeal: (reason: string) => void;             // 항소 요청
  
  // 새로 추가된 메서드
  setParticipantReady: (userId: string, isReady: boolean) => void;  // 참가자 준비 상태 설정
  isAllParticipantsReady: () => boolean;                           // 모든 참가자가 준비되었는지 확인
  getReadyParticipants: () => Record<string, boolean>;             // 준비된 참가자 목록 반환
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
    // 재판 초기 상태
    court: {
      stage: 'waiting' as CourtStage,
      stageStartTime: 0,
      stageTimeLeft: 0,
      stageTimerActive: false,
      issues: [],
      currentIssueIndex: 0,
      evidenceRequests: [],
      verdictData: null,
      appealRequested: false,
      appealReason: '',
      readyParticipants: {} // 추가된 필드
    },
  };

  // 방 참여 상태 관리
  let currentRoomRef: DatabaseReference | null = null;
  let roomUsersRef: DatabaseReference | null = null;
  let typingRef: DatabaseReference | null = null;
  let currentUserId: string = '';
  let db = database as Database | undefined;
  
  // 재판 관련 메서드들
  const courtMethods = {
    // 재판 시작
    startCourt: () => {
      if (!db || !currentRoomRef) {
        console.error('Cannot start court - database or room reference not initialized');
        return;
      }
      
      set(state => ({
        court: {
          ...state.court,
          stage: 'intro',
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS.intro.duration,
          stageTimerActive: true
        }
      }));
      
      // Firebase에 재판 상태 저장
      if (currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/messages
        const courtRef = ref(db, `rooms/${roomId}/court`);
        firebaseSet(courtRef, {
          stage: 'intro',
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS.intro.duration,
          stageTimerActive: true
        });
      }
      
      // 재판 시작 메시지 추가
      get().addMessage({
        user: 'judge',
        name: '판사',
        text: '재판을 시작합니다. 각 참여자는 판사의 안내에 따라주세요.',
        roomId: currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2]
      });
    },
    
    // 다음 단계로 이동
    moveToNextStage: () => {
      const currentState = get();
      const currentStage = currentState.court.stage;
      
      // 단계 순서 정의
      const stageOrder: CourtStage[] = [
        'waiting', 'intro', 'opening', 'issues', 'discussion', 
        'questions', 'closing', 'verdict', 'appeal'
      ];
      
      // 현재 단계 인덱스 찾기
      const currentIndex = stageOrder.indexOf(currentStage);
      if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
        console.error('Invalid stage or already at the last stage');
        return;
      }
      
      // 다음 단계 계산
      const nextStage = stageOrder[currentIndex + 1];
      
      // 단계 업데이트
      set(state => ({
        court: {
          ...state.court,
          stage: nextStage,
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS[nextStage].duration,
          stageTimerActive: STAGE_CONFIGS[nextStage].duration > 0
        }
      }));
      
      // Firebase에 재판 상태 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const courtRef = ref(db, `rooms/${roomId}/court`);
        firebaseSet(courtRef, {
          stage: nextStage,
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS[nextStage].duration,
          stageTimerActive: STAGE_CONFIGS[nextStage].duration > 0
        });
      }
      
      // 단계 변경 메시지 추가
      const roomId = currentRoomRef ? currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2] : '';
      get().addMessage({
        user: 'system',
        name: '시스템',
        text: `${STAGE_CONFIGS[nextStage].title} 단계가 시작되었습니다.`,
        roomId
      });
    },
    
    // 특정 단계로 설정
    setStage: (stage: CourtStage) => {
      if (!STAGE_CONFIGS[stage]) {
        console.error('Invalid stage');
        return;
      }
      
      set(state => ({
        court: {
          ...state.court,
          stage,
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS[stage].duration,
          stageTimerActive: STAGE_CONFIGS[stage].duration > 0
        }
      }));
      
      // Firebase에 재판 상태 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const courtRef = ref(db, `rooms/${roomId}/court`);
        firebaseSet(courtRef, {
          stage,
          stageStartTime: Date.now(),
          stageTimeLeft: STAGE_CONFIGS[stage].duration,
          stageTimerActive: STAGE_CONFIGS[stage].duration > 0
        });
      }
    },
    
    // 타이머 활성화/비활성화
    toggleStageTimer: (active: boolean) => {
      set(state => ({
        court: {
          ...state.court,
          stageTimerActive: active
        }
      }));
      
      // Firebase에 타이머 상태 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const timerRef = ref(db, `rooms/${roomId}/court/stageTimerActive`);
        firebaseSet(timerRef, active);
      }
    },
    
    // 쟁점 설정
    setIssues: (issues: string[]) => {
      set(state => ({
        court: {
          ...state.court,
          issues,
          currentIssueIndex: 0
        }
      }));
      
      // Firebase에 쟁점 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const issuesRef = ref(db, `rooms/${roomId}/court/issues`);
        firebaseSet(issuesRef, issues);
      }
      
      // 쟁점 설정 메시지 추가
      const roomId = currentRoomRef ? currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2] : '';
      get().addMessage({
        user: 'judge',
        name: '판사',
        text: `다음 쟁점들에 대해 논의하겠습니다:\n${issues.map((issue, i) => `${i+1}. ${issue}`).join('\n')}`,
        roomId
      });
    },
    
    // 다음 쟁점으로 이동
    moveToNextIssue: () => {
      const currentState = get();
      const { issues, currentIssueIndex } = currentState.court;
      
      if (!issues.length || currentIssueIndex >= issues.length - 1) {
        console.error('No more issues available');
        return;
      }
      
      const nextIndex = currentIssueIndex + 1;
      
      set(state => ({
        court: {
          ...state.court,
          currentIssueIndex: nextIndex
        }
      }));
      
      // Firebase에 현재 쟁점 인덱스 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const indexRef = ref(db, `rooms/${roomId}/court/currentIssueIndex`);
        firebaseSet(indexRef, nextIndex);
      }
      
      // 쟁점 변경 메시지 추가
      const roomId = currentRoomRef ? currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2] : '';
      get().addMessage({
        user: 'judge',
        name: '판사',
        text: `다음 쟁점에 대해 논의하겠습니다: ${issues[nextIndex]}`,
        roomId
      });
    },
    
    // 특정 쟁점으로 이동
    setCurrentIssue: (index: number) => {
      const currentState = get();
      const { issues } = currentState.court;
      
      if (!issues.length || index < 0 || index >= issues.length) {
        console.error('Invalid issue index');
        return;
      }
      
      set(state => ({
        court: {
          ...state.court,
          currentIssueIndex: index
        }
      }));
      
      // Firebase에 현재 쟁점 인덱스 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const indexRef = ref(db, `rooms/${roomId}/court/currentIssueIndex`);
        firebaseSet(indexRef, index);
      }
    },
    
    // 증거 요청 추가
    addEvidenceRequest: (request: Omit<CourtState['evidenceRequests'][0], 'id' | 'fulfilled'>) => {
      const requestId = uuidv4();
      const newRequest = {
        ...request,
        id: requestId,
        fulfilled: false
      };
      
      set(state => ({
        court: {
          ...state.court,
          evidenceRequests: [...state.court.evidenceRequests, newRequest]
        }
      }));
      
      // Firebase에 증거 요청 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const requestsRef = ref(db, `rooms/${roomId}/court/evidenceRequests/${requestId}`);
        firebaseSet(requestsRef, newRequest);
      }
      
      // 증거 요청 메시지 추가
      const roomId = currentRoomRef ? currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2] : '';
      get().addMessage({
        user: 'judge',
        name: '판사',
        text: `${request.targetUser}님, 다음 주장에 대한 증거를 제출해주세요: ${request.claim}\n\n이유: ${request.requestReason}`,
        roomId
      });
    },
    
    // 증거 요청 이행
    fulfillEvidenceRequest: (id: string) => {
      const currentState = get();
      const { evidenceRequests } = currentState.court;
      
      const requestIndex = evidenceRequests.findIndex(req => req.id === id);
      if (requestIndex === -1) {
        console.error('Evidence request not found');
        return;
      }
      
      const updatedRequests = [...evidenceRequests];
      updatedRequests[requestIndex] = {
        ...updatedRequests[requestIndex],
        fulfilled: true
      };
      
      set(state => ({
        court: {
          ...state.court,
          evidenceRequests: updatedRequests
        }
      }));
      
      // Firebase에 증거 요청 상태 업데이트
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const requestRef = ref(db, `rooms/${roomId}/court/evidenceRequests/${id}/fulfilled`);
        firebaseSet(requestRef, true);
      }
    },
    
    // 판결 설정
    setVerdict: (data: any) => {
      set(state => ({
        court: {
          ...state.court,
          verdictData: data,
          stage: 'verdict'
        }
      }));
      
      // Firebase에 판결 데이터 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const verdictRef = ref(db, `rooms/${roomId}/court/verdictData`);
        firebaseSet(verdictRef, data);
      }
    },
    
    // 항소 요청
    requestAppeal: (reason: string) => {
      set(state => ({
        court: {
          ...state.court,
          appealRequested: true,
          appealReason: reason,
          stage: 'appeal'
        }
      }));
      
      // Firebase에 항소 요청 저장
      if (db && currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2];
        const appealRef = ref(db, `rooms/${roomId}/court`);
        firebaseSet(appealRef, {
          appealRequested: true,
          appealReason: reason,
          stage: 'appeal'
        });
      }
      
      // 항소 요청 메시지 추가
      const roomId = currentRoomRef ? currentRoomRef.toString().split('/')[currentRoomRef.toString().split('/').length - 2] : '';
      get().addMessage({
        user: 'system',
        name: '시스템',
        text: `항소가 요청되었습니다. 사유: ${reason}`,
        roomId
      });
    }
  };

  // 참가자 준비 상태 관련 메서드 구현
  const participantReadyMethods = {
    // 참가자 준비 상태 설정
    setParticipantReady: (userId: string, isReady: boolean) => {
      if (!db || !currentRoomRef) {
        console.error('Cannot set participant ready status - database or room reference not initialized');
        return;
      }
      
      console.log(`참가자 ${userId} 준비 상태 설정:`, isReady);
      
      // 로컬 상태 업데이트
      set(state => ({
        court: {
          ...state.court,
          readyParticipants: {
            ...state.court.readyParticipants,
            [userId]: isReady
          }
        }
      }));
      
      // Firebase에 상태 저장
      if (currentRoomRef) {
        const pathArray = currentRoomRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/messages
        const readyRef = ref(db, `rooms/${roomId}/courtReady/${userId}`);
        firebaseSet(readyRef, isReady)
          .then(() => console.log(`Firebase에 참가자 ${userId} 준비 상태 저장 성공:`, isReady))
          .catch(err => console.error(`Firebase에 참가자 ${userId} 준비 상태 저장 실패:`, err));
      }
    },
    
    // 모든 참가자가 준비되었는지 확인
    isAllParticipantsReady: () => {
      const state = get();
      const { readyParticipants } = state.court;
      const { roomUsers } = state;
      
      console.log("isAllParticipantsReady 호출됨");
      console.log("readyParticipants:", readyParticipants);
      console.log("roomUsers:", roomUsers);
      
      // 참가자가 없으면 false 반환
      if (roomUsers.length === 0) {
        console.log("참가자가 없어 false 반환");
        return false;
      }
      
      // 준비된 참가자 수 계산
      const readyCount = Object.values(readyParticipants).filter(v => Boolean(v)).length;
      console.log(`준비된 참가자 수: ${readyCount}/${roomUsers.length}`);
      
      // 방법 1: 기존 로직 - 모든 참가자가 준비되었는지 확인
      const everyoneReady = roomUsers.every(user => {
        const isReady = Boolean(readyParticipants[user.id]);
        console.log(`참가자 ${user.username}(${user.id}) 준비 상태:`, isReady);
        return isReady;
      });
      
      // 방법 2: 참가자 수와 준비된 참가자 수 비교
      const countMatch = readyCount >= roomUsers.length;
      
      // 두 방법 중 하나라도 true면 모두 준비된 것으로 판단
      const allReady = everyoneReady || countMatch;
      
      console.log("준비 상태 계산 결과:");
      console.log("- 모든 참가자 준비 여부:", everyoneReady);
      console.log("- 참가자 수/준비 수 일치 여부:", countMatch);
      console.log("최종 준비 완료 여부:", allReady);
      
      return allReady;
    },
    
    // 준비된 참가자 목록 반환
    getReadyParticipants: () => {
      return get().court.readyParticipants;
    }
  };

  return {
    ...initialState,
    ...courtMethods,
    ...participantReadyMethods,

    // 채팅방 참여
    joinRoom: (roomId: string, username: string) => {
      if (!db) {
        console.error('Firebase database is not initialized');
        return;
      }
      
      console.log(`Joining room: ${roomId} as ${username}`);
      
      // 이전 연결 정리
      if (currentRoomRef) {
        console.log('Cleaning up previous connections');
        off(currentRoomRef);
        if (roomUsersRef) off(roomUsersRef);
        if (typingRef) off(typingRef);
      }

      try {
        // 사용자 ID 생성
        currentUserId = uuidv4();
        console.log(`Generated user ID: ${currentUserId}`);
        
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
        
        // 재판 상태 구독
        const courtRef = ref(db, `rooms/${roomId}/court`);
        onValue(courtRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log('Court state updated:', data);
            
            // 단계 타이머 계산
            const now = Date.now();
            const stageStartTime = data.stageStartTime || now;
            const stageDuration = data.stage && STAGE_CONFIGS[data.stage as CourtStage] 
              ? STAGE_CONFIGS[data.stage as CourtStage].duration 
              : 0;
            
            // 남은 시간 계산 (초)
            let timeLeft = 0;
            if (stageDuration > 0) {
              const elapsedMs = now - stageStartTime;
              const elapsedSeconds = Math.floor(elapsedMs / 1000);
              timeLeft = Math.max(0, stageDuration - elapsedSeconds);
            }
            
            // 재판 상태 업데이트
            set(state => ({
              court: {
                ...state.court,
                ...data,
                stageTimeLeft: timeLeft
              }
            }));
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
        // Firebase에 undefined를 저장할 수 없으므로 undefined 값 정리
        const cleanMessage = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          messageType: message.messageType || 'normal',
          relatedIssue: message.relatedIssue || null, // undefined -> null
          stage: message.stage || null, // undefined -> null
          ...message,
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
    }
  };
});
