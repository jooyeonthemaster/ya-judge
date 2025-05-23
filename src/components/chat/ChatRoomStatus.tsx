import { motion } from 'framer-motion';
import { 
  Gavel, 
  CheckCircle2, 
  AlertTriangle, 
  Scale 
} from 'lucide-react';

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
  
  // 핸들러 함수들
  onUserReady: () => void;
  onInitiateCourt: () => void;
  onTrialReady: () => void;
  onStartNewTrial: () => void;
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
  onUserReady,
  onInitiateCourt,
  onTrialReady,
  onStartNewTrial
}: ChatRoomStatusProps) {
  
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
      <div className="flex flex-col items-start h-auto">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center compact-text">
          <Gavel className="h-5 w-5 mr-2 text-pink-600" />
          재판 진행 준비
        </h3>
        <p className="text-sm text-gray-600 text-center compact-text">
          모든 참석자의 준비가 완료되면 재판을 시작할 수 있습니다.
        </p>
        
        {!readyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUserReady}
            className="px-4 py-1 mt-1 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-pink-700 hover:to-purple-800 compact-btn"
          >
            재판 준비 완료
          </motion.button>
        ) : (
          <div className="text-sm text-pink-600 font-medium compact-text flex items-center mt-1">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-pink-600" />
            준비 완료! 다른 참석자를 기다리는 중...
          </div>
        )}
        
        {isRoomHost ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onInitiateCourt}
            disabled={!allUsersReady()}
            className={`px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn ${
              allUsersReady()
                ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:shadow-xl hover:from-pink-700 hover:to-purple-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center">
              <Gavel className="w-4 h-4 mr-2" />
              재판 개시 선언
            </div>
          </motion.button>
        ) : (
          <div className="text-sm text-amber-600 compact-text flex items-center mt-1">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
            방장만 재판을 시작할 수 있습니다.
          </div>
        )}
        
        {!allUsersReady() && isRoomHost && (
          <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
            <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" />
            모든 참석자가 준비되어야 재판을 시작할 수 있습니다.
          </p>
        )}
      </div>
    );
  }

  // 최종 판결이 트리거되고 타이머가 비활성화된 경우 - 비호스트 상태
  if (finalVerdictTriggered && !timerActive && !isRoomHost) {
    return (
      <div className="flex flex-col items-start h-auto">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center compact-text">
          <Gavel className="h-5 w-5 mr-2 text-amber-600" />
          판결 완료
        </h3>
        <p className="text-sm text-gray-600 text-center compact-text">
          이 채팅방의 최종 판결이 완료되었습니다.
        </p>
        
        <div className="px-4 py-1 mt-1 font-medium rounded-lg shadow-sm compact-btn bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 flex items-center">
          <Gavel className="w-4 h-4 mr-2" />
          재판 개시 불가
        </div>
        
        <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
          <strong>호스트만 재판을 시작할 수 있습니다.</strong>
        </p>
      </div>
    );
  }

  // 최종 판결이 트리거되고 타이머가 비활성화된 경우 - 호스트 상태
  if (finalVerdictTriggered && !timerActive && isRoomHost) {
    const notReadyUsers = getNotReadyUsers();
    
    return (
      <div className="flex flex-col items-start h-auto">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 flex items-center compact-text">
          <Gavel className="h-5 w-5 mr-2 text-amber-600" />
          최종 판결 완료
        </h3>
        <p className="text-sm text-gray-600 text-center compact-text">
          {Object.values(postVerdictReadyUsers).filter(isReady => isReady).length}/{roomUsers.filter(user => !user.username.includes('System')).length} 참석자가 새 재판 준비를 완료했습니다.
        </p>
        
        {!postVerdictReadyUsers[currentUserId] ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTrialReady}
            className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
          >
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              재판 준비 완료 (호스트)
            </div>
          </motion.button>
        ) : (
          <div className="text-sm text-amber-600 font-medium compact-text flex items-center mt-1">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-600" />
            호스트 준비 완료! 다른 참석자를 기다리는 중...
          </div>
        )}
        
        {checkAllUsersReady() ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartNewTrial}
            className="px-4 py-1 mt-1 font-medium rounded-lg transition-all shadow-lg compact-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
          >
            <div className="flex items-center">
              <Gavel className="w-4 h-4 mr-2" />
              새 재판 개시 선언
            </div>
          </motion.button>
        ) : (
          <div className="px-4 py-1 mt-1 font-medium rounded-lg shadow-sm compact-btn bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 flex items-center">
            <Gavel className="w-4 h-4 mr-2" />
            새 재판 개시 선언 (준비 중...)
          </div>
        )}
        
        {notReadyUsers.length > 0 && (
          <p className="text-xs text-amber-600 compact-text flex items-center mt-1">
            <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" />
            <strong>
              아직 준비되지 않은 참석자: {notReadyUsers.map(u => u.username).join(', ')}
            </strong>
          </p>
        )}
      </div>
    );
  }

  // 재판 준비 버튼 표시 (비호스트 클라이언트용)
  if (showTrialReadyButton) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTrialReady}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700"
        >
          <div className="flex items-center">
            <Gavel className="w-5 h-5 mr-2" />
            재판 준비 완료
          </div>
        </motion.button>
      </div>
    );
  }

  // 기본 비활성화 상태
  return (
    <div className="flex items-center space-x-2 h-full">
      <div className="flex-1 h-[50px] min-h-[50px] max-h-[50px] px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-sm">판사가 최종 판결을 준비 중입니다...</span>
      </div>
      <button
        disabled
        className="px-4 h-[50px] rounded-lg font-medium transition-all shadow-sm bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        <div className="flex items-center">
          <Gavel className="w-4 h-4 mr-2" />
          제출
        </div>
      </button>
    </div>
  );
} 