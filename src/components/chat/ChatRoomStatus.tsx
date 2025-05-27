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
  
  // 재심 상태
  isRetrialInProgress?: boolean;
  
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
  isRetrialInProgress = false,
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
  
  // Handle payment redirection
  const handlePaymentRedirect = () => {
    // Get room ID from current URL
    const currentUrl = window.location.pathname;
    const roomIdMatch = currentUrl.match(/\/room\/([^\/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;
    
    // Get current user name
    const currentUser = roomUsers.find(user => user.id === currentUserId);
    const userName = currentUser?.username || '';
    
    // Store data in payment store
    if (roomId) setRoomId(roomId);
    if (userName) setUserName(userName);
    
    // Redirect to payment checkout
    router.push('/payment/checkout');
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

        {/* 재심 요청 버튼 */}
        {onRequestRetrial && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRequestRetrial}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            재심 요청
          </motion.button>
        )}
        
        {/* 재판 준비 완료 버튼 (비호스트) */}
        {!postVerdictReadyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePaymentRedirect}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            새 재판 준비 완료
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">준비 완료! 호스트와 다른 참석자 대기 중...</span>
          </div>
        )}
        
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRequestRetrial}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            재심 요청
          </motion.button>
        )}
        
        {/* 재판 준비 완료 버튼 (호스트) */}
        {!postVerdictReadyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePaymentRedirect}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            재판 준비 완료 (호스트)
          </motion.button>
        ) : (
          <div className="w-full max-w-[280px] py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">호스트 준비 완료! 다른 참석자 대기 중...</span>
          </div>
        )}
        
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
        {notReadyUsers.length > 0 && (
          <div className="w-full max-w-[280px] py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 mr-2 text-yellow-600" />
            <span className="text-xs text-yellow-700">
              아직 준비되지 않은 참석자: {notReadyUsers.map(u => u.username).join(', ')}
            </span>
          </div>
        )}
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewVerdictHistory}
            className="w-full max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center"
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