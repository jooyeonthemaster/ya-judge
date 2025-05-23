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

// 책임 비율 진행 막대 컴포넌트
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
    <div className="space-y-3">
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
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getColorClass(percentage)} rounded-full relative`}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </motion.div>
      </div>
      <div className="text-xs text-gray-500 text-center">
        {percentage >= 70 ? '높은 책임' : 
         percentage >= 40 ? '중간 책임' : '낮은 책임'}
      </div>
    </div>
  );
};

// 승자 표시 컴포넌트
const WinnerDisplay = ({ responses }: { responses: VerdictData['responses'] }) => {
  if (!responses || responses.length === 0) return null;
  
  // 가장 낮은 책임 비율을 가진 사람이 승자
  const winner = responses.reduce((prev, current) => 
    prev.percentage < current.percentage ? prev : current
  );
  
  const loser = responses.reduce((prev, current) => 
    prev.percentage > current.percentage ? prev : current
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200 mb-6">
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
          <div className="text-sm text-emerald-600">책임도: {winner.percentage}%</div>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">더 많은 책임</span>
          </div>
          <div className="text-lg font-bold text-red-800">{loser.targetUser}님</div>
          <div className="text-sm text-red-600">책임도: {loser.percentage}%</div>
        </div>
      </div>
    </div>
  );
};

export default function VerdictModal({ isOpen, onClose, verdictData }: VerdictModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  const [activeParticipant, setActiveParticipant] = useState<number>(0);
  
  if (!verdictData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200"
          >
            {/* Header - 모바일 최적화 */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 sm:p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
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
              <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* 판결 요약 탭 */}
                {activeTab === 'summary' && (
                  <>
                    {/* 승자 표시 */}
                    <WinnerDisplay responses={verdictData.responses} />
                    
                    {/* 판결 요약 */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        <h3 className="text-lg sm:text-xl font-bold text-blue-900">판결 요약</h3>
                      </div>
                      <p className="text-gray-800 text-sm sm:text-lg leading-relaxed whitespace-pre-line">
                        {verdictData.verdict.summary}
                      </p>
                    </div>

                    {/* 갈등 원인 분석 */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 rounded-xl border border-amber-200">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                        <h3 className="text-lg sm:text-xl font-bold text-amber-900">갈등 원인 분석</h3>
                      </div>
                      <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {verdictData.verdict.conflict_root_cause}
                      </p>
                    </div>

                    {/* 권고사항 */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        <h3 className="text-lg sm:text-xl font-bold text-green-900">향후 권고사항</h3>
                      </div>
                      <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {verdictData.verdict.recommendation}
                      </p>
                    </div>
                  </>
                )}

                {/* 개별 참가자 분석 탭 */}
                {activeTab === 'individual' && verdictData.responses && verdictData.responses.length > 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">개별 참가자 분석</h3>
                      <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {verdictData.responses.length}명 분석 완료
                      </span>
                    </div>

                    {/* 참가자 선택 버튼들 - 모바일 최적화 */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4 sm:mb-6">
                      {verdictData.responses.map((response, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveParticipant(index)}
                          className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-xs sm:text-sm ${
                            activeParticipant === index
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            activeParticipant === index
                              ? 'bg-white text-purple-600'
                              : 'bg-purple-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium truncate">{response.targetUser}님</span>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            response.percentage <= 30 ? 'bg-green-500' :
                            response.percentage <= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                        </button>
                      ))}
                    </div>

                    {/* 선택된 참가자의 상세 분석 */}
                    {verdictData.responses[activeParticipant] && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border border-purple-200 shadow-sm space-y-4 sm:space-y-6">
                        
                        {/* 참가자 정보 헤더 */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <h4 className="text-lg sm:text-2xl font-bold text-purple-900 flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold">
                              {activeParticipant + 1}
                            </div>
                            <span>{verdictData.responses[activeParticipant].targetUser}님 분석</span>
                          </h4>
                        </div>

                        {/* 책임 비율 표시 */}
                        <ResponsibilityBar 
                          percentage={verdictData.responses[activeParticipant].percentage}
                          name={verdictData.responses[activeParticipant].targetUser}
                        />

                        {/* 상세 분석 */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-4">
                          <div>
                            <h5 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">📝 상세 분석</h5>
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                              {verdictData.responses[activeParticipant].analysis}
                            </p>
                          </div>

                          <div>
                            <h5 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">💬 판사 메시지</h5>
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                              {verdictData.responses[activeParticipant].message}
                            </p>
                          </div>

                          <div>
                            <h5 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">🎭 말투 & 성향</h5>
                            <p className="text-gray-600 text-sm sm:text-base">
                              {verdictData.responses[activeParticipant].style}
                            </p>
                          </div>

                          {verdictData.responses[activeParticipant].reasoning && verdictData.responses[activeParticipant].reasoning.length > 0 && (
                            <div>
                              <h5 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">🔍 판단 근거</h5>
                              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm sm:text-base">
                                {verdictData.responses[activeParticipant].reasoning.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {verdictData.responses[activeParticipant].punishment && (
                            <div>
                              <h5 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">⚖️ 권고 조치</h5>
                              <p className="text-red-600 font-medium text-sm sm:text-base">
                                {verdictData.responses[activeParticipant].punishment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}