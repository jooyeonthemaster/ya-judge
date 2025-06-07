import { motion } from 'framer-motion';
import { 
  Gavel, 
  CheckCircle2, 
  AlertTriangle, 
  Scale,
  Share,
  History,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePaymentStore } from '@/app/store/paymentStore';
import { ref, set, get, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import { onValue, off } from 'firebase/database';
import PaymentConfirmModal from './modals/PaymentConfirmModal';

interface ChatRoomStatusProps {
  // 기본 상태
  timerActive: boolean;
  finalVerdictTriggered: boolean;
  isRoomHost: boolean;
  
  // 준비 상태 관련
  readyUsers: Record<string, boolean>;
  postVerdictReadyUsers: Record<string, boolean>;
  showTrialReadyButton: boolean;
  showPostVerdictStartButton: boolean;
  
  // 사용자 정보
  roomUsers: Array<{ id: string; username: string; }>;
  currentUserId: string;
  currentUsername: string;
  
  // 결제 정보
  paidUsers: Record<string, boolean>;
  
  // 재심 상태
  isRetrialInProgress?: boolean;
  
  // CourtReadyModal 상태 (호스트가 모달을 보고 있는지)
  isHostViewingCourtReadyModal?: boolean;
  
  // 핸들러 함수들
  onUserReady: () => void;
  onInitiateCourt: () => void;
  onTrialReady: () => void;
  onStartNewTrial: () => void;
  onShare?: () => void;
  onViewVerdictHistory?: () => void;
  onRequestRetrial?: () => void;
}

export default function ChatRoomStatus({
  timerActive,
  finalVerdictTriggered,
  isRoomHost,
  readyUsers,
  postVerdictReadyUsers,
  showTrialReadyButton,
  showPostVerdictStartButton,
  roomUsers,
  currentUserId,
  currentUsername,
  paidUsers,
  isRetrialInProgress = false,
  isHostViewingCourtReadyModal = false,
  onUserReady,
  onInitiateCourt,
  onTrialReady,
  onStartNewTrial,
  onShare,
  onViewVerdictHistory,
  onRequestRetrial
}: ChatRoomStatusProps) {
  const router = useRouter();
  const { setRoomId, setUserName } = usePaymentStore();
  const [isPaying, setIsPaying] = useState(false);
  const [payingUser, setPayingUser] = useState<string | null>(null);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [sessionStorageUpdateTrigger, setSessionStorageUpdateTrigger] = useState(0);
  
  // Session storage keys
  const getSessionStorageKey = () => {
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;
    return roomId ? `ispaying_${roomId}` : null;
  };
  
  // Check session storage for payment state
  const checkSessionStoragePaymentState = () => {
    const key = getSessionStorageKey();
    if (!key) return { isPaying: false, payingUser: null };
    
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        console.log(`💾 Session storage payment state for ${currentUsername}: ${JSON.stringify(data)}`);
        return { isPaying: data.status || false, payingUser: data.user || null };
      } else {
        console.log(`💾 No session storage data found for ${currentUsername} (key: ${key})`);
      }
    } catch (error) {
      console.error('❌ Error reading session storage:', error);
    }
    
    return { isPaying: false, payingUser: null };
  };
  
  // Set session storage payment state
  const setSessionStoragePaymentState = (status: boolean, user: string | null) => {
    const key = getSessionStorageKey();
    if (!key) return;
    
    try {
      // Debug call stack to see who's calling this function
      console.log(`💾 setSessionStoragePaymentState called by ${currentUsername}:`, {
        status,
        user,
        key,
        stack: new Error().stack?.split('\n')[1]?.trim() || 'unknown'
      });
      
      if (status && user) {
        const data = { status, user, timestamp: new Date().toISOString() };
        sessionStorage.setItem(key, JSON.stringify(data));
        console.log(`💾 ✅ Stored payment state in session for ${currentUsername}: ${JSON.stringify(data)}`);
      } else {
        sessionStorage.removeItem(key);
        console.log(`💾 ❌ Removed payment state from session for ${currentUsername} (key: ${key})`);
      }
      // Trigger re-render to reflect session storage changes
      setSessionStorageUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error writing session storage:', error);
    }
  };

  // Helper function to clear session storage (can be called externally)
  const clearSessionStoragePaymentState = () => {
    console.log(`🧹 clearSessionStoragePaymentState called by ${currentUsername}:`, {
      stack: new Error().stack?.split('\n')[1]?.trim() || 'unknown'
    });
    setSessionStoragePaymentState(false, null);
    // Trigger re-render to reflect cleared session storage
    setSessionStorageUpdateTrigger(prev => prev + 1);
  };

  // Legacy global function cleanup (no longer needed as we use Firebase signals)
  useEffect(() => {
    // Clean up any existing global function on mount
    delete (window as any).clearPaymentSessionStorage;
  }, []);
  
  // Combined payment state (Firebase + Session Storage)
  const sessionPaymentState = useMemo(() => {
    const state = checkSessionStoragePaymentState();
    console.log(`🔄 Session payment state recalculated for ${currentUsername} (trigger: ${sessionStorageUpdateTrigger}):`, state);
    return state;
  }, [sessionStorageUpdateTrigger, currentUsername]); // Re-calculate when session storage is updated
  
  const effectiveIsPaying = isPaying || sessionPaymentState.isPaying;
  const effectivePayingUser = payingUser || sessionPaymentState.payingUser;
  
  // Debug render state
  console.log(`🔄 ChatRoomStatus render for ${currentUsername}`);
  console.log(`   - Firebase: isPaying=${isPaying}, payingUser=${payingUser}`);
  console.log(`   - Session: isPaying=${sessionPaymentState.isPaying}, payingUser=${sessionPaymentState.payingUser}`);
  console.log(`   - Effective: isPaying=${effectiveIsPaying}, payingUser=${effectivePayingUser}`);
  
  // Debug session storage directly
  const debugSessionKey = getSessionStorageKey();
  const debugSessionRaw = debugSessionKey ? sessionStorage.getItem(debugSessionKey) : null;
  console.log(`🔍 Direct session storage check for ${currentUsername}:`);
  console.log(`   - Key: ${debugSessionKey}`);
  console.log(`   - Raw value: ${debugSessionRaw}`);
  console.log(`   - All session storage keys:`, Object.keys(sessionStorage));
  
  // Firebase listener for ispaying status
  useEffect(() => {
    // Get room ID from current URL
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const currentRoomId = roomIdMatch ? roomIdMatch[1] : null;
    
    if (!currentRoomId || !database) return;

    console.log(`🔒 Setting up ispaying listener for room: ${currentRoomId}`);
    const isPayingRef = ref(database, `rooms/${currentRoomId}/ispaying`);
    const unsubscribe = onValue(isPayingRef, (snapshot) => {
      console.log(`🔒 Firebase ispaying status changed for ${currentUsername}:`, snapshot.exists() ? snapshot.val() : 'null');
      if (snapshot.exists()) {
        const payingData = snapshot.val();
        console.log(`🔒 Setting Firebase state for ${currentUsername} - isPaying: ${payingData.status}, payingUser: ${payingData.user}`);
        setIsPaying(payingData.status);
        setPayingUser(payingData.user || null);
        // Store in session storage for all users when payment is active
        console.log(`🔒 About to store in session storage for ${currentUsername} (payingData: ${JSON.stringify(payingData)})`);
        const currentKey = getSessionStorageKey();
        console.log(`🔒 Current session storage before update:`, currentKey ? sessionStorage.getItem(currentKey) : 'no key');
        setSessionStoragePaymentState(payingData.status, payingData.user);
        
        // Verify it was actually stored
        setTimeout(() => {
          const verifyKey = getSessionStorageKey();
          const verifyValue = verifyKey ? sessionStorage.getItem(verifyKey) : null;
          console.log(`🔒 Verification after 100ms for ${currentUsername}:`, {
            key: verifyKey,
            value: verifyValue
          });
        }, 100);
        console.log(`🔒 Updated local state - isPaying: ${payingData.status}, payingUser: ${payingData.user}`);
      } else {
        // Firebase state cleared - only update Firebase local state, NOT session storage
        // Session storage should persist to maintain button states when paying user navigates away
        console.log(`🔒 Firebase state cleared for ${currentUsername} - preserving session storage`);
        setIsPaying(false);
        setPayingUser(null);
        console.log('🔒 Firebase state cleared - session storage preserved for navigation persistence');
      }
    });

    return () => {
      console.log('🧹 Cleaning up ispaying listener');
      off(isPayingRef, 'value', unsubscribe);
    };
  }, []);

  // Firebase listener for session storage clear signal (for retrial/trial starts)
  useEffect(() => {
    // Get room ID from current URL
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const currentRoomId = roomIdMatch ? roomIdMatch[1] : null;
    
    if (!currentRoomId || !database) return;

    console.log(`🔥 Setting up session storage clear signal listener for room: ${currentRoomId}`);
    const clearSignalRef = ref(database, `rooms/${currentRoomId}/clearPaymentSession`);
    const unsubscribeClearSignal = onValue(clearSignalRef, (snapshot) => {
      console.log(`🔥 Clear signal listener triggered for ${currentUsername}:`, snapshot.exists() ? snapshot.val() : 'no data');
      
      if (snapshot.exists()) {
        const clearData = snapshot.val();
        console.log(`🔥 Session storage clear signal received by ${currentUsername}:`, clearData);
        console.log(`🔥 Signal reason: ${clearData.reason}, clearedBy: ${clearData.clearedBy}`);
        console.log(`🔥 Current user: ${currentUsername}, should clear: ${clearData.reason !== 'payment_page_left' || clearData.clearedBy === currentUsername}`);
        
        // Only clear session storage for legitimate clear signals:
        // 1. Retrial/trial starts (host action) - clear for everyone
        // 2. Payment cancelled - clear for everyone 
        // 3. Payment page left without completion - only clear for the leaving user
        // 4. Payment completed - DON'T clear (keep session storage so paying user can return)
        const shouldClearSessionStorage = 
          clearData.reason === 'retrial_start' || 
          clearData.reason === 'trial_start' || 
          clearData.reason === 'payment_cancelled' ||
          (clearData.reason === 'payment_page_left' && clearData.clearedBy === currentUsername) ||
          (clearData.reason === 'newpayment_page_left' && clearData.clearedBy === currentUsername);
          
        if (shouldClearSessionStorage) {
          console.log(`🔥 Proceeding to clear session storage for ${currentUsername}`);
          clearSessionStoragePaymentState();
          console.log(`✅ Session storage cleared for ${currentUsername} due to: ${clearData.reason}`);
        } else {
          console.log(`🔥 Ignoring clear signal for ${currentUsername} - reason: ${clearData.reason}`);
        }
        
        console.log(`🔄 Trigger value after clear: ${sessionStorageUpdateTrigger + 1}`);
      }
    });

    return () => {
      console.log('🧹 Cleaning up session storage clear signal listener');
      off(clearSignalRef, 'value', unsubscribeClearSignal);
    };
  }, [currentUsername]);

  // Initialize component state from session storage on mount
  useEffect(() => {
    console.log(`🚀 Component mounted for ${currentUsername} - checking session storage...`);
    const sessionState = checkSessionStoragePaymentState();
    console.log(`🚀 Mount session state for ${currentUsername}:`, sessionState);
    
    if (sessionState.isPaying && sessionState.payingUser) {
      console.log('🚀 Component mounted - found session storage payment state, syncing...');
      console.log(`   Session state: isPaying=${sessionState.isPaying}, payingUser=${sessionState.payingUser}`);
      
      // Don't update Firebase state, just log that we're using session storage
      // The Firebase listener will handle the authoritative state
      console.log('💾 Using session storage to maintain button disabled state');
    } else {
      console.log(`🚀 No session storage payment state found for ${currentUsername} on mount`);
    }
  }, []);

  // Clear session storage on component unmount as safety measure
  useEffect(() => {
    console.log(`🔧 Setting up unmount cleanup for ${currentUsername}`);
    
    return () => {
      // Only clear if this user was the one paying
      const sessionState = checkSessionStoragePaymentState();
      console.log(`🧹 Component unmounting for ${currentUsername}:`, {
        sessionState,
        shouldClear: sessionState.isPaying && sessionState.payingUser === currentUsername,
        currentUser: currentUsername,
        payingUser: sessionState.payingUser
      });
      
      if (sessionState.isPaying && sessionState.payingUser === currentUsername) {
        console.log(`🧹 Component unmounting - clearing session storage for current paying user: ${currentUsername}`);
        setSessionStoragePaymentState(false, null);
      } else {
        console.log(`🧹 Component unmounting - NOT clearing session storage for ${currentUsername} (not the paying user or no payment active)`);
        console.log(`   - isPaying: ${sessionState.isPaying}`);
        console.log(`   - payingUser: ${sessionState.payingUser}`);
        console.log(`   - currentUser: ${currentUsername}`);
        console.log(`   - shouldClear: ${sessionState.isPaying && sessionState.payingUser === currentUsername}`);
      }
    };
  }, [currentUsername]);

  // Periodic session storage monitoring for debugging
  useEffect(() => {
    if (!currentUsername) return;
    
    console.log(`👀 Starting session storage monitoring for ${currentUsername}`);
    let lastSessionValue = '';
    
    const monitor = setInterval(() => {
      const key = getSessionStorageKey();
      const currentValue = key ? (sessionStorage.getItem(key) || '') : '';
      
      if (currentValue !== lastSessionValue) {
        console.log(`👀 Session storage changed for ${currentUsername}:`, {
          key,
          oldValue: lastSessionValue || 'empty',
          newValue: currentValue || 'empty',
          timestamp: new Date().toISOString()
        });
        lastSessionValue = currentValue;
      }
    }, 1000);
    
    return () => {
      console.log(`👀 Stopping session storage monitoring for ${currentUsername}`);
      clearInterval(monitor);
    };
  }, [currentUsername]);
  
  // Handle showing payment confirmation modal
  const handlePaymentButtonClick = async () => {
    console.log(`🔒 === PAYMENT BUTTON CLICK START ===`);
    console.log(`🔒 Payment button clicked by ${currentUsername}`);
    console.log(`🔒 Current Firebase state: isPaying=${isPaying}, payingUser=${payingUser}`);
    console.log(`🔒 Current effective state: isPaying=${effectiveIsPaying}, payingUser=${effectivePayingUser}`);
    console.log(`🔒 Database object exists: ${!!database}`);
    console.log(`🔒 Current URL: ${window.location.pathname}`);
    
    // Check if someone else is already paying (use effective state)
    if (effectiveIsPaying && effectivePayingUser && effectivePayingUser !== currentUsername) {
      console.log(`🚫 Blocking payment - ${effectivePayingUser} is already paying (from ${isPaying ? 'Firebase' : 'Session Storage'})`);
      alert(`${effectivePayingUser}님이 이미 결제 중입니다. 잠시 후 다시 시도해주세요.`);
      return;
    }

    // Get room ID (username is already available as currentUsername prop)
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;
    
    console.log(`🔒 Extracted data:`);
    console.log(`   - roomId: ${roomId}`);
    console.log(`   - roomIdMatch: ${roomIdMatch}`);
    console.log(`   - currentUserId: ${currentUserId}`);
    console.log(`   - currentUsername (prop): ${currentUsername}`);
    
    // Debug the condition check
    const hasRoomId = !!roomId;
    const hasDatabase = !!database;
    const hasUserName = !!currentUsername;
    const conditionMet = roomId && database && currentUsername;
    
    console.log(`🔒 Condition checks:`);
    console.log(`   - hasRoomId: ${hasRoomId}`);
    console.log(`   - hasDatabase: ${hasDatabase}`);
    console.log(`   - hasUserName: ${hasUserName}`);
    console.log(`   - conditionMet: ${conditionMet}`);
    
    // Set ispaying status in Firebase immediately when modal shows
    if (roomId && database && currentUsername) {
      try {
        console.log(`🔒 Attempting to set Firebase ispaying status...`);
        const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
        console.log(`🔒 Firebase ref created: ${isPayingRef.toString()}`);
        
        const paymentData = {
          status: true,
          user: currentUsername,
          timestamp: new Date().toISOString()
        };
        console.log(`🔒 Payment data to set: ${JSON.stringify(paymentData)}`);
        
        await set(isPayingRef, paymentData);
        
        // Also store in session storage immediately for this user
        setSessionStoragePaymentState(true, currentUsername);
        
        console.log(`✅ Successfully set ispaying to true for user: ${currentUsername}`);
        console.log(`✅ Showing payment confirmation modal...`);
        
        // Show payment confirmation modal
        setShowPaymentConfirmModal(true);
        console.log(`🎯 Modal state set to true, showPaymentConfirmModal: ${true}`);
        
      } catch (error) {
        console.error('❌ Failed to set ispaying status:', error);
        console.error('❌ Error details:', error);
        alert('결제 상태 설정에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    } else {
      console.log(`❌ Cannot proceed - missing required data:`);
      console.log(`   - roomId: ${roomId || 'MISSING'}`);
      console.log(`   - database: ${database ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - currentUsername: ${currentUsername || 'MISSING'}`);
      
      alert('결제를 진행할 수 없습니다. 페이지를 새로고침해주세요.');
    }
    console.log(`🔒 === PAYMENT BUTTON CLICK END ===`);
  };

  // Handle payment confirmation
  const handlePaymentConfirm = () => {
    console.log(`💳 Payment confirmed by ${currentUsername}`);
    
    // Get room ID (username already available as prop)
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;
    
    // Store data in payment store
    if (roomId) setRoomId(roomId);
    if (currentUsername) setUserName(currentUsername);
    
    // Close modal
    setShowPaymentConfirmModal(false);
    
    console.log('🚀 Redirecting to payment checkout');
    // Redirect to payment checkout
    router.push('/payment/checkout');
  };

  // Handle payment cancellation
  const handlePaymentCancel = async () => {
    console.log(`❌ Payment cancelled by ${currentUsername}`);
    
    // Get room ID
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;
    
    // Clear ispaying status in Firebase
    if (roomId && database) {
      try {
        const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
        await remove(isPayingRef);
        console.log(`✅ Successfully cleared ispaying status in Firebase`);
        
        // Signal all users to clear their session storage
        const clearSessionSignalRef = ref(database, `rooms/${roomId}/clearPaymentSession`);
        await set(clearSessionSignalRef, {
          timestamp: new Date().toISOString(),
          reason: 'payment_cancelled',
          clearedBy: currentUsername
        });
        console.log('✅ Session storage clear signal sent to all users for payment cancellation');
        
        // Remove the signal after a short delay to clean up
        setTimeout(() => {
          remove(clearSessionSignalRef).catch(error => {
            console.error('❌ Failed to remove session clear signal:', error);
          });
        }, 2000);
        
      } catch (error) {
        console.error('❌ Failed to clear ispaying status or send clear signal:', error);
      }
    }
    
    // Clear local session storage
    setSessionStoragePaymentState(false, null);
    console.log(`✅ Cleared local session storage payment state`);
    
    // Close modal
    setShowPaymentConfirmModal(false);
  };
  
  // Check if current user can request retrial (must have bought appeal rights)
  const canRequestRetrial = (): boolean => {
    return paidUsers[currentUsername] === true;
  };
  
  // 유틸리티 함수들
  const allUsersReady = (): boolean => {
    const userCount = roomUsers
      .filter(user => !user.username.includes('System') && user.username !== 'System')
      .length;
    const readyCount = Object.values(readyUsers).filter(isReady => isReady).length;
    return userCount > 0 && readyCount === userCount;
  };

  const checkAllUsersReady = (): boolean => {
    const allRealUsers = roomUsers.filter(user => 
      !user.username.includes('System') && 
      user.username !== 'System'
    );
    
    const readyCount = Object.keys(postVerdictReadyUsers).length;
    const expectedCount = allRealUsers.length;
    
    if (readyCount >= expectedCount) {
      return true;
    }
    
    for (const user of allRealUsers) {
      if (!postVerdictReadyUsers[user.id]) {
        return false;
      }
    }
    
    return true;
  };

  const getNotReadyUsers = () => {
    const allRealUsers = roomUsers.filter(user => 
      !user.username.includes('System') && 
      user.username !== 'System'
    );
    return allRealUsers.filter(user => !postVerdictReadyUsers[user.id]);
  };

  // 재판이 활성화되지 않고 최종 판결도 트리거되지 않은 경우 - 재판 준비 상태
  if (!timerActive && !finalVerdictTriggered) {
    return (
      <div className="flex flex-col items-center space-y-3 h-auto w-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center justify-center">
            <Gavel className="h-5 w-5 mr-2 text-pink-600" />
            재판 진행 준비
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            모든 참석자의 준비가 완료되면 재판을 시작할 수 있습니다.
          </p>
        </div>

        {/* 공유하기 버튼 */}
        {onShare && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
          >
            <Share className="w-4 h-4 mr-2" />
            법정 링크 공유하기
          </motion.button>
        )}

        {/* 판결 다시보기 버튼 */}
        {onViewVerdictHistory && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewVerdictHistory}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center"
          >
            <History className="w-4 h-4 mr-2" />
            판결 다시보기
          </motion.button>
        )}
        
        {/* 재판 준비 완료 버튼 */}
        {!readyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUserReady}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-pink-700 hover:to-purple-800 flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            재판 준비 완료
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-sm text-green-700 font-medium">준비 완료! 다른 참석자 대기 중...</span>
          </div>
        )}
        
        {/* 재판 개시 선언 버튼 (호스트만) */}
        {isRoomHost ? (
          <motion.button
            whileHover={{ scale: allUsersReady() ? 1.02 : 1 }}
            whileTap={{ scale: allUsersReady() ? 0.98 : 1 }}
            onClick={onInitiateCourt}
            disabled={!allUsersReady()}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              allUsersReady()
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-xl hover:from-red-700 hover:to-red-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Gavel className="w-4 h-4 mr-2" />
            재판 개시 선언
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">방장만 재판을 시작할 수 있습니다</span>
          </div>
        )}
        
        {/* 안내 메시지 */}
        {!allUsersReady() && isRoomHost && (
          <div className="w-full max-w-[280px] py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 mr-2 text-yellow-600" />
            <span className="text-xs text-yellow-700">모든 참석자가 준비되어야 재판을 시작할 수 있습니다</span>
          </div>
        )}
      </div>
    );
  }

  // 최종 판결이 트리거되고 타이머가 비활성화된 경우 - 비호스트 상태
  if (finalVerdictTriggered && !timerActive && !isRoomHost) {
    return (
      <div className="flex flex-col items-center space-y-3 h-auto w-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center">
            <Gavel className="h-5 w-5 mr-2 text-amber-600" />
            판결 완료
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            새로운 재판을 위한 준비를 해주세요.
          </p>
        </div>

        {/* 공유하기 버튼 */}
        {/* {onShare && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
          >
            <Share className="w-4 h-4 mr-2" />
            법정 링크 공유하기
          </motion.button>
        )} */}

        {/* 판결 다시보기 버튼 */}
        {onViewVerdictHistory && (
          <motion.button
            whileHover={{ scale: !isHostViewingCourtReadyModal ? 1.02 : 1 }}
            whileTap={{ scale: !isHostViewingCourtReadyModal ? 0.98 : 1 }}
            onClick={!isHostViewingCourtReadyModal ? onViewVerdictHistory : undefined}
            disabled={isHostViewingCourtReadyModal}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              isHostViewingCourtReadyModal
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:from-indigo-600 hover:to-purple-700'
            }`}
            title={isHostViewingCourtReadyModal ? '호스트가 재판 준비 중입니다...' : ''}
          >
            <History className="w-4 h-4 mr-2" />
            판결 다시보기
          </motion.button>
        )}

        {/* 재심 요청 버튼 */}
        {onRequestRetrial && (
          <motion.button
            whileHover={{ scale: canRequestRetrial() ? 1.02 : 1 }}
            whileTap={{ scale: canRequestRetrial() ? 0.98 : 1 }}
            onClick={canRequestRetrial() ? onRequestRetrial : undefined}
            disabled={!canRequestRetrial()}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              !canRequestRetrial()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-red-600'
            }`}
            title={!canRequestRetrial() ? '항소권을 구매한 사용자만 재심을 요청할 수 있습니다' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            재심 요청
          </motion.button>
        )}
        
        {/* 항소권 구매 (비호스트) */}
        {!postVerdictReadyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: (!effectiveIsPaying || effectivePayingUser === currentUsername) ? 1.02 : 1 }}
            whileTap={{ scale: (!effectiveIsPaying || effectivePayingUser === currentUsername) ? 0.98 : 1 }}
            onClick={() => {
              console.log(`🔘 === BUTTON CLICK DEBUG START ===`);
              console.log(`🔘 Button clicked by ${currentUsername}`);
              console.log(`🔘 Firebase state - isPaying: ${isPaying}, payingUser: ${payingUser}`);
              console.log(`🔘 Effective state - isPaying: ${effectiveIsPaying}, payingUser: ${effectivePayingUser}`);
              console.log(`🔘 Should block: ${effectiveIsPaying && effectivePayingUser !== currentUsername}`);
              console.log(`🔘 Condition (!effectiveIsPaying || effectivePayingUser === currentUsername): ${!effectiveIsPaying || effectivePayingUser === currentUsername}`);
              console.log(`🔘 About to call handlePaymentButtonClick...`);
              
              if (!effectiveIsPaying || effectivePayingUser === currentUsername) {
                handlePaymentButtonClick();
              } else {
                console.log('🚫 Click blocked - another user is paying');
              }
              console.log(`🔘 === BUTTON CLICK DEBUG END ===`);
            }}
            disabled={effectiveIsPaying && effectivePayingUser !== currentUsername}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              effectiveIsPaying && effectivePayingUser !== currentUsername
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700'
            }`}
            title={effectiveIsPaying && effectivePayingUser !== currentUsername ? `${effectivePayingUser}님이 결제 중입니다. 잠시 후 다시 시도해주세요.` : ''}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {effectiveIsPaying && effectivePayingUser === currentUsername ? '결제 진행 중...' : '항소권 구매 및 준비완료'}
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">준비 완료! 호스트와 다른 참석자 대기 중...</span>
          </div>
        )}
        
        {/* Payment Confirmation Modal */}
        <PaymentConfirmModal
          isOpen={showPaymentConfirmModal}
          onClose={handlePaymentCancel}
          onConfirm={handlePaymentConfirm}
          userName={currentUsername}
        />
        
        <div className="w-full max-w-[280px] py-2.5 px-4 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed">
          <Gavel className="w-4 h-4 mr-2" />
          <span className="font-medium">재판 개시 불가</span>
        </div>
        
        <div className="w-full max-w-[280px] py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-2 text-amber-600" />
          <span className="text-xs text-amber-700 font-semibold">호스트만 재판을 시작할 수 있습니다</span>
        </div>
      </div>
    );
  }

  // 최종 판결이 트리거되고 타이머가 비활성화된 경우 - 호스트 상태
  if (finalVerdictTriggered && !timerActive && isRoomHost) {
    const notReadyUsers = getNotReadyUsers();
    
    return (
      <div className="flex flex-col items-center space-y-3 h-auto w-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center">
            <Gavel className="h-5 w-5 mr-2 text-amber-600" />
            최종 판결 완료
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {Object.values(postVerdictReadyUsers).filter(isReady => isReady).length}/{roomUsers.filter(user => !user.username.includes('System')).length} 참석자가 새 재판 준비를 완료했습니다.
          </p>
        </div>

        {/* 판결 다시보기 버튼 */}
        {onViewVerdictHistory && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewVerdictHistory}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center"
          >
            <History className="w-4 h-4 mr-2" />
            판결 다시보기
          </motion.button>
        )}

        {/* 재심 요청 버튼 */}
        {onRequestRetrial && (
          <motion.button
            whileHover={{ scale: canRequestRetrial() ? 1.02 : 1 }}
            whileTap={{ scale: canRequestRetrial() ? 0.98 : 1 }}
            onClick={canRequestRetrial() ? onRequestRetrial : undefined}
            disabled={!canRequestRetrial()}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              !canRequestRetrial()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-red-600'
            }`}
            title={!canRequestRetrial() ? '항소권을 구매한 사용자만 재심을 요청할 수 있습니다' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            재심 요청
          </motion.button>
        )}
        
        {/* 항소권 구매 (호스트) */}
        {!postVerdictReadyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: (!effectiveIsPaying || effectivePayingUser === currentUsername) ? 1.02 : 1 }}
            whileTap={{ scale: (!effectiveIsPaying || effectivePayingUser === currentUsername) ? 0.98 : 1 }}
            onClick={() => {
              console.log(`🔘 === BUTTON CLICK DEBUG START (HOST) ===`);
              console.log(`🔘 Button clicked by ${currentUsername} (HOST)`);
              console.log(`🔘 Firebase state - isPaying: ${isPaying}, payingUser: ${payingUser}`);
              console.log(`🔘 Effective state - isPaying: ${effectiveIsPaying}, payingUser: ${effectivePayingUser}`);
              console.log(`🔘 Should block: ${effectiveIsPaying && effectivePayingUser !== currentUsername}`);
              console.log(`🔘 Condition (!effectiveIsPaying || effectivePayingUser === currentUsername): ${!effectiveIsPaying || effectivePayingUser === currentUsername}`);
              console.log(`🔘 About to call handlePaymentButtonClick...`);
              
              if (!effectiveIsPaying || effectivePayingUser === currentUsername) {
                handlePaymentButtonClick();
              } else {
                console.log('🚫 Click blocked - another user is paying');
              }
              console.log(`🔘 === BUTTON CLICK DEBUG END (HOST) ===`);
            }}
            disabled={effectiveIsPaying && effectivePayingUser !== currentUsername}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              effectiveIsPaying && effectivePayingUser !== currentUsername
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700'
            }`}
            title={effectiveIsPaying && effectivePayingUser !== currentUsername ? `${effectivePayingUser}님이 결제 중입니다. 잠시 후 다시 시도해주세요.` : ''}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {effectiveIsPaying && effectivePayingUser === currentUsername ? '결제 진행 중...' : '항소권 구매 및 준비완료'}
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">호스트 준비 완료! 다른 참석자 대기 중...</span>
          </div>
        )}
        
        {/* Payment Confirmation Modal */}
        <PaymentConfirmModal
          isOpen={showPaymentConfirmModal}
          onClose={handlePaymentCancel}
          onConfirm={handlePaymentConfirm}
          userName={currentUsername}
        />
        
        {/* 새 재판 개시 선언 버튼 */}
        {/* {checkAllUsersReady() && !isRetrialInProgress ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartNewTrial}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center"
          >
            <Gavel className="w-4 h-4 mr-2" />
            새 재판 개시 선언
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed">
            <Gavel className="w-4 h-4 mr-2" />
            <span className="font-medium">
              {isRetrialInProgress ? '재심 진행 중...' : '새 재판 개시 선언 (준비 중...)'}
            </span>
          </div>
        )} */}
        
        {/* 대기 중인 참석자 안내 */}
        <div className="w-full max-w-[280px] py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
          <Scale className="w-3.5 h-3.5 mr-2 text-yellow-600" />
          <span className="text-xs text-yellow-700">
            재심 기능은 준비중입니다!
          </span>
        </div>
      </div>
    );
  }

  // 재판 준비 버튼 표시 (비호스트 클라이언트용)
  if (showTrialReadyButton) {
    return (
      <div className="flex flex-col items-center space-y-3 h-auto w-full">
        {/* 공유하기 버튼 */}
        {onShare && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
          >
            <Share className="w-4 h-4 mr-2" />
            법정 링크 공유하기
          </motion.button>
        )}

        {/* 판결 다시보기 버튼 */}
        {onViewVerdictHistory && (
          <motion.button
            whileHover={{ scale: !isHostViewingCourtReadyModal ? 1.02 : 1 }}
            whileTap={{ scale: !isHostViewingCourtReadyModal ? 0.98 : 1 }}
            onClick={!isHostViewingCourtReadyModal ? onViewVerdictHistory : undefined}
            disabled={isHostViewingCourtReadyModal}
            className={`w-full max-w-[280px] py-2.5 px-4 font-medium rounded-lg transition-all shadow-lg flex items-center justify-center ${
              isHostViewingCourtReadyModal
                ? 'bg-gray-300 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:from-indigo-600 hover:to-purple-700'
            }`}
            title={isHostViewingCourtReadyModal ? '호스트가 재판 준비 중입니다...' : ''}
          >
            <History className="w-4 h-4 mr-2" />
            판결 다시보기
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTrialReady}
          className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center"
        >
          <Gavel className="w-4 h-4 mr-2" />
          재판 준비 완료
        </motion.button>
      </div>
    );
  }

  // 기본 비활성화 상태
  return (
    <div className="flex flex-col items-center space-y-3 h-auto w-full">
      {/* 공유하기 버튼 */}
      {onShare && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
        >
          <Share className="w-4 h-4 mr-2" />
          법정 링크 공유하기
        </motion.button>
      )}

      {/* 판결 다시보기 버튼 */}
      {onViewVerdictHistory && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewVerdictHistory}
          className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center"
        >
          <History className="w-4 h-4 mr-2" />
          판결 다시보기
        </motion.button>
      )}

      <div className="w-full max-w-[280px] py-2.5 px-4 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">판사가 최종 판결을 준비 중입니다...</span>
      </div>
      
      <div className="w-full max-w-[280px] py-2.5 px-4 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed">
        <Gavel className="w-4 h-4 mr-2" />
        <span className="font-medium">제출</span>
      </div>
    </div>
  );
} 