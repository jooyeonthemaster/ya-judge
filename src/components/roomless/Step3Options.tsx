'use client';

import { motion } from 'framer-motion';
import { Settings, Flame, User, Plus, X } from 'lucide-react';

interface Step3OptionsProps {
  formData: {
    category: string;
    tags: string[];
    intensity: string;
    character: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step3Options({ 
  formData, 
  setFormData, 
  tagInput, 
  setTagInput, 
  addTag, 
  removeTag, 
  onNext, 
  onPrevious 
}: Step3OptionsProps) {
  const intensityLevels = [
    { value: '순한맛', label: '순한맛', emoji: '😊', color: 'from-green-400 to-emerald-500', description: '부드럽고 따뜻한 판결' },
    { value: '중간맛', label: '중간맛', emoji: '😐', color: 'from-yellow-400 to-orange-500', description: '균형잡힌 공정한 판결' },
    { value: '매운맛', label: '매운맛', emoji: '😤', color: 'from-red-400 to-pink-500', description: '직설적이고 강한 판결' }
  ];

  const categories = [
    '데이트 비용', '연락 빈도', '만남 시간', '기념일', '가족 관계', 
    '친구 관계', '과거 연애', 'SNS 활동', '미래 계획', '기타'
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
          className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
        >
          <Settings className="w-10 h-10 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700">
            판결 옵션
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            어떤 스타일의 판결을 원하시나요?<br/>
            <span className="text-indigo-600 font-semibold">맞춤형 판결을 위한 세부 설정이에요!</span>
          </p>
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-8">
        {/* 갈등 카테고리 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-4">갈등 카테고리</label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white text-gray-800 font-medium"
            >
              <option value="">카테고리를 선택해주세요</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* 태그 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-4">키워드 태그</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                placeholder="갈등과 관련된 키워드를 입력하세요"
                maxLength={20}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 5}
                className={`px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  tagInput.trim() && formData.tags.length < 5
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">최대 5개까지 추가 가능 ({formData.tags.length}/5)</p>
          </div>
        </motion.div>

        {/* 판결 강도 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-4">
            <Flame className="w-4 h-4 inline mr-2" />
            판결 강도
          </label>
          <div className="space-y-3">
            {intensityLevels.map((level) => (
              <motion.label
                key={level.value}
                className="cursor-pointer block"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="intensity"
                  value={level.value}
                  checked={formData.intensity === level.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                  className="sr-only"
                />
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.intensity === level.value
                    ? `border-indigo-500 bg-gradient-to-br ${level.color} text-white shadow-lg`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{level.emoji}</span>
                      <div>
                        <p className="font-bold">{level.label}</p>
                        <p className={`text-sm ${formData.intensity === level.value ? 'text-white/80' : 'text-gray-500'}`}>
                          {level.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.label>
            ))}
          </div>
        </motion.div>

        {/* 판사 캐릭터 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-bold text-gray-800 mb-4">
            <User className="w-4 h-4 inline mr-2" />
            판사 캐릭터
          </label>
          <div className="relative">
            <select
              value={formData.character}
              onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white text-gray-800 font-medium"
            >
              <option value="판사">👨‍⚖️ 엄격한 판사 (기본)</option>
              <option value="상담사" disabled>👩‍💼 따뜻한 상담사 (준비 중)</option>
              <option value="친구" disabled>👫 솔직한 친구 (준비 중)</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
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
          className="px-6 py-3 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200"
        >
          ← 이전
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl"
        >
          다음 단계로 →
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 