'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'next/navigation';

// Component imports
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TimerInfoBar from './TimerInfoBar';
import TypingIndicator from './TypingIndicator';
import IssueNotification from './IssueNotification';
import ChatRoomHeader from './ChatRoomHeader';
import ChatRoomStatus from './ChatRoomStatus';
import CourtReadyModal from './modals/CourtReadyModal';
import ConfirmStartModal from './modals/ConfirmStartModal';
import HostLeftModal from './modals/HostLeftModal';
import VerdictModal from './modals/VerdictModal';
import VerdictLoadingBar from './VerdictLoadingBar';
import InstantVerdictModal from './modals/InstantVerdictModal';

// Hook imports
import { useCourtTimer } from '@/hooks/useCourtTimer';
import { useChatRoomState } from '@/hooks/useChatRoomState';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';

// Firebase utilities
import { ref, onValue, set, remove, off, get, onDisconnect } from 'firebase/database';
import { database } from '@/lib/firebase';

interface ChatRoomProps {
  roomId: string | null;
  userType?: string;
  customUsername?: string;
  initialStage?: string;
  activeChattersCount?: number;
}

export default function ChatRoom({ 
  roomId, 
  userType, 
  customUsername, 
  initialStage = 'waiting',
  activeChattersCount = 0
}: ChatRoomProps) {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewIssues, setHasNewIssues] = useState(false);
  const [previousIssuesCount, setPreviousIssuesCount] = useState(0);
  const [showVerdictModal, setShowVerdictModal] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

  // Store hooks
  const { 
    messages, 
    addMessage, 
    clearMessages,
    roomUsers,
    typingUsers,
    setTypingStatus,
    detectedIssues,
    clearChat,
    getUserCurseLevel,
    latestVerdictData,
    setVerdictData,
    setVerdictDataLocal,
    setRoomId,
    isVerdictLoading,
    onVerdictLoadingComplete,
    // 즉시 판결 관련
    instantVerdictRequested,
    instantVerdictAgreedUsers,
    showInstantVerdictModal,
    requestInstantVerdict,
    agreeToInstantVerdict,
    setShowInstantVerdictModal,
    checkInstantVerdictConsensus
  } = useChatStore();

  // Custom hooks
  const chatState = useChatRoomState({ roomId, customUsername });
  const timerState = useCourtTimer({
    roomId,
    isRoomHost: chatState.isRoomHost,
    onTimerComplete: () => {
      // Timer completion logic handled in the hook
    },
    addMessage
  });

  // Real-time analysis hook
  const { isAnalyzing } = useRealTimeAnalysis({
    messages: messages as any[], // 임시 타입 변환
    roomId: roomId || '',
    isEnabled: !!roomId // stage 속성 제거 (존재하지 않음)
  });

  // Find final verdict message
  const findVerdictInfo = () => {
    let lastVerdictIndex = -1;
    let hasFinalVerdict = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].user === 'judge' && messages[i].text.includes('최종 판결')) {
        lastVerdictIndex = i;
        hasFinalVerdict = true;
        break;
      }
    }
    
    return { hasFinalVerdict, lastVerdictIndex };
  };

  const { hasFinalVerdict, lastVerdictIndex } = findVerdictInfo();

  // Count user messages (excluding system and judge messages)
  const getUserMessageCount = () => {
    return messages.filter(message => 
      message.user === 'user-general'
    ).length;
  };

  const isInstantVerdictEnabled = getUserMessageCount() > 4 && !showInstantVerdictModal && !showVerdictModal && !isVerdictLoading;

  // Auto scroll effect
  useEffect(() => {
    if (!messagesEndRef.current || !isAutoScrollEnabled.current) return;
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Scroll detection for auto scroll
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    
    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Track new issues
  useEffect(() => {
    const currentIssuesCount = detectedIssues.length;
    if (currentIssuesCount > previousIssuesCount) {
      setHasNewIssues(true);
    }
    setPreviousIssuesCount(currentIssuesCount);
  }, [detectedIssues, previousIssuesCount]);

  // 판결 데이터 감지 및 모달 표시
  useEffect(() => {
    if (latestVerdictData && !showVerdictModal) {
      console.log('📋 판결 데이터 감지 - 모달 표시');
      setShowVerdictModal(true);
    }
  }, [latestVerdictData, showVerdictModal]);

  // roomId를 store에 설정
  useEffect(() => {
    if (roomId) {
      console.log('📍 ChatRoom에서 roomId 설정:', roomId);
      setRoomId(roomId);
    }
  }, [roomId, setRoomId]);

  // Firebase 로딩 상태 실시간 리스너 (모든 참가자용)
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`로딩 상태 리스너 설정: ${roomId}`);
    const verdictLoadingRef = ref(database, `rooms/${roomId}/verdictLoading`);
    
    const loadingUnsubscribe = onValue(verdictLoadingRef, (snapshot) => {
      if (snapshot.exists()) {
        const loadingInfo = snapshot.val();
        console.log('Firebase 로딩 상태 수신:', loadingInfo);
        
        // 모든 유저에게 로딩 상태 동기화
        if (loadingInfo.isLoading !== undefined) {
          useChatStore.setState({ isVerdictLoading: loadingInfo.isLoading });
        }
      }
    });

    return () => {
      console.log('로딩 상태 리스너 정리');
      off(verdictLoadingRef, 'value', loadingUnsubscribe);
    };
  }, [roomId, database]);

  // Firebase 판결 데이터 실시간 리스너 (모든 참가자용)
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`📡 판결 리스너 설정: ${roomId}`);
    const verdictRef = ref(database, `rooms/${roomId}/verdict`);
    
    const verdictUnsubscribe = onValue(verdictRef, (snapshot) => {
      console.log('🔍 Firebase 판결 데이터 확인:', snapshot.exists());
      
      if (snapshot.exists()) {
        const verdictInfo = snapshot.val();
        console.log('📥 Firebase에서 판결 데이터 수신:', verdictInfo);
        
        // 판결 데이터가 있으면 바로 로컬 상태 업데이트
        if (verdictInfo.data && (!latestVerdictData || 
            JSON.stringify(verdictInfo.data) !== JSON.stringify(latestVerdictData))) {
          console.log('💾 판결 데이터 로컬 업데이트 시작');
          
          // 로컬만 업데이트하는 함수 사용 (Firebase 저장 안 함)
          setVerdictDataLocal(verdictInfo.data);
          
          console.log('✅ 판결 데이터 로컬 업데이트 완료');
        }
      } else {
        console.log('❌ Firebase에 판결 데이터 없음');
      }
    });

    return () => {
      console.log('🧹 판결 리스너 정리');
      off(verdictRef, 'value', verdictUnsubscribe);
    };
  }, [roomId, database, latestVerdictData]);

  // Room host detection and Firebase listeners
  useEffect(() => {
    if (!roomId || !database || !chatState.username) return;
    
    const userId = chatState.currentUserId;
    
    // Check if this user is the room host
    const checkAndSetRoomHost = async () => {
      if (!database) return;
      const hostRef = ref(database, `rooms/${roomId}/host`);
      
      try {
        const snapshot = await get(hostRef);
        if (!snapshot.exists()) {
          await set(hostRef, userId);
          chatState.setIsRoomHost(true);
        } else {
          const hostId = snapshot.val();
          chatState.setIsRoomHost(hostId === userId);
        }
      } catch (error) {
        console.error("Error checking room host:", error);
      }
    };

    checkAndSetRoomHost();

    // Set up Firebase listeners
    const readyRef = ref(database, `rooms/${roomId}/ready`);
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
    const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
    const hostPresenceRef = ref(database, `rooms/${roomId}/hostPresence`);

    // Ready status listener
    const readyListener = onValue(readyRef, (snapshot) => {
      const readyData = snapshot.val();
      if (readyData) {
        chatState.setReadyUsers(readyData);
      }
    });

    // Trial ready status listener
    const trialReadyListener = onValue(trialReadyRef, (snapshot) => {
      const readyData = snapshot.val() || {};
      chatState.setPostVerdictReadyUsers(readyData);
      
      if (chatState.isRoomHost && timerState.finalVerdictTriggered) {
        chatState.setShowPostVerdictStartButton(true);
      }
    });

    // Verdict status listener
    const verdictListener = onValue(verdictStatusRef, (snapshot) => {
      const verdictStatus = snapshot.val();
      
      if (verdictStatus && verdictStatus.inProgress) {
        timerState.setFinalVerdictTriggered(true);
        
        if (!chatState.isRoomHost) {
          chatState.setShowTrialReadyButton(true);
          
          addMessage({
            user: 'system',
            name: '시스템',
            text: '판사가 최종 판결을 준비 중입니다. 재판이 끝난 후 새 재판을 위해 준비 버튼을 눌러주세요.',
            roomId: roomId || ''
          });
        }
      }
    });

    // Host presence listener
    const hostPresenceListener = onValue(hostPresenceRef, (snapshot) => {
      const isHostPresent = snapshot.val();
      
      if (isHostPresent === false && !chatState.isRoomHost) {
        chatState.setShowHostLeftModal(true);
      }
    });

    // Set host presence if this user is host
    if (chatState.isRoomHost && database) {
      set(hostPresenceRef, true);
      const onDisconnectRef = onDisconnect(hostPresenceRef);
      onDisconnectRef.set(false);
    }

    return () => {
      off(readyRef);
      off(trialReadyRef);
      off(verdictStatusRef);
      off(hostPresenceRef);
    };
  }, [roomId, database, chatState.username, chatState.isRoomHost, timerState.finalVerdictTriggered]);

  // Firebase 즉시 판결 상태 실시간 리스너
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`⚡ 즉시 판결 리스너 설정: ${roomId}`);
    const instantVerdictRef = ref(database, `rooms/${roomId}/instantVerdict`);
    
    const instantVerdictUnsubscribe = onValue(instantVerdictRef, (snapshot) => {
      if (snapshot.exists()) {
        const instantVerdictData = snapshot.val();
        console.log('⚡ Firebase 즉시 판결 상태 수신:', instantVerdictData);
        
        // 모든 유저에게 즉시 판결 요청 상태 동기화
        if (instantVerdictData.requested) {
          useChatStore.setState({
            instantVerdictRequested: true,
            showInstantVerdictModal: true,
            instantVerdictAgreedUsers: instantVerdictData.agreedUsers || {}
          });
          
          // 동의 현황 변경 시 만장일치 체크
          checkInstantVerdictConsensus();
        }
      } else {
        // 즉시 판결 요청이 취소되었을 때
        console.log('⚡ 즉시 판결 요청 취소됨');
        
        // 타이머 재개 (서버에서 취소된 경우)
        if (timerState.timerActive && timerState.timerPaused) {
          timerState.resumeTimerMode();
          
          if (roomId) {
            addMessage({
              user: 'system',
              name: '시스템',
              text: '▶️ 즉시 판결이 취소되어 타이머가 재개되었습니다.',
              roomId: roomId
            });
          }
        }
        
        useChatStore.setState({
          instantVerdictRequested: false,
          showInstantVerdictModal: false,
          instantVerdictAgreedUsers: {}
        });
      }
    });

    return () => {
      console.log('🧹 즉시 판결 리스너 정리');
      off(instantVerdictRef, 'value', instantVerdictUnsubscribe);
    };
  }, [roomId, database, checkInstantVerdictConsensus]);

  // Message sending
  const sendMessage = (text: string, type?: string, relatedIssue?: string) => {
    if (!text.trim() || !roomId) return;
    
    const userId = chatState.currentUserId;
    const cleanType = type || 'normal';
    
    addMessage({
      user: 'user-general',
      name: chatState.username,
      text: text,
      roomId: roomId,
      sender: {
        id: userId,
        username: chatState.username
      },
      messageType: cleanType as any,
      relatedIssue: relatedIssue || undefined
    });
  };

  // Typing status handler
  const handleTypingStatus = (isTyping: boolean) => {
    const userId = chatState.currentUserId;
    setTypingStatus(userId, chatState.username, isTyping);
  };

  // Room sharing handler
  const handleShareRoom = () => {
    if (!roomId) return;
    
    // 재판 중일 때는 공유 막기
    if (timerState.timerActive) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: '재판이 진행 중일 때는 링크를 공유할 수 없습니다. 재판이 끝난 후 시도해주세요.',
        roomId: roomId
      });
      return;
    }
    
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        addMessage({
          user: 'system',
          name: '시스템',
          text: '법정 링크가 복사되었습니다! 📋',
          roomId: roomId
        });
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        addMessage({
          user: 'system',
          name: '시스템',
          text: `링크 복사에 실패했습니다. 수동으로 복사해주세요: ${shareUrl}`,
          roomId: roomId
        });
      });
  };

  // Instant verdict handler with timer pause
  const handleInstantVerdict = () => {
    // Pause the timer when instant verdict is requested
    timerState.pauseTimerMode();
    
    // Add system message about timer pause
    if (roomId) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: '⏸️ 즉시 판결이 요청되어 타이머가 일시정지되었습니다.',
        roomId: roomId
      });
    }
    
    // Request instant verdict
    requestInstantVerdict();
  };

  // Handle instant verdict cancel/timeout with timer resume
  const handleInstantVerdictCancel = () => {
    // Resume timer when instant verdict is cancelled
    timerState.resumeTimerMode();
    
    // Add system message about timer resume
    if (roomId) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: '▶️ 즉시 판결이 취소되어 타이머가 재개되었습니다.',
        roomId: roomId
      });
    }
    
    // Close the modal
    setShowInstantVerdictModal(false);
  };

  // Trial handlers
  const handleUserReady = () => {
    const userId = chatState.currentUserId;
    if (!roomId || !database) return;
    
    const readyRef = ref(database, `rooms/${roomId}/ready/${userId}`);
    set(readyRef, true);
    
    chatState.setReadyUsers((prev: Record<string, boolean>) => ({
      ...prev,
      [userId]: true
    }));
  };

  const handleInitiateCourt = () => {
    // 모달 없이 바로 재판 시작
    clearChat();
    timerState.startTimerMode();
  };

  const handleStartTrial = () => {
    if (messages.length > 0) {
      chatState.setShowConfirmStartModal(true);
    } else {
      clearChat();
      chatState.setShowCourtReadyModal(false);
      timerState.startTimerMode();
    }
  };

  const handleConfirmStart = () => {
    clearChat();
    chatState.setShowConfirmStartModal(false);
    chatState.setShowCourtReadyModal(false);
    timerState.startTimerMode();
  };

  const handleTrialReady = () => {
    if (!roomId || !database) return;
    
    const userId = chatState.currentUserId;
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady/${userId}`);
    
    set(trialReadyRef, true)
      .then(() => {
        console.log('Trial ready status updated successfully');
      })
      .catch(error => {
        console.error('Error updating trial ready status:', error);
      });
    
    chatState.setShowTrialReadyButton(false);
    
    addMessage({
      user: 'system',
      name: '시스템',
      text: '재판 준비가 완료되었습니다.',
      roomId: roomId || ''
    });
  };

  const handleStartNewTrial = () => {
    if (!roomId || !database) return;
    
    // Reset states
    timerState.setFinalVerdictTriggered(false);
    timerState.setApiCallsEnabled(true);
    chatState.setShowPostVerdictStartButton(false);
    chatState.setShowTrialReadyButton(false);
    
    // Clear Firebase data
    const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
    remove(verdictStatusRef);
    
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
    remove(trialReadyRef);
    
    // Reset timer
    timerState.resetTimerMode();
    
    // Clear messages and show modal
    clearChat();
    addMessage({
      user: 'system',
      name: '시스템',
      text: '호스트가 새 재판을 시작했습니다. 모두 준비해주세요.',
      roomId: roomId || ''
    });
    
    chatState.setShowCourtReadyModal(true);
  };

  const handleRedirectToHome = () => {
    window.location.href = '/';
  };

  // Render
  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-white to-pink-50 rounded-md shadow-lg overflow-hidden border border-pink-100 w-full max-w-[420px] mx-auto">
      {/* Header */}
      <ChatRoomHeader 
        activeChattersCount={chatState.calculatedChattersCount()}
        onShare={handleShareRoom}
        timerActive={timerState.timerActive}
        timerPaused={timerState.timerPaused}
        onInstantVerdict={handleInstantVerdict}
        onPauseTimer={timerState.pauseTimerMode}
        onResumeTimer={timerState.resumeTimerMode}
        isInstantVerdictEnabled={isInstantVerdictEnabled}
        isRoomHost={chatState.isRoomHost}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timer bar */}
        <TimerInfoBar 
          isActive={timerState.timerActive}
          remainingTimeFormatted={timerState.remainingTimeFormatted}
        />
        
        {/* 쟁점 알림 */}
        {detectedIssues.length > 0 && (
          <IssueNotification 
            issues={detectedIssues}
            hasNewIssues={hasNewIssues}
            onToggle={() => setHasNewIssues(false)}
          />
        )}

        {/* 최종 판결 로딩 바 */}
        <VerdictLoadingBar 
          isVisible={isVerdictLoading} 
          onComplete={onVerdictLoadingComplete}
        />

        {/* Chat messages */}
        <div 
          ref={chatContainerRef}
          className="overflow-y-auto bg-gradient-to-b from-white to-pink-50 flex-1 min-h-0"
        >
          <MessageList
            messages={messages}
            username={chatState.username}
            messagesEndRef={messagesEndRef}
            getUserCurseLevel={getUserCurseLevel}
            hasFinalVerdict={hasFinalVerdict}
            lastVerdictIndex={lastVerdictIndex}
          />
          
          <TypingIndicator 
            typingUsers={typingUsers}
            currentUsername={chatState.username}
          />
        </div>
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0 overflow-hidden min-h-[60px]">
        {!timerState.timerActive ? (
          <ChatRoomStatus
            timerActive={timerState.timerActive}
            finalVerdictTriggered={timerState.finalVerdictTriggered}
            isRoomHost={chatState.isRoomHost}
            readyUsers={chatState.readyUsers}
            postVerdictReadyUsers={chatState.postVerdictReadyUsers}
            showTrialReadyButton={chatState.showTrialReadyButton}
            showPostVerdictStartButton={chatState.showPostVerdictStartButton}
            roomUsers={roomUsers}
            currentUserId={chatState.currentUserId}
            onUserReady={handleUserReady}
            onInitiateCourt={handleInitiateCourt}
            onTrialReady={handleTrialReady}
            onStartNewTrial={handleStartNewTrial}
            onShare={handleShareRoom}
          />
        ) : (
          <MessageInput
            disabled={timerState.finalVerdictTriggered && !chatState.isRoomHost}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onTypingStatus={handleTypingStatus}
          />
        )}
      </div>

      {/* Modals */}
      <CourtReadyModal
        isOpen={chatState.showCourtReadyModal}
        onClose={() => chatState.setShowCourtReadyModal(false)}
        onStartTrial={handleStartTrial}
      />
      
      <ConfirmStartModal
        isOpen={chatState.showConfirmStartModal}
        onClose={() => chatState.setShowConfirmStartModal(false)}
        onConfirm={handleConfirmStart}
      />
      
      <HostLeftModal
        isOpen={chatState.showHostLeftModal}
        onRedirectToHome={handleRedirectToHome}
      />
      
      <VerdictModal
        isOpen={showVerdictModal}
        onClose={() => {
          // Stop timer and ensure final verdict state is set
          useChatStore.setState({ timerActive: false });
          timerState.setFinalVerdictTriggered(true);
          
          // Also update Firebase to prevent sync from overriding local state
          if (roomId && database) {
            const timerRef = ref(database, `rooms/${roomId}/timer`);
            set(timerRef, {
              active: false,
              completed: true,
              completedAt: new Date().toISOString(),
              endReason: 'verdict_complete'
            });
            
            const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
            set(verdictStatusRef, {
              inProgress: false,
              completed: true,
              completedAt: new Date().toISOString()
            });
          }
          
          setShowVerdictModal(false);
          setVerdictData(null);
        }}
        verdictData={latestVerdictData}
      />
      
      <InstantVerdictModal
        isOpen={showInstantVerdictModal}
        onClose={() => setShowInstantVerdictModal(false)}
        onCancel={handleInstantVerdictCancel}
        onAgree={() => agreeToInstantVerdict(chatState.username)}
        currentUsername={chatState.username}
        participatingUsers={roomUsers}
        agreedUsers={instantVerdictAgreedUsers}
        timeLeft={60}
      />
    </div>
  );
} 