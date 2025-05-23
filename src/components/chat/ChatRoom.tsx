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
    setRoomId
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
    messages,
    roomId: roomId || '',
    isEnabled: !!roomId && chatState.stage !== 'waiting' && chatState.stage !== 'ended'
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

  // Firebase 판결 데이터 실시간 리스너 (모든 참가자용)
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`판결 리스너 설정: ${roomId} (현재 사용자: ${chatState.username})`);
    const verdictRef = ref(database, `rooms/${roomId}/verdict`);
    
    const unsubscribe = onValue(verdictRef, (snapshot) => {
      console.log('Firebase 판결 데이터 확인:', snapshot.exists());
      
      if (snapshot.exists()) {
        const verdictInfo = snapshot.val();
        console.log('Firebase에서 판결 데이터 수신:', verdictInfo);
        console.log('현재 로컬 판결 데이터:', latestVerdictData);
        
        // 판결 데이터가 있는 경우 로컬 상태만 직접 업데이트 (Firebase 재저장 방지)
        if (verdictInfo.data && (!latestVerdictData || 
            JSON.stringify(verdictInfo.data) !== JSON.stringify(latestVerdictData))) {
          console.log('판결 데이터 로컬 업데이트 시작 (Firebase 제외)');
          
          // 로컬만 업데이트하는 함수 사용 (Firebase 저장 안 함)
          setVerdictDataLocal(verdictInfo.data);
          
          console.log('판결 데이터 로컬 업데이트 완료');
        }
      } else {
        console.log('Firebase에 판결 데이터 없음');
      }
    });

    return () => {
      console.log('판결 리스너 정리');
      off(verdictRef, 'value', unsubscribe);
    };
  }, [roomId, database, chatState.username]);

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
    
    const shareUrl = `${window.location.origin}/chat/${roomId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        addMessage({
          user: 'system',
          name: '시스템',
          text: '채팅방 링크가 클립보드에 복사되었습니다! 친구들에게 공유해보세요. 👍',
          roomId: roomId
        });
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        addMessage({
          user: 'system',
          name: '시스템',
          text: `채팅방 링크를 수동으로 복사해주세요: ${shareUrl}`,
          roomId: roomId
        });
      });
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
    chatState.setShowCourtReadyModal(true);
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
        onShare={onShare || handleShareRoom}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timer bar */}
        <TimerInfoBar 
          isActive={timerState.timerActive}
          remainingTimeFormatted={timerState.remainingTimeFormatted}
        />
        
        {/* Issues notification */}
        {timerState.timerActive && detectedIssues.length > 0 && (
          <IssueNotification 
            issues={detectedIssues}
            hasNewIssues={hasNewIssues}
            onToggle={() => setHasNewIssues(false)}
          />
        )}
        
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
          setShowVerdictModal(false);
          setVerdictData(null);
        }}
        verdictData={latestVerdictData}
      />
    </div>
  );
} 