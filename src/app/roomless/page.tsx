'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import Image from 'next/image';

// 단계별 컴포넌트 import
import StepIndicator from '@/components/roomless/StepIndicator';
import Step1Situation from '@/components/roomless/Step1Situation';
import Step2Relationship from '@/components/roomless/Step2Relationship';
import Step3Options from '@/components/roomless/Step3Options';
import Step4Submit from '@/components/roomless/Step4Submit';
import Step5Result from '@/components/roomless/Step5Result';

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

  // 단계 정의
  const steps = [
    { number: 1, title: '상황', isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { number: 2, title: '관계', isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { number: 3, title: '옵션', isActive: currentStep === 3, isCompleted: currentStep > 3 },
    { number: 4, title: '제출', isActive: currentStep === 4, isCompleted: currentStep > 4 },
    { number: 5, title: '판결', isActive: currentStep === 5, isCompleted: false }
  ];

  // 핸들러 함수들
  const handleBack = () => {
    router.push('/main');
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
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
        setCurrentStep(5);
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
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 5) {
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

  const handleNewCase = () => {
    setCurrentStep(1);
    setJudgment(null);
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
    setTagInput('');
  };

  const handleBackToMain = () => {
    router.push('/main');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 text-gray-900 overflow-y-auto" style={{ maxWidth: '380px', margin: '0 auto' }}>
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm py-4 sticky top-0 z-50 shadow-lg border-b border-pink-200">
        <div className="px-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">메인으로</span>
          </motion.button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Image 
                src="/images/judge.png" 
                alt="판사" 
                width={24} 
                height={24}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700">
              재판 청구서
            </h1>
          </div>
          
          <div className="w-16"></div> {/* 균형을 위한 spacer */}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-6">
        {/* 스텝 인디케이터 - 5단계가 아닐 때만 표시 */}
        {currentStep !== 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StepIndicator steps={steps} />
          </motion.div>
        )}

        {/* 단계별 컨텐츠 */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1Situation
              key="step1"
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 2 && (
            <Step2Relationship
              key="step2"
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Options
              key="step3"
              formData={formData}
              setFormData={setFormData}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              removeTag={removeTag}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Submit
              key="step4"
              formData={formData}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onPrevious={handlePrevious}
            />
          )}
          
          {currentStep === 5 && judgment && (
            <Step5Result
              key="step5"
              judgment={judgment}
              onBackToMain={handleBackToMain}
              onNewCase={handleNewCase}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 푸터 - 5단계가 아닐 때만 표시 */}
      {currentStep !== 5 && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 py-8 px-4 bg-gradient-to-r from-pink-100 to-purple-100 border-t border-pink-200"
        >
          <div className="text-center space-y-4">
            {/* 로고와 브랜드 */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Image 
                  src="/images/judge.png" 
                  alt="판사" 
                  width={28} 
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700">
                야 판사야!
              </span>
            </div>

            {/* 설명 */}
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
              <span className="text-pink-600 font-semibold">AI 판사</span>가 공정하고 객관적으로<br/>
              커플 갈등을 분석하여 해결책을 제시합니다
            </p>

            {/* 통계 */}
            <div className="flex items-center justify-center space-x-6 pt-2">
              <div className="text-center">
                <div className="text-lg font-black text-pink-600">4,200+</div>
                <div className="text-xs text-gray-500">해결된 갈등</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-black text-purple-600">87%</div>
                <div className="text-xs text-gray-500">관계 개선</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-black text-indigo-600">30초</div>
                <div className="text-xs text-gray-500">평균 판결시간</div>
              </div>
            </div>

            {/* 추가 기능 안내 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-bold text-gray-800">더 많은 기능이 궁금하다면?</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBackToMain}
                className="text-sm text-pink-600 hover:text-pink-700 font-semibold underline decoration-wavy decoration-pink-300 underline-offset-2"
              >
                실시간 채팅 재판도 체험해보세요 →
              </motion.button>
            </div>

            {/* 저작권 */}
            <div className="pt-4 border-t border-pink-200">
              <p className="text-xs text-gray-500">
                © 2024 야 판사야! All rights reserved.
              </p>
            </div>
          </div>
        </motion.footer>
      )}
    </main>
  );
} 