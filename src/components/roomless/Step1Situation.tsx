'use client';

import { motion } from 'framer-motion';
import { FileText, AlertCircle } from 'lucide-react';

interface Step1SituationProps {
  formData: {
    title: string;
    description: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  onNext: () => void;
}

export default function Step1Situation({ formData, setFormData, onNext }: Step1SituationProps) {
  const validateStep = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('제목과 갈등 상황을 모두 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
        >
          <FileText className="w-10 h-10 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700">
            갈등 상황 설명
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            객관적이고 구체적으로 상황을 설명해주세요.<br/>
            <span className="text-pink-600 font-semibold">정확한 판결을 위해 솔직한 내용이 중요해요!</span>
          </p>
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-3">
            제목 <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
            placeholder="갈등 상황을 한 줄로 요약해주세요"
            maxLength={50}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">예: 데이트 비용 분담 문제, 연락 빈도 갈등 등</p>
            <span className="text-xs text-gray-400">{formData.title.length}/50</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-3">
            갈등 상황 설명 <span className="text-pink-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none h-40 transition-all duration-200 text-gray-800 placeholder-gray-400"
            placeholder="언제, 어디서, 무엇이, 어떻게 일어났는지 구체적으로 설명해주세요. 감정적인 표현보다는 사실 위주로 작성하시면 더 정확한 판결을 받을 수 있어요."
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-xs text-amber-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>구체적이고 객관적인 설명일수록 정확한 판결을 받을 수 있어요</span>
            </div>
            <span className="text-xs text-gray-400">{formData.description.length}자</span>
          </div>
        </motion.div>
      </div>

      {/* 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end pt-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!formData.title.trim() || !formData.description.trim()}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${
            formData.title.trim() && formData.description.trim()
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          다음 단계로 →
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 