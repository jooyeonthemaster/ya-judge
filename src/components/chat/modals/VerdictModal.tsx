import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  Gavel, 
  X,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Target
} from 'lucide-react';

interface VerdictData {
  responses?: Array<{
    targetUser: string;
    analysis: string;
    message: string;
    style: string;
    percentage: number;
    reasoning: string[];
    punishment: string;
  }>;
  verdict: {
    summary: string;
    conflict_root_cause: string;
    recommendation: string;
  };
}

interface VerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdictData: VerdictData | null;
}

// Optimized animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// 책임 비율 진행 막대 컴포넌트 - 최적화됨
const ResponsibilityBar = ({ percentage, name }: { percentage: number; name: string }) => {
  const getColorClass = (pct: number) => {
    if (pct >= 70) return 'from-red-500 to-red-600'; // 높은 책임
    if (pct >= 40) return 'from-yellow-500 to-orange-500'; // 중간 책임
    return 'from-green-500 to-green-600'; // 낮은 책임
  };
  
  const getTextColor = (pct: number) => {
    if (pct >= 70) return 'text-red-700';
    if (pct >= 40) return 'text-orange-700';
    return 'text-green-700';
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{name}님 갈등 책임도</span>
        <span className={`text-lg font-bold ${getTextColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={`h-full bg-gradient-to-r ${getColorClass(percentage)} rounded-full`}
          style={{ willChange: 'width' }}
        />
      </div>
      <div className="text-xs text-gray-500 text-center">
        {percentage >= 70 ? '높은 책임' : 
         percentage >= 40 ? '중간 책임' : '낮은 책임'}
      </div>
    </motion.div>
  );
};

// 승자 표시 컴포넌트 - 최적화됨
const WinnerDisplay = ({ responses }: { responses: VerdictData['responses'] }) => {
  if (!responses || responses.length === 0) return null;
  
  // 가장 낮은 책임 비율을 가진 사람이 승자
  const winner = responses.reduce((prev, current) => 
    prev.percentage < current.percentage ? prev : current
  );
  
  const loser = responses.reduce((prev, current) => 
    prev.percentage > current.percentage ? prev : current
  );

  // 승자와 패자의 책임도를 100%로 정규화
  const totalPercentage = winner.percentage + loser.percentage;
  const normalizedWinnerPercentage = totalPercentage > 0 ? Math.round((winner.percentage / totalPercentage) * 100) : 50;
  const normalizedLoserPercentage = 100 - normalizedWinnerPercentage;

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200 mb-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Award className="h-6 w-6 text-emerald-600" />
        <h3 className="text-xl font-bold text-emerald-900">갈등 분석 결과</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">더 합리적</span>
          </div>
          <div className="text-lg font-bold text-emerald-800">{winner.targetUser}님</div>
          <div className="text-sm text-emerald-600">책임도: {normalizedWinnerPercentage}%</div>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">더 많은 책임</span>
          </div>
          <div className="text-lg font-bold text-red-800">{loser.targetUser}님</div>
          <div className="text-sm text-red-600">책임도: {normalizedLoserPercentage}%</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function VerdictModal({ isOpen, onClose, verdictData }: VerdictModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  const [activeParticipant, setActiveParticipant] = useState<number>(0);
  
  if (!verdictData) return null;

  // 정규화된 퍼센티지 계산 (요약 탭과 동일한 로직)
  const getNormalizedPercentage = (targetUser: string) => {
    if (!verdictData.responses || verdictData.responses.length < 2) return null;
    
    const winner = verdictData.responses.reduce((prev, current) => 
      prev.percentage < current.percentage ? prev : current
    );
    const loser = verdictData.responses.reduce((prev, current) => 
      prev.percentage > current.percentage ? prev : current
    );
    
    const totalPercentage = winner.percentage + loser.percentage;
    if (totalPercentage === 0) return 50;
    
    if (targetUser === winner.targetUser) {
      return Math.round((winner.percentage / totalPercentage) * 100);
    } else if (targetUser === loser.targetUser) {
      return 100 - Math.round((winner.percentage / totalPercentage) * 100);
    }
    
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
          style={{ willChange: 'opacity' }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              duration: 0.3, 
              type: "spring", 
              stiffness: 400,
              damping: 25 
            }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200"
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - 모바일 최적화 */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 sm:p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                    <Gavel className="h-5 w-5 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold">최종 판결</h2>
                    <p className="text-white/80 text-xs sm:text-sm">AI 판사의 공정한 결정</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Tab Navigation - 모바일 최적화 */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'summary'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>판결 요약</span>
                </button>
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'individual'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>개별 분석</span>
                </button>
              </div>
            </div>

            {/* Content - 모바일 최적화 */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-180px)]">
              <motion.div 
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="p-3 sm:p-6 space-y-4 sm:space-y-6"
              >
                
                {/* 판결 요약 탭 */}
                {activeTab === 'summary' && (
                  <>
                    {/* 승자 표시 */}
                    <WinnerDisplay responses={verdictData.responses} />
                    {/* add level here */}
                    
                    {/* 책임도 분석 */}
                    {/* {verdictData.responses && verdictData.responses.length > 0 && (
                      <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                          <Target className="h-5 w-5 mr-2 text-indigo-600" />
                          갈등 책임도 분석
                        </h3>
                        {verdictData.responses.map((response, index) => (
                          <ResponsibilityBar
                            key={index}
                            percentage={getNormalizedPercentage(response.targetUser) || response.percentage}
                            name={response.targetUser}
                          />
                        ))}
                      </motion.div>
                    )} */}

                    {/* 판결 요약 */}
                    <motion.div variants={itemVariants} className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <Scale className="h-5 w-5 mr-2 text-indigo-600" />
                        판결 요약
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                        {verdictData.verdict.summary}
                      </p>
                    </motion.div>

                    {/* 갈등 원인 */}
                    <motion.div variants={itemVariants} className="bg-red-50 p-4 sm:p-6 rounded-xl border border-red-200">
                      <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-3 sm:mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        갈등의 근본 원인
                      </h3>
                      <p className="text-red-800 text-sm sm:text-base leading-relaxed">
                        {verdictData.verdict.conflict_root_cause}
                      </p>
                    </motion.div>

                    {/* 해결 방안 */}
                    <motion.div variants={itemVariants} className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4 flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
                        개선 권고사항
                      </h3>
                      <p className="text-blue-800 text-sm sm:text-base leading-relaxed">
                        {verdictData.verdict.recommendation}
                      </p>
                    </motion.div>
                  </>
                )}

                {/* 개별 분석 탭 */}
                {activeTab === 'individual' && verdictData.responses && (
                  <motion.div variants={contentVariants} className="space-y-4 sm:space-y-6">
                    {/* 참가자 선택 버튼들 - 모바일 최적화 */}
                    <div className="flex flex-wrap gap-2">
                      {verdictData.responses.map((response, index) => (
                        <motion.button
                          key={index}
                          variants={itemVariants}
                          onClick={() => setActiveParticipant(index)}
                          className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                            activeParticipant === index
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {response.targetUser}님
                        </motion.button>
                      ))}
                    </div>

                    {/* 선택된 참가자의 상세 분석 */}
                    {verdictData.responses[activeParticipant] && (
                      <motion.div
                        key={activeParticipant}
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4 sm:space-y-6"
                      >
                        {/* 책임도 표시 */}
                        <ResponsibilityBar
                          percentage={getNormalizedPercentage(verdictData.responses[activeParticipant].targetUser) || verdictData.responses[activeParticipant].percentage}
                          name={verdictData.responses[activeParticipant].targetUser}
                        />

                        {/* 상세 분석 */}
                        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-indigo-600" />
                            {verdictData.responses[activeParticipant].targetUser}님에 대한 분석
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">분석 내용:</span>
                              <p className="text-gray-800 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                                {verdictData.responses[activeParticipant].analysis}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">판사 메시지:</span>
                              <p className="text-gray-800 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                {verdictData.responses[activeParticipant].message}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">말투 & 성향:</span>
                              <p className="text-gray-800 text-sm bg-purple-50 p-3 rounded-lg">
                                {verdictData.responses[activeParticipant].style}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        {/* 판단 근거 */}
                        <motion.div variants={itemVariants} className="bg-yellow-50 p-4 sm:p-6 rounded-xl border border-yellow-200">
                          <h4 className="text-lg font-bold text-yellow-900 mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                            판단 근거
                          </h4>
                          <div className="space-y-2">
                            {verdictData.responses[activeParticipant].reasoning.map((reason, reasonIndex) => (
                              <motion.div
                                key={reasonIndex}
                                variants={itemVariants}
                                className="flex items-start space-x-2"
                              >
                                <span className="text-yellow-600 font-bold text-sm mt-1">{reasonIndex + 1}.</span>
                                <p className="text-yellow-800 text-sm leading-relaxed">{reason}</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* 처벌/개선사항 */}
                        <motion.div variants={itemVariants} className="bg-red-50 p-4 sm:p-6 rounded-xl border border-red-200">
                          <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                            <Gavel className="h-5 w-5 mr-2 text-red-600" />
                            개선 및 처벌 사항
                          </h4>
                          <p className="text-red-800 text-sm leading-relaxed">
                            {verdictData.responses[activeParticipant].punishment}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}