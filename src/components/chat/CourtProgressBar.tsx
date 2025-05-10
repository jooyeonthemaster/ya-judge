'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CourtStage, STAGE_CONFIGS } from '@/store/chatStore';
import { 
  Clock,
  Info,
  MessageSquare, 
  List, 
  Users, 
  HelpCircle, 
  FileText, 
  Gavel, 
  RefreshCw,
  UserCircle,
  AlarmClock,
  ChevronRight
} from 'lucide-react';

// 각 단계별 아이콘 매핑
const STAGE_ICONS = {
  waiting: Clock,
  intro: Info,
  opening: MessageSquare,
  issues: List,
  discussion: Users,
  questions: HelpCircle,
  closing: FileText,
  verdict: Gavel,
  appeal: RefreshCw
};

// 한글 단계명
const STAGE_NAMES_KO = {
  waiting: '대기',
  intro: '재판 소개',
  opening: '모두 진술',
  issues: '쟁점 정리',
  discussion: '쟁점별 토론',
  questions: '판사 질문',
  closing: '최종 변론',
  verdict: '판결',
  appeal: '항소'
};

// 단계별 설명
const STAGE_DESCRIPTIONS = {
  waiting: '참여자들이 모이고 있습니다. 자유롭게 대화하세요.',
  intro: '판사가 재판의 진행 방식을 설명합니다.',
  opening: '각 참여자가 자신의 입장을 설명합니다.',
  issues: '판사가 사건의 핵심 쟁점을 정리합니다.',
  discussion: '각 쟁점에 대해 차례대로 토론합니다.',
  questions: '판사가 추가 질문을 합니다.',
  closing: '각 참여자가 최종 변론을 합니다.',
  verdict: '판사가 최종 판결을 내립니다.',
  appeal: '판결에 불복하여 항소를 진행합니다.'
};

interface CourtProgressBarProps {
  currentStage: CourtStage;
  // stages 프로퍼티 추가
  stages?: CourtStage[];
  // 선택적으로 스테이지를 클릭하여 이동하는 기능 추가 가능
  onStageClick?: (stage: CourtStage) => void;
  // 타이머 관련 props
  stageTimeLeft?: number;
  stageTimerActive?: boolean;
  onRequestJudge?: () => void; // 판사 호출 함수
  // 타이머 종료 이벤트 핸들러
  onTimeEnd?: () => void;
}

const CourtProgressBar: React.FC<CourtProgressBarProps> = ({
  currentStage,
  stages: customStages,
  onStageClick,
  stageTimeLeft = 0,
  stageTimerActive = false,
  onRequestJudge,
  onTimeEnd
}) => {
  // 커스텀 스테이지가 있으면 사용, 없으면 기본 스테이지 사용
  const stages: CourtStage[] = customStages || [
    'intro', 'opening', 'issues', 'discussion', 
    'questions', 'closing', 'verdict', 'appeal'
  ];
  
  // 현재 단계의 인덱스 찾기
  const currentIndex = stages.indexOf(currentStage);
  
  // 현재 단계의 아이콘 가져오기
  const CurrentIcon = STAGE_ICONS[currentStage];
  
  // 판사 호출 버튼이 필요한 단계인지 확인
  const showJudgeButton = currentStage !== 'waiting' && 
                          currentStage !== 'verdict' && 
                          currentStage !== 'appeal' &&
                          onRequestJudge;
  
  // 바와 타이머가 표시되어야 하는지 확인
  const showProgressInfo = currentStage !== 'waiting';
  
  // 실시간 타이머 로컬 상태 추가
  const [localTimeLeft, setLocalTimeLeft] = useState(stageTimeLeft);

  // stageTimeLeft가 바뀌면 로컬 타이머 동기화
  useEffect(() => {
    setLocalTimeLeft(stageTimeLeft);
  }, [stageTimeLeft]);

  // 타이머 활성화 시 1초마다 감소
  useEffect(() => {
    if (!stageTimerActive || localTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLocalTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 렌더링 중 상태 업데이트 방지를 위해 setTimeout 사용
          if (onTimeEnd) {
            setTimeout(() => {
              onTimeEnd();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stageTimerActive, localTimeLeft, onTimeEnd]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* 현재 단계 - 전체 너비 */}
        <div className="bg-indigo-600 text-white py-3 px-4 w-full">
          <div className="flex items-center justify-center">
            <CurrentIcon className="w-5 h-5 mr-2" />
            <h3 className="text-base font-bold">{STAGE_NAMES_KO[currentStage]} 단계</h3>
          </div>
        </div>
        
        {/* 타이머와 버튼 영역 */}
        {showProgressInfo && (
          <div className="px-4 py-2 flex items-center justify-between">
            {/* 왼쪽: 진행률 표시 */}
            <div className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200">
              {currentIndex + 1}/{stages.length} 단계
            </div>
            
            {/* 중앙: 타이머 표시 */}
            <div className="flex justify-center">
              {stageTimerActive && localTimeLeft > 0 && showProgressInfo && (
                <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <AlarmClock className="w-4 h-4 mr-1.5 text-indigo-600" />
                  <span className="text-sm font-mono font-semibold text-gray-800">
                    {Math.floor(localTimeLeft / 60)}:{(localTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            
            {/* 오른쪽: 판사 호출 버튼 */}
            <div>
              {showJudgeButton && (
                <button 
                  onClick={onRequestJudge}
                  className="bg-amber-500 text-white px-3 py-1.5 rounded-lg flex items-center font-medium hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <Gavel className="w-4 h-4 mr-1.5" />
                  <span>판사 호출</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtProgressBar;