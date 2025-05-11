'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourtStage, STAGE_CONFIGS } from '@/store/chatStore';
import { database } from '@/lib/firebase';
import { ref, onValue, set, off, Database } from 'firebase/database';
import { 
  X, Clock, Info, MessageSquare, List, Users, HelpCircle, 
  FileText, Gavel, RefreshCw, CheckCircle2, Heart, Users2,
  Shield, Scale, AlertTriangle, Bookmark
} from 'lucide-react';

interface CourtReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserReady: () => void;
  onStartTrial: () => void;
  roomId: string;
  username: string;
  userId: string;
  participants: Array<{ id: string; username: string }>;
}

export default function CourtReadyModal({ 
  isOpen, 
  onClose, 
  onUserReady, 
  onStartTrial,
  roomId,
  username,
  userId,
  participants
}: CourtReadyModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUserReady, setIsUserReady] = useState(false);
  const [readyUsers, setReadyUsers] = useState<Record<string, boolean>>({});
  const [isEveryoneReady, setIsEveryoneReady] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  
  // 로그 추가
  useEffect(() => {
    console.log('CourtReadyModal 렌더링됨');
    console.log('isOpen:', isOpen);
    console.log('participants:', participants);
    console.log('readyUsers:', readyUsers);
    console.log('isEveryoneReady:', isEveryoneReady);
  }, [isOpen, participants, readyUsers, isEveryoneReady]);
  
  // 소개 단계 정의 - 더 효과적인 내용으로 개선
  const introSteps = [
    {
      title: "함께 해결해요! 👋",
      content: "이 링크를 받으셨다는 건 우리가 대화로 문제를 풀어갈 수 있는 준비가 되었다는 증거예요! 야판사는 여러분의 이야기에 귀 기울일 준비가 되어 있어요.",
      icon: <Scale className="w-12 h-12 text-blue-500" />,
      color: "blue"
    },
    {
      title: "서로 존중해요 ❤️",
      content: "이 과정은 승패를 가리는 것이 아니라 서로를 이해하고 존중하며 관계를 회복하는 기회예요. 열린 마음으로 서로의 이야기를 들어볼까요?",
      icon: <Heart className="w-12 h-12 text-rose-500" />,
      color: "rose"
    },
    {
      title: "차근차근 진행해요! 🕰️",
      content: "재판은 총 7단계로 진행되며, 각 단계마다 여러분의 이야기를 나눌 충분한 시간이 있어요. 천천히, 하지만 확실하게 해결의 길로 함께 걸어가요!",
      icon: <Clock className="w-12 h-12 text-amber-500" />,
      color: "amber"
    },
    {
      title: "공정하게 들어드려요 🛡️",
      content: "야판사는 양쪽의 이야기를 균형 있게 듣고 가장 좋은 해결책을 찾아드려요. 걱정 말고 여러분의 진솔한 이야기를 들려주세요!",
      icon: <Shield className="w-12 h-12 text-green-500" />,
      color: "green"
    }
  ];
  
  // 재판 단계 설명
  const trialStages = [
    { stage: 'opening', name: '진술', time: '5분', desc: '자신의 입장과 생각을 편안히 나누세요.' },
    { stage: 'issues', name: '쟁점 정리', time: '1분', desc: '판사가 중요한 논점을 정리합니다.' },
    { stage: 'discussion', name: '상호 토론', time: '4분', desc: '서로의 의견을 나누며 이해의 폭을 넓혀요.' },
    { stage: 'questions', name: '질의응답', time: '3분', desc: '판사의 질문에 솔직하게 답변해주세요.' },
    { stage: 'closing', name: '최종 변론', time: '2분', desc: '마지막으로 하고 싶은 말을 정리해주세요.' },
    { stage: 'verdict', name: '판결', time: '무제한', desc: '판사가 최선의 해결책을 제안합니다.' },
    { stage: 'appeal', name: '재심의', time: '선택', desc: '더 나누고 싶은 이야기가 있다면 말씀하세요.' }
  ];
  
  // Firebase에서 준비 상태 및 재판 시작 상태 동기화
  useEffect(() => {
    if (!isOpen || !roomId) return;
    
    const db = database as Database;
    const readyStatusRef = ref(db, `rooms/${roomId}/courtReady`);
    const courtStartedRef = ref(db, `rooms/${roomId}/courtStarted`);
    
    // 초기에 자신의 준비 상태를 설정
    if (!isUserReady) {
      set(ref(db, `rooms/${roomId}/courtReady/${userId}`), false);
    }
    
    // 준비 상태 변경 감지
    const unsubscribeReady = onValue(readyStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      setReadyUsers(data);
      
      // 디버깅을 위한 상세 로그
      console.log('준비 상태 데이터:', data);
      console.log('참가자 목록:', participants);
      
      // 각 참가자의 준비 상태 확인
      participants.forEach(p => {
        console.log(`참가자 ${p.username}(${p.id})의 준비 상태:`, data[p.id]);
      });
      
      // 준비된 참가자 수 계산
      const readyCount = Object.values(data).filter(v => Boolean(v)).length;
      console.log(`준비된 참가자: ${readyCount}/${participants.length}`);
      
      // 개선된 로직: 다양한 조건 추가
      let allReady = false;
      
      // 방법 1: 기존 로직 - 모든 참가자가 준비되었는지 확인
      const everyoneReady = participants.length > 0 && 
        participants.every(p => Boolean(data[p.id]));
      
      // 방법 2: 참가자 수와 준비된 참가자 수 비교
      const countMatch = participants.length > 0 && 
        readyCount === participants.length;
      
      // 방법 3: Object.values로 직접 비교
      const valuesMatch = participants.length > 0 && 
        Object.values(data).filter(v => Boolean(v)).length === participants.length;
      
      // 세 가지 방법 중 하나라도 true면 모두 준비된 것으로 판단
      allReady = everyoneReady || countMatch || valuesMatch;
      
      console.log('준비 상태 계산 결과:');
      console.log('- 모든 참가자 준비 여부:', everyoneReady);
      console.log('- 참가자 수/준비 수 일치 여부:', countMatch);
      console.log('- values 비교 결과:', valuesMatch);
      console.log('최종 allReady 값:', allReady);
      
      // 2명 이상이고 모두 준비 완료 상태일 때 강제 설정
      if (participants.length >= 2 && readyCount >= participants.length) {
        console.log('모든 참가자가 준비되어 있어 isEveryoneReady를 true로 강제 설정');
        allReady = true;
      }
      
      setIsEveryoneReady(allReady);
    });
    
    // 재판 시작 상태 감지
    const unsubscribeStarted = onValue(courtStartedRef, (snapshot) => {
      const started = snapshot.val();
      console.log('재판 시작 상태 변경:', started);
      
      if (started === true) {
        console.log('재판 시작 상태가 감지되었습니다. 재판을 시작합니다.');
        onStartTrial();
      }
    });
    
    return () => {
      off(readyStatusRef);
      off(courtStartedRef);
    };
  }, [isOpen, roomId, userId, participants, isUserReady, onStartTrial]);
  
  // 사용자 준비 상태 변경 처리
  const handleUserReady = () => {
    if (!roomId || !userId) return;
    
    console.log('handleUserReady 호출됨:', userId);
    
    const db = database as Database;
    const newReadyStatus = !isUserReady;
    console.log('새 준비 상태:', newReadyStatus);
    
    set(ref(db, `rooms/${roomId}/courtReady/${userId}`), newReadyStatus);
    setIsUserReady(newReadyStatus);
    
    if (newReadyStatus) {
      console.log('사용자 준비 완료, onUserReady 콜백 호출');
      onUserReady();
    }
  };
  
  // 재판 시작 처리
  const handleStartTrial = () => {
    console.log('모든 참가자가 준비되어 재판을 시작합니다.');
    console.log('참가자 목록:', participants);
    console.log('준비 상태:', readyUsers);
    console.log('isEveryoneReady 값:', isEveryoneReady);
    
    try {
      // 중복 실행 방지를 위한 플래그 설정
      const db = database as Database;
      const courtStartingRef = ref(db, `rooms/${roomId}/courtStarting`);
      
      // 먼저 시작 중 플래그 확인
      onValue(courtStartingRef, (snapshot) => {
        const isStarting = snapshot.val();
        
        // 이미 시작 중이면 중단
        if (isStarting === true) {
          console.log('이미 다른 클라이언트에서 재판 시작 중입니다.');
          return;
        }
        
        // 시작 중 플래그 설정
        set(courtStartingRef, true).then(() => {
          // 재판 시작
          onStartTrial();
          console.log('onStartTrial 호출 완료');
          
          // 플래그 제거 (완료 표시)
          setTimeout(() => {
            set(courtStartingRef, false);
          }, 2000);
        });
      }, {
        onlyOnce: true // 한 번만 읽기
      });
    } catch (error) {
      console.error('재판 시작 중 오류 발생:', error);
      // 사용자에게 오류 알림 표시
      alert('재판 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  // 재판 시작 버튼 클릭 핸들러
  const handleStartTrialButtonClick = () => {
    console.log('재판 시작 버튼 클릭됨');
    console.log('isEveryoneReady:', isEveryoneReady);
    console.log('readyUsers:', readyUsers);
    console.log('participants:', participants);
    
    // 이미 처리 중인 경우 중복 실행 방지
    const db = database as Database;
    
    // 1. 시작 중 플래그 확인 (중복 실행 방지)
    const courtStartingRef = ref(db, `rooms/${roomId}/courtStarting`);
    const courtStartedRef = ref(db, `rooms/${roomId}/courtStarted`);
    
    // 2. 시작 상태 확인 (이미 시작되었는지)
    onValue(courtStartedRef, (startedSnapshot) => {
      // 이미 시작된 경우
      if (startedSnapshot.val() === true) {
        console.log('이미 재판이 시작되었습니다. 중복 방지.');
        // 재판 시작 함수를 즉시 호출하여 상태를 동기화
        onStartTrial();
        return;
      }
      
      // 시작 중 플래그 확인
      onValue(courtStartingRef, (startingSnapshot) => {
        const isStarting = startingSnapshot.val();
        
        // 이미 시작 중인 경우
        if (isStarting === true) {
          console.log('이미 다른 클라이언트에서 재판 시작 버튼을 클릭했습니다.');
          return;
        }
        
        // 시작 중 플래그 설정 (다른 클라이언트에서 중복 실행 방지)
        set(courtStartingRef, true)
          .then(() => {
            console.log('시작 중 플래그 설정 완료');
            
            // Firebase에 재판 시작 상태 설정 (전역 상태 업데이트)
            set(courtStartedRef, true)
              .then(() => {
                console.log('재판 시작 상태가 Firebase에 설정되었습니다.');
                // Firebase 이벤트 구독을 통해 자동으로 onStartTrial이 호출됨
                
                // 5초 후에 플래그 제거 (충분한 시간 확보)
                setTimeout(() => {
                  console.log('시작 중 플래그 초기화');
                  set(courtStartingRef, false).catch(err => console.error('플래그 초기화 실패:', err));
                }, 5000);
              })
              .catch(error => {
                console.error('재판 시작 상태 설정 오류:', error);
                // 오류 발생 시 플래그 제거 및 폴백으로 직접 호출
                set(courtStartingRef, false)
                  .then(() => {
                    // 직접 시작 함수 호출
                    console.log('오류 발생 시 폴백으로 직접 onStartTrial 호출');
                    onStartTrial();
                  })
                  .catch(err => console.error('플래그 초기화 실패:', err));
              });
          })
          .catch(error => {
            console.error('시작 중 플래그 설정 오류:', error);
          });
      }, {
        onlyOnce: true
      });
    }, {
      onlyOnce: true
    });
  };
  
  // 토글 함수 추가
  const toggleStage = (stageId: string) => {
    if (expandedStage === stageId) {
      setExpandedStage(null);
    } else {
      setExpandedStage(stageId);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* 헤더 */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-5 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Gavel className="w-6 h-6 mr-2 text-indigo-500 dark:text-indigo-400" />
              함께 해결의 길로! 🤝
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* 본문 */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-6 space-y-8">
              {/* 소개 카드 - 현재 단계만 표시 */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={currentStep === 0 
                  ? "bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center shadow-md border border-blue-200 dark:border-blue-800"
                  : currentStep === 1 
                  ? "bg-rose-50 dark:bg-rose-900/20 rounded-xl p-6 text-center shadow-md border border-rose-200 dark:border-rose-800"
                  : currentStep === 2 
                  ? "bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 text-center shadow-md border border-amber-200 dark:border-amber-800"
                  : "bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center shadow-md border border-green-200 dark:border-green-800"
                }
              >
                <div className="flex justify-center mb-4">
                  <div className={currentStep === 0 
                    ? "bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full"
                    : currentStep === 1 
                    ? "bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full"
                    : currentStep === 2 
                    ? "bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full"
                    : "bg-green-100 dark:bg-green-900/30 p-3 rounded-full"
                  }>
                    {introSteps[currentStep].icon}
                  </div>
                </div>
                
                <h3 className={currentStep === 0 
                  ? "text-2xl font-bold mb-3 text-blue-700 dark:text-blue-200"
                  : currentStep === 1 
                  ? "text-2xl font-bold mb-3 text-rose-700 dark:text-rose-200"
                  : currentStep === 2 
                  ? "text-2xl font-bold mb-3 text-amber-700 dark:text-amber-200"
                  : "text-2xl font-bold mb-3 text-green-700 dark:text-green-200"
                }>
                  {introSteps[currentStep].title}
                </h3>
                <p className={currentStep === 0 
                  ? "text-lg font-medium text-blue-700 dark:text-blue-300"
                  : currentStep === 1 
                  ? "text-lg font-medium text-rose-700 dark:text-rose-300"
                  : currentStep === 2 
                  ? "text-lg font-medium text-amber-700 dark:text-amber-300"
                  : "text-lg font-medium text-green-700 dark:text-green-300"
                }>
                  {introSteps[currentStep].content}
                </p>
              </motion.div>
              
              {/* 단계 내비게이션 */}
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  {introSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        idx === currentStep
                          ? 'bg-indigo-600 dark:bg-indigo-400'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                      aria-label={`단계 ${idx + 1}로 이동`}
                    />
                  ))}
                </div>
              </div>
              
              {/* 재판 단계 설명 */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  대화 진행 단계
                </h3>
                
                <div className="flex flex-col space-y-2">
                  {trialStages.map((stage, idx) => (
                    <motion.div 
                      key={stage.stage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleStage(stage.stage)}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800 cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                            {idx + 1}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{stage.name}</h4>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium flex items-center ml-2 flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {stage.time}
                        </div>
                      </div>
                      
                      {expandedStage === stage.stage && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-3 pt-0 border-t border-gray-100 dark:border-gray-700"
                        >
                          <p className="text-gray-600 dark:text-gray-400">{stage.desc}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* 참가자 준비 상태 표시 */}
              <div className="bg-indigo-50 dark:bg-indigo-900/40 rounded-xl p-5 shadow-md border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  참가자 준비 상태
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className={`flex items-center p-3 rounded-lg ${
                        readyUsers[participant.id] 
                          ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="mr-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                          <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                            {participant.username.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {participant.username}
                          {participant.id === userId && " (나)"}
                        </p>
                        <p className={`text-sm ${
                          readyUsers[participant.id] 
                            ? 'text-green-700 dark:text-green-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {readyUsers[participant.id] ? '준비 완료!' : '대기 중...'}
                        </p>
                      </div>
                      {readyUsers[participant.id] && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
                
                {participants.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-2">
                    아직 참가자가 없습니다. 곧 함께할 분들이 들어올 거예요!
                  </p>
                )}
              </div>
              
              {/* 참여 동의 및 안내 */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 dark:border-amber-700 p-4 rounded-r-lg">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  대화 참여 안내
                </h4>
                <p className="text-amber-900 dark:text-amber-200 font-medium">
                  대화가 시작되면 각 단계별로 정해진 시간 내에 의견을 자유롭게 나눌 수 있습니다.
                  모든 참가자가 준비 완료를 해야 대화가 시작됩니다. 준비가 되셨다면 아래 준비 완료 버튼을 눌러주세요!
                </p>
              </div>
            </div>
          </div>
          
          {/* 푸터 */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-5 bg-gray-50 dark:bg-gray-900 flex flex-col space-y-3">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-3">
              {isEveryoneReady 
                ? '모든 참가자가 준비를 마쳤습니다! 이제 시작할 수 있어요.'
                : `${Object.values(readyUsers).filter(Boolean).length}/${participants.length}명이 준비를 마쳤습니다.`
              }
            </div>
            
            <div className="flex flex-col space-y-3 w-full">
              <button 
                onClick={handleUserReady}
                className={`px-5 py-3 rounded-lg flex items-center justify-center transition-colors w-full ${
                  isUserReady
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
                }`}
              >
                {isUserReady 
                  ? <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      준비 완료!
                    </>
                  : '준비 완료'
                }
              </button>
              
              <button 
                onClick={handleStartTrialButtonClick}
                disabled={!(isEveryoneReady || Object.values(readyUsers).filter(v => Boolean(v)).length >= participants.length)}
                className={`px-5 py-3 rounded-lg flex items-center justify-center transition-colors w-full ${
                  isEveryoneReady || Object.values(readyUsers).filter(v => Boolean(v)).length >= participants.length
                    ? 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-bold shadow-md'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                <Gavel className="w-4 h-4 mr-2" />
                대화 시작하기
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
} 