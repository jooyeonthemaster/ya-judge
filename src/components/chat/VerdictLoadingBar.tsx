'use client';

import { useState, useEffect } from 'react';
import { Scale, FileText, Gavel, CheckCircle } from 'lucide-react';

interface VerdictLoadingBarProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function VerdictLoadingBar({ isVisible, onComplete }: VerdictLoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Scale, text: '증거 자료 분석 중...', duration: 2000 },
    { icon: FileText, text: '판결문 작성 중...', duration: 2500 },
    { icon: Gavel, text: '최종 판결 준비 중...', duration: 1500 },
    { icon: CheckCircle, text: '판결 완료!', duration: 500 }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    let totalDuration = 0;
    let currentTime = 0;

    const startLoading = () => {
      const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
      
      const progressInterval = setInterval(() => {
        currentTime += 50;
        const newProgress = Math.min((currentTime / totalTime) * 100, 100);
        setProgress(newProgress);

        // 현재 단계 계산
        let accumulatedTime = 0;
        let stepIndex = 0;
        
        for (let i = 0; i < steps.length; i++) {
          if (currentTime <= accumulatedTime + steps[i].duration) {
            stepIndex = i;
            break;
          }
          accumulatedTime += steps[i].duration;
        }
        
        setCurrentStep(stepIndex);

        if (currentTime >= totalTime) {
          clearInterval(progressInterval);
          // 로딩 완료 시 콜백 호출
          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 100); // 약간의 지연 후 호출
          }
        }
      }, 50);

      return progressInterval;
    };

    const interval = startLoading();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Scale;

  return (
    <div className="mx-4 my-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <CurrentIcon className="w-8 h-8 text-amber-600 animate-pulse" />
            <div className="absolute -inset-1 bg-amber-400 rounded-full opacity-20 animate-ping"></div>
          </div>
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800">
            🏛️ 최종 판결 진행 중
          </h3>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-amber-700">
            {steps[currentStep]?.text || '처리 중...'}
          </span>
          <span className="text-sm font-bold text-amber-800">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-150 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCompleted 
                  ? 'bg-amber-500 border-amber-500 text-white' 
                  : isCurrent 
                    ? 'bg-amber-100 border-amber-400 text-amber-600 animate-pulse' 
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}>
                <StepIcon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-8 h-0.5 mx-1 transition-all duration-300
                  ${index < currentStep ? 'bg-amber-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-amber-600 animate-pulse">
          💭 잠시만 기다려주세요. 공정한 판결을 위해 심사숙고 중입니다...
        </p>
      </div>
    </div>
  );
} 