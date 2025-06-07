import { motion } from 'framer-motion';
import { CreditCard, X } from 'lucide-react';

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export default function PaymentConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName 
}: PaymentConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
        className="bg-gradient-to-b from-white to-amber-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(245,158,11,0.2)] max-w-[380px] w-full p-6 border border-amber-100 relative overflow-hidden mx-4"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-700 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-amber-600" />
              항소권 구매 확인
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">💳 결제 안내</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• 항소권 구매비용: 1,000원</li>
                <li>• 구매 후 재심 요청 권한 획득</li>
                <li>• 결제 페이지로 이동됩니다</li>
              </ul>
            </div>

            <p className="text-gray-700 text-sm">
              <span className="font-medium text-amber-700">{userName}</span>님, 
              항소권을 구매하시겠습니까? 결제 페이지로 이동하여 안전하게 결제를 진행할 수 있습니다.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700 font-medium">
                ⚠️ 결제 진행 중에는 다른 사용자의 항소권 구매가 일시 제한됩니다.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all font-medium shadow-lg"
            >
              <div className="flex items-center justify-center">
                <CreditCard className="w-4 h-4 mr-2" />
                결제하기
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 