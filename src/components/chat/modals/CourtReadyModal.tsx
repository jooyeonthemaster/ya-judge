import { motion, AnimatePresence } from 'framer-motion';
import { Gavel } from 'lucide-react';

interface CourtReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  isRetrial?: boolean;
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

export default function CourtReadyModal({ isOpen, onClose, onStartTrial, isRetrial = false }: CourtReadyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
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
            className="bg-white rounded-2xl shadow-xl max-w-[350px] w-full p-6 border border-pink-200 relative mx-4"
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Simplified decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full opacity-30 -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full opacity-30 -ml-10 -mb-10" />
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-pink-700 flex items-center mb-4">
                <Gavel className="h-5 w-5 mr-2 text-pink-600" />
                {isRetrial ? '재심 시작' : '실시간 AI 판사 재판'}
              </h2>
              <p className="mb-4 text-gray-800 text-sm">
                {isRetrial 
                  ? '모든 참가자가 재심에 동의했습니다. 재심을 시작하시겠습니까? 5분 타이머가 시작되며, 시간이 종료되면 AI 판사가 최종 판결을 내립니다.'
                  : '이 모드에서는 참석자들이 변론을 진행하는 동안 AI 판사가 공정하게 심리합니다. 5분 타이머가 시작되며, 시간이 종료되면 AI 판사가 최종 판결을 내립니다.'
                }
              </p>
              <div className="flex justify-between">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium compact-btn"
                  style={{ willChange: 'transform' }}
                >
                  취소
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onStartTrial}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg compact-btn"
                  style={{ willChange: 'transform' }}
                >
                  <div className="flex items-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    {isRetrial ? '재심 시작' : '재판 시작'}
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 