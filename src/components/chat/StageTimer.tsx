'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';

interface StageTimerProps {
  duration: number; // 초 단위
  timeLeft: number; // 초 단위
  isActive: boolean;
  onTimeEnd: () => void;
  stageTitle: string;
}

export const StageTimer = ({
  duration,
  timeLeft,
  isActive,
  onTimeEnd,
  stageTitle
}: StageTimerProps) => {
  const [time, setTime] = useState(timeLeft);
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    setTime(timeLeft);
  }, [timeLeft]);
  
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, onTimeEnd]);
  
  // 시간이 20% 이하로 남으면 경고 표시
  useEffect(() => {
    setShowWarning(time <= duration * 0.2 && time > 0);
  }, [time, duration]);
  
  // 분:초 형식으로 변환
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // 진행률 계산
  const progress = (time / duration) * 100;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="font-medium text-gray-700">{stageTitle}</span>
        </div>
        <div className={`flex items-center ${showWarning ? 'text-red-500' : 'text-gray-600'}`}>
          {showWarning && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mr-1"
            >
              <AlertCircle className="w-4 h-4" />
            </motion.div>
          )}
          <span className={`font-mono ${showWarning ? 'font-bold' : ''}`}>{formattedTime}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${
            progress > 60 
              ? 'bg-green-500' 
              : progress > 30 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
          }`}
          style={{ width: `${Math.max(progress, 0)}%` }}
          animate={{ width: `${Math.max(progress, 0)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default StageTimer;