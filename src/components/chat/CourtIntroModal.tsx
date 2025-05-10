'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CourtStage, STAGE_CONFIGS } from '@/store/chatStore';
import { 
  X, Clock, Info, MessageSquare, List, Users, HelpCircle, 
  FileText, Gavel, RefreshCw, CheckCircle2, Heart, Users2
} from 'lucide-react';

interface CourtIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

export default function CourtIntroModal({ isOpen, onClose, onStartTrial }: CourtIntroModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // 소개 단계 정의
  const introSteps = [
    {
      title: "야판사에 오신 것을 환영합니다",
      content: "야판사는 서로의 의견과 입장을 존중하며 합리적인 대화를 통해 문제를 해결하기 위한 플랫폼입니다.",
      icon: <Users2 className="w-8 h-8 text-indigo-600" />
    },
    {
      title: "대화와 화해의 공간",
      content: "야판사를 찾은 당신들은 이미 관계 회복과 상호 이해를 위한 첫 걸음을 내딛은 것입니다. 상대방을 향한 존중과 해결 의지가 있다는 증거입니다.",
      icon: <Heart className="w-8 h-8 text-rose-600" />
    },
    {
      title: "재판 진행 과정",
      content: "재판은 총 7단계로 진행됩니다. 각 단계마다 정해진 시간이 있으며, 모든 참여자가 자신의 의견을 충분히 표현할 수 있습니다.",
      icon: <Clock className="w-8 h-8 text-amber-600" />
    }
  ];
  
  // 재판 단계 설명
  const trialStages = [
    { stage: 'opening', name: '모두 진술', time: '5분', desc: '각 참여자가 자신의 입장을 설명합니다.' },
    { stage: 'issues', name: '쟁점 정리', time: '1분', desc: '판사가 핵심 쟁점을 정리합니다.' },
    { stage: 'discussion', name: '쟁점별 토론', time: '4분', desc: '각 쟁점에 대해 토론합니다.' },
    { stage: 'questions', name: '판사 질문', time: '3분', desc: '판사가 추가 질문을 합니다.' },
    { stage: 'closing', name: '최종 변론', time: '2분', desc: '마지막 의견을 말합니다.' },
    { stage: 'verdict', name: '판결', time: '무제한', desc: '판사가 최종 판결을 내립니다.' },
    { stage: 'appeal', name: '항소', time: '선택사항', desc: '판결에 이의가 있을 경우 항소할 수 있습니다.' }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-5 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">재판 안내</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 본문 */}
        <div className="p-6 space-y-8">
          {/* 소개 카드 - 현재 단계만 표시 */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-50 rounded-xl p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              {introSteps[currentStep].icon}
            </div>
            <h3 className="text-xl font-bold text-indigo-800 mb-3">
              {introSteps[currentStep].title}
            </h3>
            <p className="text-indigo-700">
              {introSteps[currentStep].content}
            </p>
          </motion.div>
          
          {/* 단계 내비게이션 */}
          <div className="flex justify-center space-x-2">
            {introSteps.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-3 h-3 rounded-full ${idx === currentStep ? 'bg-indigo-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          {/* 재판 단계 타임라인 */}
          {currentStep === 2 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">재판 진행 단계</h3>
              
              <div className="space-y-3">
                {trialStages.map((stage, idx) => (
                  <motion.div 
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center border border-gray-200 rounded-lg p-3 shadow-sm"
                  >
                    <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{stage.name}</h4>
                      <p className="text-sm text-gray-600">{stage.desc}</p>
                    </div>
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      {stage.time}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* 관계 개선 메시지 */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <h4 className="font-bold text-green-800 mb-2">함께하는 여정</h4>
            <p className="text-green-700">
              야판사를 통해 문제를 해결하려는 시도는 상대방을 존중하고 관계를 소중히 여기는 성숙한 자세입니다.
              이는 쪼잔함이나 시비가 아니라, 진정한 이해와 존중을 위한 노력입니다.
              이런 과정을 함께하는 당신들은 이미 훌륭하고 합리적인 대화의 주인공입니다.
            </p>
          </div>
          
          {/* 특별 강조 메시지 */}
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
            <h4 className="font-bold text-rose-800 mb-2">소중한 관계를 위한 대화</h4>
            <p className="text-rose-700">
              야판사를 찾은 당신의 남자친구/여자친구는 단순히 시시비비를 가리려는 것이 아니라, 
              당신과의 관계 회복과 서로에 대한 존중을 이끌어내기 위해 이 과정을 선택했습니다. 
              이는 당신과의 관계를 소중히 여기는 마음의 표현입니다.
            </p>
          </div>
        </div>
        
        {/* 푸터 */}
        <div className="border-t border-gray-200 p-5 flex justify-end sticky bottom-0 bg-white">
          {currentStep < introSteps.length - 1 ? (
            <button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다음
            </button>
          ) : (
            <button 
              onClick={onStartTrial}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Gavel className="w-4 h-4 mr-2" />
              재판 시작하기
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
} 