'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Clock } from 'lucide-react';

interface Step2RelationshipProps {
  formData: {
    plaintiff: string;
    defendant: string;
    relationship: string;
    duration: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step2Relationship({ formData, setFormData, onNext, onPrevious }: Step2RelationshipProps) {
  const validateStep = () => {
    if (!formData.plaintiff.trim() || !formData.defendant.trim()) {
      alert('원고와 피고를 모두 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const relationshipTypes = [
    { value: '연인', label: '연인', icon: Heart, color: 'from-pink-400 to-rose-500' },
    { value: '부부', label: '부부', icon: Users, color: 'from-purple-400 to-indigo-500', disabled: true },
    { value: '썸', label: '썸', icon: Heart, color: 'from-orange-400 to-red-500', disabled: true },
    { value: '기타', label: '기타', icon: Users, color: 'from-gray-400 to-gray-500', disabled: true }
  ];

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
          className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-700">
            관계 정보
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            갈등 당사자들의 관계 정보를 입력해주세요.<br/>
            <span className="text-purple-600 font-semibold">익명으로 처리되니 안심하세요!</span>
          </p>
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-6">
        {/* 당사자 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-bold text-gray-800 mb-3">
              원고 (신청인) <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={formData.plaintiff}
              onChange={(e) => setFormData(prev => ({ ...prev, plaintiff: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
              placeholder="별명 또는 이니셜"
              maxLength={10}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-bold text-gray-800 mb-3">
              피고 (상대방) <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={formData.defendant}
              onChange={(e) => setFormData(prev => ({ ...prev, defendant: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
              placeholder="별명 또는 이니셜"
              maxLength={10}
            />
          </motion.div>
        </div>

        {/* 관계 유형 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-4">연애 관계</label>
          <div className="grid grid-cols-2 gap-3">
            {relationshipTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <motion.label
                  key={type.value}
                  className={`relative cursor-pointer ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={!type.disabled ? { scale: 1.02 } : {}}
                  whileTap={!type.disabled ? { scale: 0.98 } : {}}
                >
                  <input
                    type="radio"
                    name="relationship"
                    value={type.value}
                    checked={formData.relationship === type.value}
                    onChange={(e) => {
                      if (!type.disabled) {
                        setFormData(prev => ({ ...prev, relationship: e.target.value }));
                      }
                    }}
                    disabled={type.disabled}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.relationship === type.value
                      ? `border-purple-500 bg-gradient-to-br ${type.color} text-white shadow-lg`
                      : type.disabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      <IconComponent className="w-5 h-5" />
                      <span className="font-semibold">{type.label}</span>
                    </div>
                    {type.disabled && (
                      <p className="text-xs text-center mt-1">준비 중</p>
                    )}
                  </div>
                </motion.label>
              );
            })}
          </div>
        </motion.div>

        {/* 연애 기간 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-3">
            <Clock className="w-4 h-4 inline mr-2" />
            연애 기간
          </label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
            placeholder="예: 6개월, 2년 3개월"
          />
          <p className="text-xs text-gray-500 mt-2">대략적인 기간을 입력해주세요</p>
        </motion.div>
      </div>

      {/* 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex justify-between pt-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPrevious}
          className="px-6 py-3 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-200"
        >
          ← 이전
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!formData.plaintiff.trim() || !formData.defendant.trim()}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${
            formData.plaintiff.trim() && formData.defendant.trim()
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          다음 단계로 →
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 