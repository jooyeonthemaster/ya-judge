import { useState, useEffect } from 'react';
import { ref, onValue, set, off, get, Database } from 'firebase/database';
import { database } from '@/lib/firebase';
import { 
  TimerState, 
  TimerData, 
  UseCourtTimerProps,
  Message
} from '@/types/chat';
import { getTimerDuration, formatRemainingTime } from '@/lib/timerConfig';

export function useCourtTimer({
  roomId, 
  isRoomHost, 
  onTimerComplete,
  addMessage
}: UseCourtTimerProps) {
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState(getTimerDuration());
  const [remainingTime, setRemainingTime] = useState(getTimerDuration());
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerActive, setTimerActive] = useState(false);
  const [finalVerdictTriggered, setFinalVerdictTriggered] = useState(false);

  // Start timer locally
  const startTimer = () => {
    setTimerActive(true);
  };

  // Reset timer locally
  const resetTimer = () => {
    setTimerActive(false);
    setTimerState('idle');
    setRemainingTime(getTimerDuration());
    setTimerStartTime(null);
    setFinalVerdictTriggered(false);
  };

  // Calculate time left
  const getTimeLeft = () => {
    return remainingTime;
  };

  // Start timer mode with Firebase sync
  const startTimerMode = () => {
    // Reset all verdict and trial state
    setFinalVerdictTriggered(false);
    
    // Set start time
    const startTime = new Date();
    setTimerStartTime(startTime);
    setTimerState('running');
    
    // Update local timer state
    startTimer();
    
    // Reset remaining time to full duration
    setRemainingTime(timerDuration);
    
    // Firebase에 타이머 시작 상태 저장 (다른 참가자와 동기화)
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
      
      // Also clear any verdict status that might exist
      const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
      set(verdictStatusRef, null);
      
      // Clear ready status for all clients 
      const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
      set(trialReadyRef, null);
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

  // Update the main timer logic
  useEffect(() => {
    if (!timerActive || !timerStartTime) return;
    
    // Calculate and update timer display every second
    const timerInterval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      
      setRemainingTime(remaining);
      
      // Check if timer has completed
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
        
        // Update Firebase to indicate timer completed
        if (roomId && database) {
          const timerRef = ref(database, `rooms/${roomId}/timer`);
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
        }
        
        // Trigger final verdict only if host
        if (isRoomHost) {
          setFinalVerdictTriggered(true);
          onTimerComplete();
        }
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [timerActive, timerStartTime, timerDuration, timerState, roomId, database, addMessage, finalVerdictTriggered, isRoomHost, onTimerComplete]);

  // Sync with Firebase timer status
  useEffect(() => {
    if (!roomId || !database) return;
    
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    
    // Timer state change listener
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const timerData = snapshot.val() as TimerData | null;
      
      if (!timerData) return;
      
      // Handle timer reset from host
      if (timerData.reset === true) {
        resetTimer();
        return;
      }
      
      // Handle timer activation
      if (timerData.active && !timerActive) {
        startTimer();
        
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
      
      // Handle timer completion from server - only trigger if host
      if (timerData.completed && timerState !== 'completed' && !finalVerdictTriggered) {
        setTimerState('completed');
        setRemainingTime(0);
        
        if (timerData.endReason === 'aggressive_language') {
          // For aggressive language, don't end the trial
          addMessage({
            user: 'system',
            name: '시스템',
            text: '공격적인 언어가 감지되어 경고합니다. 상대를 존중하는 언어를 사용해주세요.',
            roomId: roomId || ''
          });
          return;
        } else if (isRoomHost) {
          // Only host calls onTimerComplete
          setFinalVerdictTriggered(true);
          onTimerComplete();
        }
      }
    });
    
    return () => {
      off(timerRef);
    };
  }, [roomId, database, timerActive, timerState, startTimer, resetTimer, finalVerdictTriggered, isRoomHost, addMessage, onTimerComplete]);

  // Check for existing timer when joining
  useEffect(() => {
    if (!roomId || !database) return;
    
    const checkExistingTimer = async () => {
      try {
        const db = database as Database; // Type assertion to avoid undefined
        const timerRef = ref(db, `rooms/${roomId}/timer`);
        const snapshot = await get(timerRef);
        const timerData = snapshot.val();
        
        if (timerData && timerData.active) {
          // Sync with active timer
          if (timerData.startTime) {
            const startTime = new Date(timerData.startTime);
            setTimerStartTime(startTime);
            
            if (timerData.durationSeconds) {
              setTimerDuration(timerData.durationSeconds);
            }
            
            // Calculate elapsed time and remaining time
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const remaining = Math.max(0, timerDuration - elapsed);
            
            // If timer should still be running
            if (remaining > 0) {
              startTimer();
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

  return {
    timerActive,
    remainingTime,
    timerState,
    startTimer,
    resetTimer,
    getTimeLeft,
    formatRemainingTime,
    startTimerMode,
    finalVerdictTriggered
  };
} 