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
  ChevronRight,
  ThumbsUp,
  CheckCircle
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
  // 동의 관련 props
  stageReadyStatus?: Record<string, boolean>;
  userId?: string;
  onSetStageReady?: (userId: string, isReady: boolean) => void;
  onRequestJudge?: () => void; // 판사 호출 함수
  // 참가자 목록 (totalUsers 계산을 위해)
  roomUsers?: Array<{ id: string; username: string }>;
  // 자동 다음 단계 진행을 위한 함수 추가
  onCheckAndMoveToNextStage?: () => void;
}

const CourtProgressBar: React.FC<CourtProgressBarProps> = ({
  currentStage,
  stages: customStages,
  onStageClick,
  stageReadyStatus = {},
  userId,
  onSetStageReady,
  onRequestJudge,
  roomUsers = [],
  onCheckAndMoveToNextStage,
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
  
  // 바와 동의 버튼이 표시되어야 하는지 확인
  const showProgressInfo = currentStage !== 'waiting';
  
  // 현재 유저의 동의 상태
  const userReady = userId ? stageReadyStatus[userId] || false : false;
  
  // 전체 참가자 수와 동의한 참가자 수 계산
  const totalUsers = roomUsers.length;
  const readyUsers = Object.values(stageReadyStatus).filter(v => Boolean(v)).length;
  
  // 동의 버튼 클릭 핸들러
  const handleReadyToggle = () => {
    if (userId && onSetStageReady) {
      onSetStageReady(userId, !userReady);
    }
  };

  // 모든 참가자가 동의했는지 여부
  const isAllReady = roomUsers.length > 0 && readyUsers === totalUsers;

  // 모든 참가자가 동의했을 때 다음 단계로 자동 이동하는 로직
  useEffect(() => {
    console.log("CourtProgressBar useEffect 실행");
    console.log("isAllReady 상태:", isAllReady);
    console.log("onCheckAndMoveToNextStage 함수 존재 여부:", !!onCheckAndMoveToNextStage);
    console.log("readyUsers:", readyUsers);
    console.log("totalUsers:", totalUsers);
    
    if (isAllReady && onCheckAndMoveToNextStage) {
      console.log('모든 참가자가 동의했습니다. 다음 단계로 자동 이동 타이머 시작');
      
      // 약간의 지연 후 다음 단계로 이동 (UI 피드백을 위해)
      const timer = setTimeout(() => {
        console.log('타이머 만료, onCheckAndMoveToNextStage 함수 호출');
        onCheckAndMoveToNextStage();
        console.log('onCheckAndMoveToNextStage 함수 호출 완료');
      }, 1000);
      
      return () => {
        console.log('타이머 정리');
        clearTimeout(timer);
      };
    }
  }, [isAllReady, onCheckAndMoveToNextStage, readyUsers, totalUsers]);

  // 전체 진행률 계산 (%)
  const progressPercent = Math.round(((currentIndex + 1) / stages.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 단계 진행 표시 - 컴팩트한 디자인 */}
      <div className="relative">
        {/* 진행률 표시 막대 */}
        <div 
          className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-500 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
        <div className="flex flex-wrap items-center px-4 py-2 gap-2">
          {/* 현재 단계 표시 */}
          <div className="flex items-center bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <CurrentIcon className="w-4 h-4 mr-1.5" />
            <span className="whitespace-nowrap">{STAGE_NAMES_KO[currentStage]}</span>
          </div>
          
          {/* 단계 진행 표시 */}
          <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
            <span className="font-semibold text-indigo-700">{currentIndex + 1}</span>
            <span>/</span>
            <span>{stages.length}</span>
            <span className="ml-1">단계</span>
          </div>
          
          {/* 동의 상태 버튼 */}
          <div className="flex items-center gap-2 ml-auto">
            {/* 동의 상태 표시 */}
            <div className="flex items-center text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              <span className="font-medium whitespace-nowrap">
                <span className="text-indigo-600">{readyUsers}명</span> 동의 <span className="text-gray-500">/ {totalUsers}명</span>
              </span>
            </div>
            
            {/* 다음 단계 동의 버튼 */}
            <button
              onClick={handleReadyToggle}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm
                transition-all duration-200 
                ${userReady 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800'
                }
              `}
              title={userReady ? '동의를 취소합니다' : '다음 단계로 넘어가는 데 동의합니다'}
            >
              {userReady ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="whitespace-nowrap">동의 완료</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span className="whitespace-nowrap">다음 단계 동의</span>
                </>
              )}
            </button>
            
            {/* 판사 호출 버튼 - 필요 시에만 표시 */}
            {showJudgeButton && (
              <button 
                onClick={onRequestJudge}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
                title="판사에게 도움을 요청합니다"
              >
                <Gavel className="w-4 h-4" />
                <span className="whitespace-nowrap">판사 호출</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 단계 설명 툴팁 - 필요시 표시 */}
      <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center">
          <Info className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
          <p>{STAGE_DESCRIPTIONS[currentStage]}</p>
        </div>
      </div>
      
      {/* 모든 참가자가 동의했을 때 알림 표시 */}
      {isAllReady && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-200 text-green-800 text-sm flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span>모든 참가자가 동의했습니다! 다음 단계로 이동합니다...</span>
        </div>
      )}
    </div>
  );
};

export default CourtProgressBar;
