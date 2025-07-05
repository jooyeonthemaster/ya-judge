'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Gavel, 
  ArrowLeft, 
  Home,
  Heart,
  ChevronDown,
  Plus,
  X,
  Check
} from 'lucide-react';

export default function RoomlessPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgment, setJudgment] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plaintiff: '',
    defendant: '',
    relationship: '연인',
    duration: '',
    category: '',
    tags: [] as string[],
    intensity: '중간맛',
    character: '판사'
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleBack = () => {
    router.push('/main');
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim() || !formData.description.trim()) {
          alert('제목과 갈등 상황을 모두 입력해주세요.');
          return false;
        }
        return true;
      case 2:
        if (!formData.plaintiff.trim() || !formData.defendant.trim()) {
          alert('원고와 피고를 모두 입력해주세요.');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/roomlessjudge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('판결 요청에 실패했습니다.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setJudgment(result.judgment);
        setCurrentStep(5); // New step for showing results
      } else {
        throw new Error(result.error || '판결 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting judgment:', error);
      alert('판결 요청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const steps = [
    { number: 1, title: '상황', isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { number: 2, title: '관계', isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { number: 3, title: '옵션', isActive: currentStep === 3, isCompleted: currentStep > 3 },
    { number: 4, title: '제출', isActive: currentStep === 4, isCompleted: currentStep > 4 },
    { number: 5, title: '판결', isActive: currentStep === 5, isCompleted: false }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-y-auto" style={{ maxWidth: '380px', margin: '0 auto' }}>
      {/* 헤더 */}
      <header className="bg-white py-4 sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="px-4 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900">재판 청구서</h1>
        </div>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((step, index) => (
            <div key={step.number} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.isCompleted 
                    ? 'bg-pink-500 text-white' 
                    : step.isActive 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.isCompleted ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span className={`text-xs mt-1 whitespace-nowrap ${
                  step.isActive ? 'text-pink-600 font-semibold' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 -mt-4 ${
                  step.isCompleted ? 'bg-pink-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 스텝 1: 상황 */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="갈등 상황을 한 줄로 요약해주세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                갈등 상황 설명 <span className="text-pink-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none h-32"
                placeholder="상황을 자세히 설명해주세요"
              />
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-6 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-all"
              >
                다음
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 스텝 2: 관계 */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  원고(고소인) <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plaintiff}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiff: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  placeholder="나"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피고(피고소인) <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.defendant}
                  onChange={(e) => setFormData(prev => ({ ...prev, defendant: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  placeholder="상대방"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">연애 관계</label>
              <div className="flex gap-4">
                {['연인', '부부', '썸', '기타'].map((type) => (
                  <label key={type} className={`flex items-center ${type !== '연인' ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="relationship"
                      value={type}
                      checked={formData.relationship === type}
                      onChange={(e) => {
                        if (type === '연인') {
                          setFormData(prev => ({ ...prev, relationship: e.target.value }));
                        }
                      }}
                      disabled={type !== '연인'}
                      className={`mr-2 text-pink-500 ${type !== '연인' ? 'pointer-events-none' : ''} disabled:cursor-not-allowed`}
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연애 기간</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="예: 6개월"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">카테고리</label>
              <div className="flex gap-4 flex-wrap">
                {['데이트', '금전', '선물', '의사소통', '기타'].map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={formData.category === category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mr-2 text-pink-500"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  placeholder="태그 추가"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  추가
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-pink-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrevious}
                className="px-6 py-2 text-pink-500 font-medium rounded-lg hover:bg-pink-50 transition-all"
              >
                이전
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-6 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-all"
              >
                다음
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 스텝 3: 옵션 */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">판결 설정</h3>
              <p className="text-sm text-gray-600 mb-6">AI가 판결을 내릴 때의 강도와 캐릭터를 선택해주세요.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">답변 강도</label>
                  <div className="relative">
                    <select
                      value={formData.intensity}
                      onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none appearance-none bg-white"
                    >
                      <option value="순한맛">순한맛</option>
                      <option value="중간맛">중간맛</option>
                      <option value="매운맛">매운맛</option>
                    </select>
                    
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">캐릭터</label>
                  <div className="relative">
                    <select
                      value={formData.character}
                      onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none appearance-none bg-white"
                    >
                      <option value="판사">판사</option>
                      <option value="상담사">상담사</option>
                      <option value="친구">친구</option>
                    </select>
                    
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrevious}
                className="px-6 py-2 text-pink-500 font-medium rounded-lg hover:bg-pink-50 transition-all"
              >
                이전
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-6 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-all"
              >
                다음
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 스텝 4: 제출 */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">입력 내용 확인</h3>
              <p className="text-sm text-gray-600 mb-6">입력하신 내용을 확인하고 제출해주세요.</p>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">제목</span>
                  <p className="text-gray-700">{formData.title}</p>
                </div>
                
                <div>
                  <span className="font-medium">갈등 상황 설명</span>
                  <p className="text-gray-700">{formData.description}</p>
                </div>
                
                <div>
                  <span className="font-medium">당사자 정보</span>
                  <p className="text-gray-700">
                    원고(고소인): {formData.plaintiff}<br />
                    피고(피고소인): {formData.defendant}<br />
                    관계: {formData.relationship}<br />
                    관계 기간: {formData.duration}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">카테고리</span>
                  <p className="text-gray-700">{formData.category}</p>
                </div>
                
                {formData.tags.length > 0 && (
                  <div>
                    <span className="font-medium">태그</span>
                    <p className="text-gray-700">{formData.tags.join(', ')}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">판결 설정</span>
                  <p className="text-gray-700">
                    답변 강도: {formData.intensity}<br />
                    캐릭터: {formData.character}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrevious}
                className="px-6 py-2 text-pink-500 font-medium rounded-lg hover:bg-pink-50 transition-all"
              >
                이전
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '제출 중...' : '제출하기'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 스텝 5: 판결 결과 */}
        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-pink-300 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Gavel className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700">
                  AI 판사의 최종 판결
                </h3>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm max-h-96 overflow-y-auto space-y-4">
                {judgment && (
                  <>
                    {/* 사건 요약 */}
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-bold text-gray-900 mb-2">🔨 사건 요약</h4>
                      <p className="text-sm text-gray-700">{judgment.caseSummary}</p>
                    </div>
                    
                    {/* 분석 결과 */}
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-bold text-gray-900 mb-2">📊 분석 결과</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>갈등 복잡도: <span className="font-semibold text-pink-600">{judgment.analysis?.complexity}</span></div>
                        <div>감정 지수: <span className="font-semibold text-pink-600">{judgment.analysis?.emotionalIndex}/10</span></div>
                        <div>해결 가능성: <span className="font-semibold text-pink-600">{judgment.analysis?.solvability}%</span></div>
                        <div>주요 원인: <span className="font-semibold text-pink-600">{judgment.analysis?.rootCause}</span></div>
                      </div>
                    </div>
                    
                    {/* 판결 */}
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-bold text-gray-900 mb-2">⚖️ 판결</h4>
                      <p className="text-sm text-gray-700 mb-2">{judgment.verdict}</p>
                      <p className="text-xs text-gray-600 italic">{judgment.reasoning}</p>
                    </div>
                    
                    {/* 해결 방안 */}
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-bold text-gray-900 mb-2">💡 해결 방안</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-orange-600">즉시:</span> {judgment.solutions?.immediate}
                        </div>
                        <div>
                          <span className="font-semibold text-blue-600">단기 (1주일):</span> {judgment.solutions?.shortTerm}
                        </div>
                        <div>
                          <span className="font-semibold text-green-600">장기 (1개월+):</span> {judgment.solutions?.longTerm}
                        </div>
                      </div>
                    </div>
                    
                    {/* 핵심 조언 */}
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-bold text-gray-900 mb-2">🎯 핵심 조언</h4>
                      <p className="text-sm text-gray-700 font-medium">{judgment.coreAdvice}</p>
                    </div>
                    
                    {/* 마무리 메시지 */}
                    <div className="bg-pink-50 p-3 rounded-lg">
                      <p className="text-sm text-pink-700 font-medium text-center">{judgment.finalMessage}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setJudgment(null);
                  setCurrentStep(1);
                  setFormData({
                    title: '',
                    description: '',
                    plaintiff: '',
                    defendant: '',
                    relationship: '연인',
                    duration: '',
                    category: '',
                    tags: [],
                    intensity: '중간맛',
                    character: '판사'
                  });
                }}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all"
              >
                다시 판결받기
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="flex-1 py-3 bg-white border-2 border-pink-500 text-pink-600 font-bold rounded-lg hover:bg-pink-50 transition-all"
              >
                메인으로
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
} 