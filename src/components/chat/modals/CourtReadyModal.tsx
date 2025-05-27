import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';

interface CourtReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  isRetrial?: boolean;
}

export default function CourtReadyModal({ isOpen, onClose, onStartTrial, isRetrial = false }: CourtReadyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
        className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-[350px] w-full p-6 border border-pink-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center mb-4">
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium compact-btn"
            >
              취소
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartTrial}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg compact-btn"
            >
              <div className="flex items-center">
                <Gavel className="w-4 h-4 mr-2" />
                {isRetrial ? '재심 시작' : '재판 시작'}
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 