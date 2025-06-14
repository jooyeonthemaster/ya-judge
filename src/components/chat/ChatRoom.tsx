'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useNewPaymentStore } from '@/app/store/newPaymentStore';

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
  const [savedVerdictData, setSavedVerdictData] = useState<any>(null);
  
  // Separate local states for individual verdict viewing (not synchronized)
  const [showIndividualVerdictModal, setShowIndividualVerdictModal] = useState(false);
  const [individualVerdictData, setIndividualVerdictData] = useState<any>(null);

  // Re-trial modal state
  const [showRetrialModal, setShowRetrialModal] = useState(false);
  const [retrialAgreedUsers, setRetrialAgreedUsers] = useState<Record<string, boolean>>({});
  const [isModalForRetrial, setIsModalForRetrial] = useState(false);
  
  // CourtReadyModal host state tracking (for non-host button disabling)
  const [isHostViewingCourtReadyModal, setIsHostViewingCourtReadyModal] = useState(false);
  
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

  // Payment store for auto-ready after payment
  const { isPaymentCompleted: paymentCompleted, setPaymentCompleted } = useNewPaymentStore();
  
  // Helper function to clear payment completed (equivalent to old clearPaymentCompleted)
  const clearPaymentCompleted = useCallback(() => setPaymentCompleted(false), [setPaymentCompleted]);
  
  // Local state for tracking paid users from Firebase
  const [paidUsers, setPaidUsers] = useState<Record<string, boolean>>({});

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

  // 판결 데이터 감지 및 자동 모달 표시 (최초 판결 완료 시)
  useEffect(() => {
    if (latestVerdictData && !showVerdictModal) {
      console.log('📋 최초 판결 데이터 감지 - 자동 모달 표시 (모든 사용자)');
      setShowVerdictModal(true);
      // Save the verdict data for later viewing
      setSavedVerdictData(latestVerdictData);
    }
  }, [latestVerdictData, showVerdictModal]);

  // roomId를 store에 설정
  useEffect(() => {
    if (roomId) {
      console.log('📍 ChatRoom에서 roomId 설정:', roomId);
      setRoomId(roomId);
    }
  }, [roomId, setRoomId]);

  // CourtReadyModal 상태 변경 추적
  useEffect(() => {
    console.log('🎯 CourtReadyModal 상태 변경:', {
      isOpen: chatState.showCourtReadyModal,
      isRetrial: isModalForRetrial,
      isRoomHost: chatState.isRoomHost,
      showRetrialModal: showRetrialModal
    });
  }, [chatState.showCourtReadyModal, isModalForRetrial, chatState.isRoomHost, showRetrialModal]);

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
        
        // Check if all users are ready and show court ready modal
        const allRealUsers = roomUsers.filter(user => 
          !user.username.includes('System') && 
          user.username !== 'System'
        );
        
        const readyCount = Object.keys(readyData).length;
        const expectedCount = allRealUsers.length;
        
        // If all users are ready, show the court ready modal
        if (readyCount >= expectedCount && expectedCount > 0) {
          console.log('🎯 모든 사용자가 준비 완료 - CourtReadyModal 표시');
          setIsModalForRetrial(false); // This is a new trial, not a retrial
          chatState.setShowCourtReadyModal(true);
          
          // Firebase에 CourtReadyModal 상태 동기화
          if (roomId && database) {
            const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
            set(courtReadyModalRef, {
              isOpen: true,
              openedAt: new Date().toISOString(),
              isRetrial: false
            });
          }
        }
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
          checkInstantVerdictConsensus(paidUsers);
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
  }, [roomId, database, paidUsers]);

  // Firebase CourtReadyModal 상태 실시간 리스너
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`🏛️ CourtReadyModal 상태 리스너 설정: ${roomId}`);
    const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
    
    const courtReadyModalUnsubscribe = onValue(courtReadyModalRef, (snapshot) => {
      if (snapshot.exists()) {
        const modalData = snapshot.val();
        console.log('🏛️ Firebase CourtReadyModal 상태 수신:', modalData);
        
        // 호스트가 아닌 사용자들에게 모달 상태 동기화 (버튼 비활성화용)
        if (!chatState.isRoomHost && modalData.isOpen !== undefined) {
          setIsHostViewingCourtReadyModal(modalData.isOpen);
          console.log(`비호스트 사용자: CourtReadyModal 상태 = ${modalData.isOpen} -> 버튼 ${modalData.isOpen ? '비활성화' : '활성화'}`);
        }
      } else {
        // 모달 데이터가 없으면 기본적으로 활성화
        if (!chatState.isRoomHost) {
          setIsHostViewingCourtReadyModal(false);
        }
      }
    });

    return () => {
      console.log('🧹 CourtReadyModal 상태 리스너 정리');
      off(courtReadyModalRef, 'value', courtReadyModalUnsubscribe);
    };
  }, [roomId, database, chatState.isRoomHost]);

  // Firebase 재심 상태 실시간 리스너
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`🔄 재심 리스너 설정: ${roomId}`);
    const retrialRef = ref(database, `rooms/${roomId}/retrial`);
    
    // 재심 만장일치 체크 함수
    const checkRetrialConsensus = (agreedUsers: Record<string, boolean>) => {
      const realUsers = roomUsers.filter(user => 
        !user.username.includes('System') && user.username !== 'System'
      );
      
      // 실제로 동의한 사용자 + 항소권을 구매한 사용자 카운트
      // 항소권을 구매한 사용자는 재심에 암묵적으로 동의한 것으로 간주
      const explicitlyAgreedUsers = Object.entries(agreedUsers)
        .filter(([_, agreed]) => agreed === true)
        .map(([username, _]) => username);
      
      const paidUsernames = Object.keys(paidUsers);
      
      // 명시적으로 동의하거나 항소권을 구매한 사용자들의 집합
      const effectivelyAgreedUsers = new Set([...explicitlyAgreedUsers, ...paidUsernames]);
      const agreedCount = effectivelyAgreedUsers.size;
      const totalRealUsers = realUsers.length;
      
      console.log(`재심 동의 현황: ${agreedCount}/${totalRealUsers}`);
      console.log('Real users:', realUsers.map(u => u.username));
      console.log('Explicitly agreed users:', explicitlyAgreedUsers);
      console.log('Paid users (implicitly agreed):', paidUsernames);
      console.log('Effectively agreed users:', Array.from(effectivelyAgreedUsers));
      console.log('Is room host:', chatState.isRoomHost);
      
      // 모든 사용자가 동의했을 때만 (실제 동의한 수 = 전체 실제 사용자 수)
      if (agreedCount === totalRealUsers && totalRealUsers > 0) {
        console.log('🎉 재심 만장일치! 호스트에게 CourtReadyModal 표시');
        console.log(`확인: ${agreedCount}명이 동의했고, 총 ${totalRealUsers}명의 실제 사용자가 있음`);
        
        // 추가 검증: 실제로 모든 실제 사용자가 동의했는지 확인
        const realUsernames = realUsers.map(u => u.username);
        const allRealUsersAgreed = realUsernames.every(username => effectivelyAgreedUsers.has(username));
        
        console.log('실제 사용자 목록:', realUsernames);
        console.log('실질적으로 동의한 사용자 목록:', Array.from(effectivelyAgreedUsers));
        console.log('모든 실제 사용자가 동의했는가?', allRealUsersAgreed);
        
        if (!allRealUsersAgreed) {
          console.log('🚫 일부 실제 사용자가 아직 동의하지 않음 - 모달 표시 중단');
          return;
        }
        
        // 모달 닫기 및 상태 초기화
        setShowRetrialModal(false);
        setRetrialAgreedUsers({});
        
        // Firebase에서 재심 요청 제거
        if (roomId && database) {
          const retrialRef = ref(database, `rooms/${roomId}/retrial`);
          remove(retrialRef);
        }
        
        // 호스트에게만 CourtReadyModal 표시
        if (chatState.isRoomHost) {
          console.log('🎯 호스트에게 재심 CourtReadyModal 표시 시작');
          console.log('Setting isModalForRetrial to true');
          setIsModalForRetrial(true);
          chatState.setShowCourtReadyModal(true);
          
          // Firebase에 CourtReadyModal 상태 동기화
          if (roomId && database) {
            const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
            set(courtReadyModalRef, {
              isOpen: true,
              openedAt: new Date().toISOString(),
              isRetrial: true
            });
          }
          
          console.log('✅ 재심 CourtReadyModal shown to host');
        } else {
          console.log('👥 비호스트 사용자 - CourtReadyModal 표시 안 함');
        }
        
        // 시스템 메시지 추가
        if (roomId) {
          addMessage({
            user: 'system',
            name: '시스템',
            text: '🎉 모든 참가자가 재심에 동의했습니다! 호스트가 재심을 시작해주세요.',
            roomId: roomId
          });
        }
      } else {
        console.log(`아직 모든 사용자가 동의하지 않음: ${agreedCount}/${totalRealUsers} (최소 2명 필요)`);
      }
    };
    
    const retrialUnsubscribe = onValue(retrialRef, (snapshot) => {
      if (snapshot.exists()) {
        const retrialData = snapshot.val();
        console.log('🔄 Firebase 재심 상태 수신:', retrialData);
        
        // 모든 유저에게 재심 요청 상태 동기화
        if (retrialData.requested) {
          setShowRetrialModal(true);
          const agreedUsers = retrialData.agreedUsers || {};
          setRetrialAgreedUsers(agreedUsers);
          
          console.log('Firebase에서 받은 동의자 목록:', agreedUsers);
          
          // 동의 현황 변경 시 만장일치 체크
          checkRetrialConsensus(agreedUsers);
        }
      } else {
        // 재심 요청이 취소되었을 때
        console.log('🔄 재심 요청 취소됨');
        setShowRetrialModal(false);
        setRetrialAgreedUsers({});
      }
    });

    return () => {
      console.log('🧹 재심 리스너 정리');
      off(retrialRef, 'value', retrialUnsubscribe);
    };
  }, [roomId, database, roomUsers, chatState.isRoomHost, paidUsers]);

  // Firebase 결제 사용자 상태 실시간 리스너
  useEffect(() => {
    if (!roomId || !database) return;

    console.log(`💳 결제 사용자 리스너 설정: ${roomId}`);
    const paidUsersRef = ref(database, `rooms/${roomId}/paidUsers`);
    
    const paidUsersUnsubscribe = onValue(paidUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        const paidUsersData = snapshot.val();
        console.log('💳 Firebase 결제 사용자 상태 수신:', paidUsersData);
        
        // Convert to simple username -> boolean mapping
        const paidUsersMap: Record<string, boolean> = {};
        Object.values(paidUsersData).forEach((userData: any) => {
          if (userData.username && userData.isPaid) {
            paidUsersMap[userData.username] = true;
          }
        });
        
        setPaidUsers(paidUsersMap);
        console.log('💳 결제 사용자 맵 업데이트:', paidUsersMap);
      } else {
        console.log('💳 결제 사용자 데이터 없음');
        setPaidUsers({});
      }
    });

    return () => {
      console.log('🧹 결제 사용자 리스너 정리');
      off(paidUsersRef, 'value', paidUsersUnsubscribe);
    };
  }, [roomId, database]);

  // Auto-mark user as ready after successful payment
  useEffect(() => {
    if (!paymentCompleted || !roomId || !database || !chatState.username) return;
    
    // Only auto-mark as ready if final verdict has been triggered (post-verdict state)
    if (!timerState.finalVerdictTriggered) {
      console.log('⚠️ Payment completed but not in post-verdict state, not auto-marking as ready');
      return;
    }
    
    // Check if user is already marked as ready
    if (chatState.postVerdictReadyUsers[chatState.currentUserId]) {
      console.log('⚠️ User already marked as ready, clearing payment completion flag');
      clearPaymentCompleted();
      return;
    }
    
    console.log('💳 Payment completed - auto-marking user as ready and storing paid status');
    
    // Mark user as ready in Firebase (same logic as handleTrialReady)
    const userId = chatState.currentUserId;
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady/${userId}`);
    
    // Also store the paid status in Firebase so other clients can see it
    const paidUsersRef = ref(database, `rooms/${roomId}/paidUsers/${chatState.username}`);
    
    // Clear ispaying status since this user completed payment
    const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
    
    Promise.all([
      set(trialReadyRef, true),
      set(paidUsersRef, {
        username: chatState.username,
        userId: userId,
        paidAt: new Date().toISOString(),
        isPaid: true
      }),
      remove(isPayingRef) // Clear ispaying status to allow other users to pay
    ])
      .then(() => {
        console.log('✅ Auto-marked user as ready after payment, stored paid status, and cleared ispaying status');
        
        // Add system message
        addMessage({
          user: 'system',
          name: '시스템',
          text: `${chatState.username}님이 항소권을 구매하고 재판 준비가 완료되었습니다.`,
          roomId: roomId
        });
        
        // Clear the payment completion flag
        clearPaymentCompleted();
      })
      .catch(error => {
        console.error('❌ Error auto-marking user as ready after payment:', error);
        // Still clear the flag to prevent infinite retries
        clearPaymentCompleted();
      });
  }, [
    paymentCompleted, 
    roomId, 
    database, 
    chatState.username, 
    chatState.currentUserId,
    chatState.postVerdictReadyUsers,
    timerState.finalVerdictTriggered,
    clearPaymentCompleted
  ]);

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
    
    // Request instant verdict with current username for auto-agreement of paid users
    requestInstantVerdict(chatState.username);
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

  // Handle verdict history viewing - use local state only (no synchronization)
  const handleViewVerdictHistory = () => {
    if (savedVerdictData) {
      console.log('📖 개별 판결 다시보기 - 로컬 상태만 사용 (다른 사용자에게 영향 없음)');
      // Use local state that doesn't affect other users
      setIndividualVerdictData(savedVerdictData);
      setShowIndividualVerdictModal(true);
    }
  };

  // Re-trial handlers
  const handleRequestRetrial = () => {
    console.log('🔄 재심 요청 시작');
    setRetrialAgreedUsers({});
    setShowRetrialModal(true);
    
    // Store re-trial request in Firebase for all clients
    if (roomId && database) {
      const retrialRef = ref(database, `rooms/${roomId}/retrial`);
      set(retrialRef, {
        requested: true,
        requestedAt: new Date().toISOString(),
        agreedUsers: {},
        requestedBy: chatState.username
      }).then(() => {
        console.log('Firebase에 재심 요청 저장 완료');
      }).catch(error => {
        console.error('Firebase 재심 요청 저장 실패:', error);
      });
    }
    
    if (roomId) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: '🔄 재심이 요청되었습니다. 모든 참가자의 동의가 필요합니다.',
        roomId: roomId
      });
    }
  };

  const handleAgreeToRetrial = () => {
    console.log(`🤝 ${chatState.username}님 재심 동의`);
    console.log('현재 roomUsers:', roomUsers);
    console.log('현재 재심 동의자:', retrialAgreedUsers);
    
    // Update Firebase with agreement
    if (roomId && database) {
      const agreedUserRef = ref(database, `rooms/${roomId}/retrial/agreedUsers/${chatState.username}`);
      set(agreedUserRef, true).then(() => {
        console.log('Firebase에 재심 동의 저장 완료');
        
        // Update local state immediately
        setRetrialAgreedUsers(prev => ({
          ...prev,
          [chatState.username]: true
        }));
      }).catch(error => {
        console.error('Firebase 재심 동의 저장 실패:', error);
      });
    }

    if (roomId) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: `${chatState.username}님이 재심에 동의했습니다.`,
        roomId: roomId
      });
    }
  };

  const handleStartRetrial = () => {
    console.log('🔄 재심 시작');
    
    // Reset states for new trial
    timerState.setFinalVerdictTriggered(false);
    timerState.setApiCallsEnabled(true);
    chatState.setShowPostVerdictStartButton(false);
    chatState.setShowTrialReadyButton(false);
    
    // Clear payment completion status so users can manually control instant verdict readiness
    clearPaymentCompleted();
    
    // Immediately clear local paidUsers state
    setPaidUsers({});
    console.log('💳 로컬 결제 사용자 상태 즉시 초기화');
    
    // Clear Firebase data
    if (roomId && database) {
      const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
      remove(verdictStatusRef);
      
      const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
      remove(trialReadyRef);
      
      // Clear paidUsers data so users can manually control instant verdict readiness during retrial
      const paidUsersRef = ref(database, `rooms/${roomId}/paidUsers`);
      remove(paidUsersRef);
      
          // Clear ispaying status to allow new payments
    const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
    remove(isPayingRef);
    
    // Signal all users to clear their session storage
    const clearSessionSignalRef = ref(database, `rooms/${roomId}/clearPaymentSession`);
    set(clearSessionSignalRef, {
      timestamp: new Date().toISOString(),
      reason: 'retrial_start',
      clearedBy: chatState.username
    }).then(() => {
      console.log('✅ Session storage clear signal sent to all users for retrial');
      // Remove the signal after a short delay to clean up
      setTimeout(() => {
        remove(clearSessionSignalRef).catch(error => {
          console.error('❌ Failed to remove session clear signal:', error);
        });
      }, 2000);
    }).catch(error => {
      console.error('❌ Failed to send session storage clear signal for retrial:', error);
    });
    
    console.log('💳 재심 시작으로 인해 항소권 자동 준비 상태 및 결제 상태를 초기화했습니다.');
    }
    
    // Reset timer and start new trial
    timerState.resetTimerMode();
    clearChat();
    
    addMessage({
      user: 'system',
      name: '시스템',
      text: '🔄 모든 참가자가 동의하여 재심이 시작됩니다!',
      roomId: roomId || ''
    });
    
    // Start timer for new trial
    setTimeout(() => {
      timerState.startTimerMode();
    }, 1000);
  };

  const handleCancelRetrial = () => {
    console.log('🔄 재심 요청 취소');
    setShowRetrialModal(false);
    setRetrialAgreedUsers({});
    
    // Remove re-trial request from Firebase
    if (roomId && database) {
      const retrialRef = ref(database, `rooms/${roomId}/retrial`);
      remove(retrialRef).then(() => {
        console.log('Firebase에서 재심 요청 제거 완료');
      }).catch(error => {
        console.error('Firebase 재심 요청 제거 실패:', error);
      });
    }
    
    if (roomId) {
      addMessage({
        user: 'system',
        name: '시스템',
        text: '재심 요청이 취소되었습니다.',
        roomId: roomId
      });
    }
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
    if (!roomId || !database) return;
    
    // Reset states
    timerState.setFinalVerdictTriggered(false);
    timerState.setApiCallsEnabled(true);
    chatState.setShowPostVerdictStartButton(false);
    chatState.setShowTrialReadyButton(false);
    
    // Clear payment completion status so users can manually control instant verdict readiness
    clearPaymentCompleted();
    
    // Immediately clear local paidUsers state
    setPaidUsers({});
    console.log('💳 로컬 결제 사용자 상태 즉시 초기화');
    
    // Clear Firebase data
    const verdictStatusRef = ref(database, `rooms/${roomId}/verdictStatus`);
    remove(verdictStatusRef);
    
    const trialReadyRef = ref(database, `rooms/${roomId}/trialReady`);
    remove(trialReadyRef);
    
    // Clear paidUsers data for both retrials and fresh trials
    // This ensures users can manually control instant verdict readiness
    const paidUsersRef = ref(database, `rooms/${roomId}/paidUsers`);
    remove(paidUsersRef);
    
    // Clear ispaying status to allow new payments
    const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
    remove(isPayingRef);
    
    // Signal all users to clear their session storage
    const clearSessionSignalRef = ref(database, `rooms/${roomId}/clearPaymentSession`);
    set(clearSessionSignalRef, {
      timestamp: new Date().toISOString(),
      reason: 'trial_start',
      clearedBy: chatState.username
    }).then(() => {
      console.log('✅ Session storage clear signal sent to all users for trial');
      // Remove the signal after a short delay to clean up
      setTimeout(() => {
        remove(clearSessionSignalRef).catch(error => {
          console.error('❌ Failed to remove session clear signal:', error);
        });
      }, 2000);
    }).catch(error => {
      console.error('❌ Failed to send session storage clear signal for trial:', error);
    });
    
    console.log('💳 결제 상태 초기화 - 새로운 결제가 가능합니다.');
    
    if (isModalForRetrial) {
      console.log('💳 재심 시작으로 인해 항소권 자동 준비 상태를 초기화했습니다.');
    } else {
      console.log('💳 새 재판 시작으로 인해 항소권 상태를 초기화했습니다.');
    }
    
    // For fresh new trials (not re-trials), clear Firebase messages
    if (!isModalForRetrial) {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      remove(messagesRef);
      
      // Clear local messages only for fresh trials
      clearChat();
    }
    
    // Reset timer
    timerState.resetTimerMode();
    
    // Clear Firebase CourtReadyModal state and close modal
    if (roomId && database) {
      const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
      remove(courtReadyModalRef);
    }
    
    chatState.setShowCourtReadyModal(false);
    timerState.startTimerMode();
    
    const messageText = isModalForRetrial 
      ? '🔄 재심이 시작되었습니다. 모두 준비해주세요.'
      : '호스트가 새 재판을 시작했습니다. 모두 준비해주세요.';
    
    addMessage({
      user: 'system',
      name: '시스템',
      text: messageText,
      roomId: roomId || ''
    });
    
    // Reset retrial flag
    setIsModalForRetrial(false);
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
    console.log('🚨 handleStartNewTrial called - regular new trial flow');
    console.log('isRetrialInProgress (showRetrialModal):', showRetrialModal);
    
    if (!roomId || !database) return;
    
    // Prevent regular new trial if retrial is in progress
    if (showRetrialModal) {
      console.log('🚫 Blocking regular new trial - retrial in progress');
      return;
    }
    
    // Show court ready modal first
    setIsModalForRetrial(false);
    chatState.setShowCourtReadyModal(true);
    
    // Firebase에 CourtReadyModal 상태 동기화 (새 재판용)
    if (roomId && database) {
      const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
      set(courtReadyModalRef, {
        isOpen: true,
        openedAt: new Date().toISOString(),
        isRetrial: false
      });
    }
    
    console.log('✅ CourtReadyModal shown for regular new trial');
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
            currentUsername={chatState.username}
            paidUsers={paidUsers}
            onUserReady={handleUserReady}
            onInitiateCourt={handleInitiateCourt}
            onTrialReady={handleTrialReady}
            onStartNewTrial={handleStartNewTrial}
            onShare={handleShareRoom}
            onViewVerdictHistory={savedVerdictData ? handleViewVerdictHistory : undefined}
            onRequestRetrial={handleRequestRetrial}
            isRetrialInProgress={showRetrialModal}
            isHostViewingCourtReadyModal={isHostViewingCourtReadyModal}
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
        onClose={() => {
          console.log('🔴 CourtReadyModal 닫기');
          
          // Firebase에서 CourtReadyModal 상태 제거 (버튼 다시 활성화)
          if (roomId && database) {
            const courtReadyModalRef = ref(database, `rooms/${roomId}/courtReadyModal`);
            remove(courtReadyModalRef).then(() => {
              console.log('Firebase CourtReadyModal 상태 제거 완료 - 버튼 활성화');
            });
          }
          
          chatState.setShowCourtReadyModal(false);
          setIsModalForRetrial(false);
        }}
        onStartTrial={handleStartTrial}
        isRetrial={isModalForRetrial}
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
      
      {/* Auto-triggered Verdict Modal - synchronized across all users */}
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
        paidUsers={paidUsers}
        timeLeft={60}
        modalTitle="⚡ 즉시 판결 요청"
        confirmationMessage="재판을 즉시 종료하고 판결을 받으시겠습니까?"
        agreeButtonText="⚡ 동의하기"
        successMessage="🎉 모든 참가자가 동의했습니다! 곧 판결이 시작됩니다..."
      />

      {/* Individual Verdict Modal - for personal "판결 다시보기" only (no synchronization) */}
      <VerdictModal
        isOpen={showIndividualVerdictModal}
        onClose={() => {
          setShowIndividualVerdictModal(false);
          setIndividualVerdictData(null);
        }}
        verdictData={individualVerdictData}
      />

      {/* Re-trial Modal */}
      <InstantVerdictModal
        isOpen={showRetrialModal}
        onClose={handleCancelRetrial}
        onCancel={handleCancelRetrial}
        onAgree={handleAgreeToRetrial}
        currentUsername={chatState.username}
        participatingUsers={roomUsers}
        agreedUsers={retrialAgreedUsers}
        paidUsers={paidUsers}
        timeLeft={60}
        modalTitle="🔄 재심 요청"
        confirmationMessage="재판을 재시작하시겠습니까?"
        agreeButtonText="🔄 재심 동의"
        successMessage="🎉 모든 참가자가 동의했습니다! 곧 재판이 재시작됩니다..."
      />
    </div>
  );
} 