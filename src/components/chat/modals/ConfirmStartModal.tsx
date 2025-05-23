import { motion } from 'framer-motion';
import { AlertTriangle, Gavel } from 'lucide-react';

interface ConfirmStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmStartModal({ isOpen, onClose, onConfirm }: ConfirmStartModalProps) {
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
          <h2 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-pink-600" />
            재판 개시 확인
          </h2>
          <p className="mb-4 text-gray-800 text-sm bg-pink-50 p-3 rounded-lg border border-pink-100">
            재판 과정에서 감정이 격해질 수 있습니다. 상호 존중하는 자세로 진행해주시기 바랍니다.
          </p>
          <div className="flex flex-col space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg compact-btn"
            >
              <div className="flex items-center justify-center">
                <Gavel className="w-4 h-4 mr-2" />
                재판 개시를 선언합니다
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium compact-btn"
            >
              취소
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 