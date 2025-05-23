import { motion } from 'framer-motion';
import { AlertTriangle, Gavel } from 'lucide-react';

interface HostLeftModalProps {
  isOpen: boolean;
  onRedirectToHome: () => void;
}

export default function HostLeftModal({ isOpen, onRedirectToHome }: HostLeftModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
        className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-[350px] w-full p-6 border border-red-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            판사가 퇴정했습니다
          </h2>
          <p className="mb-5 text-gray-800 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            방장이 법정을 나갔습니다. 더 이상 재판이 진행될 수 없습니다.
          </p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRedirectToHome}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg hover:from-pink-700 hover:to-purple-800 font-medium shadow-lg"
            >
              <div className="flex items-center">
                <Gavel className="w-4 h-4 mr-2" />
                메인으로 돌아가기
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 