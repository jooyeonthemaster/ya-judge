import { useState, useEffect, useRef } from 'react';
import { ref, onValue, set, remove, off, get, onDisconnect } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useChatStore } from '@/store/chatStore';
import { 
  getTimerDuration, 
  formatRemainingTime, 
  TimerState, 
  TimerData 
} from '@/lib/timerConfig';
import { Message } from '@/types/chat';

interface UseCourtTimerProps {
  roomId: string | null;
  isRoomHost: boolean;
  onTimerComplete: () => void;
  addMessage: (message: Message) => void;
}

interface UseCourtTimerReturn {
  // 타이머 상태
  timerActive: boolean;
  timerState: TimerState;
  remainingTime: number;
  remainingTimeFormatted: string;
  timerStartTime: Date | null;
  timerDuration: number;
  finalVerdictTriggered: boolean;
  apiCallsEnabled: boolean;
  timerPaused: boolean;
  
  // 타이머 제어 함수들
  startTimerMode: () => void;
  pauseTimerMode: () => void;
  resumeTimerMode: () => void;
  resetTimerMode: () => void;
  setFinalVerdictTriggered: (value: boolean) => void;
  setApiCallsEnabled: (value: boolean) => void;
}

export function useCourtTimer({ 
  roomId, 
  isRoomHost, 
  onTimerComplete,
  addMessage 
}: UseCourtTimerProps): UseCourtTimerReturn {
  
  const { 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    timerActive, 
    requestFinalVerdict 
  } = useChatStore();
  
  // Timer pause state from store
  const timerPaused = useChatStore(state => state.timerPaused);
  
  // 타이머 상태
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState(getTimerDuration());
  const [remainingTime, setRemainingTime] = useState(getTimerDuration());
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [finalVerdictTriggered, setFinalVerdictTriggered] = useState(false);
  const [apiCallsEnabled, setApiCallsEnabled] = useState(true);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0);
  const [currentPauseStartTime, setCurrentPauseStartTime] = useState<Date | null>(null);

  // 남은 시간 포맷팅
  const remainingTimeFormatted = formatRemainingTime(remainingTime);

  // 타이머 모드 시작
  const startTimerMode = () => {
    // 상태 초기화
    setFinalVerdictTriggered(false);
    setApiCallsEnabled(true);
    
    // 시작 시간 설정
    const startTime = new Date();
    setTimerStartTime(startTime);
    setTimerState('running');
    
    // 로컬 타이머 시작
    startTimer();
    
    // 남은 시간 초기화
    setRemainingTime(timerDuration);
    
    // Firebase에 타이머 시작 상태 저장
    if (roomId && database) {
      const timerRef = ref(database, `rooms/${roomId}/timer`);
      const timerData: TimerData = {
        active: true,
        startTime: startTime.toISOString(),
        durationSeconds: timerDuration,
        completed: false,
        reset: false
      };
      set(timerRef, timerData);
      
      // 이전 판결 상태 제거
      const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
      remove(verdictStatusRef);
      
      // 준비 상태 제거
      const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
      remove(trialReadyRef);
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

  // 타이머 모드 일시정지
  const pauseTimerMode = () => {
    if (!roomId || !database) return;
    
    // 현재 일시정지 시작 시간 기록
    const pauseStartTime = new Date();
    setCurrentPauseStartTime(pauseStartTime);
    
    // 로컬 타이머 일시정지
    pauseTimer();
    setTimerState('paused');
    
    // Firebase에 일시정지 상태 저장
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    const timerData: TimerData = {
      active: true,
      paused: true,
      pausedAt: pauseStartTime.toISOString(),
      startTime: timerStartTime?.toISOString(),
      totalPausedDuration: totalPausedDuration,
      durationSeconds: timerDuration
    };
    set(timerRef, timerData);
    
    // 일시정지 메시지 추가
    addMessage({
      user: 'system',
      name: '시스템',
      text: '타이머가 일시정지되었습니다.',
      roomId: roomId || ''
    });
  };

  // 타이머 모드 재개
  const resumeTimerMode = () => {
    if (!roomId || !database) return;
    
    // 일시정지 기간 계산 및 누적
    if (currentPauseStartTime) {
      const pauseDuration = Math.floor((new Date().getTime() - currentPauseStartTime.getTime()) / 1000);
      const newTotalPausedDuration = totalPausedDuration + pauseDuration;
      setTotalPausedDuration(newTotalPausedDuration);
      setCurrentPauseStartTime(null);
      
      // 로컬 타이머 재개
      resumeTimer();
      setTimerState('running');
      
      // Firebase에 재개 상태 저장 (누적 일시정지 시간 포함)
      const timerRef = ref(database, `rooms/${roomId}/timer`);
      const timerData: TimerData = {
        active: true,
        paused: false,
        resumedAt: new Date().toISOString(),
        startTime: timerStartTime?.toISOString(),
        totalPausedDuration: newTotalPausedDuration,
        durationSeconds: timerDuration
      };
      set(timerRef, timerData);
      
      // 재개 메시지 추가
      addMessage({
        user: 'system',
        name: '시스템',
        text: '타이머가 재개되었습니다.',
        roomId: roomId || ''
      });
    }
  };

  // 타이머 모드 리셋
  const resetTimerMode = () => {
    setFinalVerdictTriggered(false);
    setApiCallsEnabled(true);
    setTimerState('idle');
    setTotalPausedDuration(0);
    setCurrentPauseStartTime(null);
    resetTimer();
    setRemainingTime(getTimerDuration());
    
    // Firebase에서 타이머 리셋
    if (roomId && database) {
      const timerRef = ref(database, `rooms/${roomId}/timer`);
      set(timerRef, {
        active: false,
        completed: false,
        reset: true,
        resetAt: new Date().toISOString()
      });
    }
  };

  // 로컬 타이머 업데이트 (매초)
  useEffect(() => {
    if (!timerActive || !timerStartTime) return;
    
    const timerInterval = setInterval(() => {
      // 타이머가 일시정지 상태인 경우 업데이트하지 않음
      if (timerPaused) return;
      
      const now = new Date();
      // 일시정지 시간을 고려한 정확한 경과 시간 계산
      let currentTotalPausedDuration = totalPausedDuration;
      if (currentPauseStartTime) {
        // 현재 일시정지 중이면 현재까지의 일시정지 시간도 포함
        currentTotalPausedDuration += Math.floor((now.getTime() - currentPauseStartTime.getTime()) / 1000);
      }
      
      const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000) - currentTotalPausedDuration;
      const remaining = Math.max(0, timerDuration - elapsed);
      
      setRemainingTime(remaining);
      
      // 타이머 완료 체크
      if (remaining <= 0 && timerState !== 'completed' && !finalVerdictTriggered) {
        setTimerState('completed');
        clearInterval(timerInterval);
        
        // 타이머 완료 메시지
        addMessage({
          user: 'system',
          name: '시스템',
          text: '재판 시간이 종료되었습니다. 판사가 최종 판결을 내립니다.',
          roomId: roomId || ''
        });
        
        // Firebase 업데이트
        if (roomId && database) {
          const timerRef = ref(database, `rooms/${roomId}/timer`);
          const timerData: TimerData = {
            active: false,
            completed: true,
            completedAt: new Date().toISOString(),
            endReason: 'time_expired',
            totalPausedDuration: currentTotalPausedDuration,
            durationSeconds: timerDuration
          };
          set(timerRef, timerData);
          
          addMessage({
            user: 'system',
            name: '시스템',
            text: '판사가 상황을 분석 중입니다...',
            roomId: roomId || ''
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [timerActive, timerPaused, timerStartTime, timerDuration, timerState, totalPausedDuration, currentPauseStartTime, roomId, database, addMessage, finalVerdictTriggered]);

  // 서버 타이머 상태 동기화
  useEffect(() => {
    if (!roomId || !database) return;
    
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    
    const timerListener = onValue(timerRef, (snapshot) => {
      const timerData = snapshot.val() as TimerData | null;
      
      if (!timerData) return;
      
      // 타이머 리셋 처리
      if (timerData.reset === true) {
        console.log('Timer reset by host, syncing client state...');
        
        setFinalVerdictTriggered(false);
        setApiCallsEnabled(true);
        setTimerState('idle');
        resetTimer();
        setRemainingTime(getTimerDuration());
        
        return;
      }
      
      // 타이머 활성화 동기화
      if (timerData.active && !timerActive) {
        console.log('Timer started by another participant, syncing...');
        startTimer();
        
        if (timerData.startTime) {
          setTimerStartTime(new Date(timerData.startTime));
        }
        
        if (timerData.durationSeconds) {
          setTimerDuration(timerData.durationSeconds);
        }
        
        // 누적 일시정지 시간 동기화
        if (timerData.totalPausedDuration !== undefined) {
          setTotalPausedDuration(timerData.totalPausedDuration);
        }
        
        // Check if timer is paused
        if (timerData.paused) {
          setTimerState('paused');
          pauseTimer();
          if (timerData.pausedAt) {
            setCurrentPauseStartTime(new Date(timerData.pausedAt));
          }
        } else {
          setTimerState('running');
          setCurrentPauseStartTime(null);
        }
      }
      
      // 타이머 일시정지/재개 동기화
      if (timerData.active && timerActive) {
        // 누적 일시정지 시간 동기화
        if (timerData.totalPausedDuration !== undefined) {
          setTotalPausedDuration(timerData.totalPausedDuration);
        }
        
        if (timerData.paused && !timerPaused) {
          console.log('Timer paused by another participant, syncing...');
          pauseTimer();
          setTimerState('paused');
          if (timerData.pausedAt) {
            setCurrentPauseStartTime(new Date(timerData.pausedAt));
          }
        } else if (!timerData.paused && timerPaused) {
          console.log('Timer resumed by another participant, syncing...');
          resumeTimer();
          setTimerState('running');
          setCurrentPauseStartTime(null);
        }
      }
      
      // 타이머 완료 처리
      if (timerData.completed && timerState !== 'completed' && !finalVerdictTriggered && apiCallsEnabled) {
        console.log('Timer completed signal received from server', timerData.endReason);
        
        setTimerState('completed');
        setRemainingTime(0);
        
        if (timerData.endReason === 'aggressive_language') {
          addMessage({
            user: 'system',
            name: '시스템',
            text: '공격적인 언어가 감지되어 경고합니다. 상대를 존중하는 언어를 사용해주세요.',
            roomId: roomId || ''
          });
          
          return;
        } else {
          setFinalVerdictTriggered(true);
          setApiCallsEnabled(false);
          
          if (!timerData.messagesSent) {
            addMessage({
              user: 'system',
              name: '시스템',
              text: '재판 시간이 종료되었습니다. 판사가 최종 판결을 내립니다.',
              roomId: roomId || ''
            });
            
            addMessage({
              user: 'system',
              name: '시스템',
              text: '판사가 상황을 분석 중입니다...',
              roomId: roomId || ''
            });
            
            if (database) {
              const updatedTimerRef = ref(database, `rooms/${roomId}/timer`);
              const updatedTimerData: TimerData = {
                ...timerData,
                messagesSent: true
              };
              set(updatedTimerRef, updatedTimerData);
            }
          }
          
          // 호스트만 최종 판결 요청
          if (isRoomHost) {
            console.log('Host is calling requestFinalVerdict ONE TIME ONLY');
            requestFinalVerdict();
            
            if (database) {
              const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
              remove(trialReadyRef);
              
              const readyRef = ref(database, `rooms/${roomId}/ready`);
              remove(readyRef);
              
              const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
              set(verdictStatusRef, {
                inProgress: true,
                startedAt: new Date().toISOString()
              });
            }
          }
        }
      }
    });
    
    return () => {
      off(timerRef);
    };
  }, [roomId, database, timerActive, timerPaused, timerState, startTimer, pauseTimer, resumeTimer, requestFinalVerdict, addMessage, finalVerdictTriggered, apiCallsEnabled, isRoomHost]);

  // 기존 타이머 동기화 (방 참여 시)
  useEffect(() => {
    if (!roomId || !database) return;
    
    const checkExistingTimer = async () => {
      try {
        if (!database) return;
        
        const timerRef = ref(database, `rooms/${roomId}/timer`);
        const snapshot = await get(timerRef);
        const timerData = snapshot.val();
        
        if (timerData && timerData.active) {
          console.log('Room has active timer, synchronizing...');
          
          if (timerData.startTime) {
            const startTime = new Date(timerData.startTime);
            setTimerStartTime(startTime);
            
            if (timerData.durationSeconds) {
              setTimerDuration(timerData.durationSeconds);
            }
            
            // 누적 일시정지 시간 동기화
            const serverTotalPausedDuration = timerData.totalPausedDuration || 0;
            setTotalPausedDuration(serverTotalPausedDuration);
            
            const now = new Date();
            // 일시정지 시간을 고려한 정확한 남은 시간 계산
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) - serverTotalPausedDuration;
            const remaining = Math.max(0, timerDuration - elapsed);
            
            if (remaining > 0) {
              startTimer();
              
              // 일시정지 상태 확인
              if (timerData.paused) {
                setTimerState('paused');
                pauseTimer();
                if (timerData.pausedAt) {
                  setCurrentPauseStartTime(new Date(timerData.pausedAt));
                }
              } else {
                setTimerState('running');
                setCurrentPauseStartTime(null);
              }
              
              setRemainingTime(remaining);
            } else if (timerData.completed) {
              setTimerState('completed');
            }
          }
        }
      } catch (error) {
        console.error('Timer sync error:', error);
      }
    };
    
    checkExistingTimer();
  }, [roomId, database, timerDuration, startTimer]);

  return {
    // 타이머 상태
    timerActive,
    timerState,
    remainingTime,
    remainingTimeFormatted,
    timerStartTime,
    timerDuration,
    finalVerdictTriggered,
    apiCallsEnabled,
    timerPaused,
    
    // 타이머 제어 함수들
    startTimerMode,
    pauseTimerMode,
    resumeTimerMode,
    resetTimerMode,
    setFinalVerdictTriggered,
    setApiCallsEnabled
  };
} 