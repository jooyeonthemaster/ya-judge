'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((step, index) => (
        <div key={step.number} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center">
            <motion.div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step.isCompleted 
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg' 
                  : step.isActive 
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg scale-110' 
                  : 'bg-gray-200 text-gray-500'
              }`}
              whileHover={{ scale: step.isActive ? 1.15 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {step.isCompleted ? <Check className="h-5 w-5" /> : step.number}
            </motion.div>
            <span className={`text-xs mt-2 whitespace-nowrap transition-all duration-300 ${
              step.isActive ? 'text-pink-600 font-bold' : step.isCompleted ? 'text-purple-600 font-semibold' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-4 -mt-6 rounded-full transition-all duration-500 ${
              step.isCompleted ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
} 