'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Scale, FileText, Gavel, CheckCircle } from 'lucide-react';

interface VerdictLoadingBarProps {
  isVisible: boolean;
  isVerdictReady?: boolean;
  onComplete?: () => void;
}

const steps = [
  { icon: Scale, text: '증거 자료 분석 중...', threshold: 25 },
  { icon: FileText, text: '판결문 작성 중...', threshold: 55 },
  { icon: Gavel, text: '최종 판결 준비 중...', threshold: 85 },
  { icon: CheckCircle, text: '판결 완료!', threshold: 100 },
];

export default function VerdictLoadingBar({ isVisible, isVerdictReady = false, onComplete }: VerdictLoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // progress → step 계산
  useEffect(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (progress >= steps[i].threshold) {
        setCurrentStep(i);
        break;
      }
      if (i === 0) setCurrentStep(0);
    }
  }, [progress]);

  // 완료 처리
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 100%를 보여준 후 약간의 딜레이 후 onComplete
    setTimeout(() => {
      onComplete?.();
    }, 400);
  }, [onComplete]);

  // isVerdictReady가 true가 되면 빠르게 100%까지 채움
  useEffect(() => {
    if (!isVisible || !isVerdictReady) return;

    // 기존 느린 interval 제거
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 빠르게 100%까지 채우기
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 3, 100);
        if (next >= 100) {
          handleComplete();
        }
        return next;
      });
    }, 30);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isVerdictReady, handleComplete]);

  // 메인 로딩 진행 (90%까지만 천천히)
  useEffect(() => {
    if (!isVisible) {
      // 리셋
      setProgress(0);
      setCurrentStep(0);
      completedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 이미 verdictReady면 위의 useEffect가 처리
    if (isVerdictReady) return;

    // 90%까지 점점 느려지면서 진행
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 100;
      setProgress(prev => {
        if (prev >= 90) return 90; // 90%에서 멈춤 - API 응답 대기
        // 처음에 빠르고 갈수록 느려지는 ease-out 커브
        const target = 90 * (1 - Math.exp(-elapsed / 8000));
        return Math.min(target, 90);
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isVerdictReady]);

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
          const isCompleted = progress >= step.threshold;
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
                  ${progress >= steps[index + 1].threshold ? 'bg-amber-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-amber-600 animate-pulse">
          {progress >= 90 && !isVerdictReady
            ? '⏳ AI 판사가 심사숙고 중입니다. 조금만 더 기다려주세요...'
            : '💭 잠시만 기다려주세요. 공정한 판결을 위해 심사숙고 중입니다...'}
        </p>
      </div>
    </div>
  );
}
