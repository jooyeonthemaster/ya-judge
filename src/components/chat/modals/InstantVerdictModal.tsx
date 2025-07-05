'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface InstantVerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onAgree: () => void;
  currentUsername: string;
  participatingUsers: Array<{ id: string; username: string }>;
  agreedUsers: Record<string, boolean>;
  paidUsers: Record<string, boolean>;
  timeLeft: number;
  
  // Annotation props for customizable content
  modalTitle?: string;
  modalDescription?: string;
  confirmationMessage?: string;
  successMessage?: string;
  agreeButtonText?: string;
  icon?: React.ReactNode;
}

// Optimized animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10
  }
};

const buttonVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

export default function InstantVerdictModal({ 
  isOpen, 
  onClose, 
  onCancel,
  onAgree,
  currentUsername,
  participatingUsers,
  agreedUsers,
  paidUsers,
  timeLeft,
  
  // Annotation props for customizable content
  modalTitle,
  modalDescription,
  confirmationMessage,
  successMessage,
  agreeButtonText,
  icon
}: InstantVerdictModalProps) {
  const [countdown, setCountdown] = useState(30); // 30초 타임아웃

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // 시간 초과시 onCancel 호출 (타이머 재개 처리)
          // setTimeout을 사용하여 다음 틱에서 호출하여 렌더링 중 상태 업데이트 방지
          setTimeout(() => {
            if (onCancel) {
              onCancel();
            } else {
              onClose();
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, onCancel]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30); // 모달 열릴 때 카운트다운 리셋
    }
  }, [isOpen]);

  const totalUsers = participatingUsers.length;
  const agreedCount = Object.keys(agreedUsers).length;
  const currentUserAgreed = agreedUsers[currentUsername];
  const allAgreed = agreedCount === totalUsers && totalUsers > 0;
  
  // Check if current user has paid for appeal rights
  const currentUserPaid = paidUsers[currentUsername];
  
  // For instant verdict, only count explicit agreements, not paid users
  // Paid users must manually agree to instant verdict just like everyone else
  const effectiveAgreedCount = agreedCount;
  const effectiveAllAgreed = effectiveAgreedCount >= totalUsers && totalUsers > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          style={{ willChange: 'opacity' }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              duration: 0.25, 
              type: "spring", 
              stiffness: 400,
              damping: 25 
            }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto"
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-t-xl relative">
              <button
                onClick={onCancel || onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6" />
                <h2 className="text-lg font-bold" style={{ fontSize: 'clamp(12px, 3.2vw, 16px)' }}>
                  {modalTitle || '⚡ 즉시 판결 요청'}
                </h2>
              </div>
              
              <div className="mt-2 flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span style={{ fontSize: 'clamp(9px, 2.2vw, 12px)' }}>
                  남은 시간: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6">
              <div className="text-center mb-6">
                {effectiveAllAgreed ? (
                  <>
                    <h3 className="text-lg font-semibold text-green-800 mb-2" style={{ fontSize: 'clamp(11px, 2.8vw, 16px)' }}>
                      {successMessage || '🎉 동의했습니다! 다른 사용자를 기다립니다...'}
                    </h3>
                    <p className="text-sm text-green-600" style={{ fontSize: 'clamp(9px, 2.2vw, 12px)' }}>
                      잠시 후 자동으로 판결이 진행됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontSize: 'clamp(11px, 2.8vw, 16px)' }}>
                      {confirmationMessage || '재판을 즉시 종료하고 판결을 받으시겠습니까?'}
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontSize: 'clamp(9px, 2.2vw, 12px)' }}>
                      {modalDescription || `모든 참가자의 동의가 필요합니다. (${effectiveAgreedCount}/${totalUsers})`}
                    </p>
                  </>
                )}
              </div>

              {/* 진행 상황 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">동의 진행률</span>
                  <span className="text-sm text-gray-600">{Math.round((effectiveAgreedCount/totalUsers) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(effectiveAgreedCount/totalUsers) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                    style={{ willChange: 'width' }}
                  />
                </div>
              </div>

              {/* 사용자 목록 */}
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  참가자 동의 현황
                </h4>
                {participatingUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      {user.username}
                      {user.username === currentUsername && ' (나)'}
                    </span>
                    <div className="flex items-center">
                      {agreedUsers[user.username] ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs">동의함</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-xs">
                            {paidUsers[user.username] ? '대기 중 (항소권 보유)' : '대기 중'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 카운트다운 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    자동 취소까지 {countdown}초
                  </span>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex space-x-3">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onCancel || onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  style={{ willChange: 'transform', fontSize: 'clamp(12px, 3vw, 16px)' }}
                >
                  취소
                </motion.button>
                
                                  {currentUserPaid ? (
                    <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium text-center" style={{ fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
                      ⚡ 동의완료 (항소권은 자동으로 소모됩니다.)
                    </div>
                                  ) : !currentUserAgreed ? (
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onAgree}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all font-medium shadow-lg"
                    style={{ willChange: 'transform', fontSize: 'clamp(12px, 3vw, 16px)' }}
                  >
                    {agreeButtonText || '⚡ 동의하기'}
                  </motion.button>
                ) : (
                  <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium text-center" style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>
                    {successMessage || '✅ 동의 완료'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 