'use client';

import { motion } from 'framer-motion';
import { 
  Gavel,
  Scale,
  AlertCircle,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Brain,
  ListChecks
} from 'lucide-react';
import { VerdictData, IssueJudgement } from '@/lib/gemini';

interface VerdictDisplayProps {
  verdictData: VerdictData;
  currentUsername: string;
}

export const VerdictDisplay = ({
  verdictData,
  currentUsername
}: VerdictDisplayProps) => {
  if (!verdictData) return null;
  
  const { responses, verdict, issueJudgements } = verdictData;
  
  // 현재 사용자에 대한 판결 찾기
  const myResponse = responses.find(r => r.targetUser === currentUsername);
  
  // 전체 책임 비율이 높은 순으로 정렬
  const sortedResponses = [...responses].sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="space-y-6">
      {/* 판결 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-indigo-50 p-4 rounded-xl border-l-4 border-indigo-500"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-indigo-500 text-white p-2 rounded-full">
            <Gavel className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-indigo-700">판결</h2>
        </div>
        
        <p className="text-indigo-900 font-medium">{verdict.summary}</p>
      </motion.div>
      
      {/* 쟁점별 판단 */}
      {issueJudgements && issueJudgements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">쟁점별 판단</h3>
          </div>
          
          <div className="space-y-4">
            {issueJudgements.map((issue, index) => (
              <div 
                key={index}
                className="bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <div className="font-medium text-gray-800 mb-2">{issue.issue}</div>
                <div className="text-gray-700 mb-1">
                  <span className="font-medium">판단:</span> {issue.judgement}
                </div>
                <div className="text-gray-600 text-sm">
                  <span className="font-medium">이유:</span> {issue.reasoning}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* 개인별 판결 */}
      <div className="space-y-4">
        {sortedResponses.map((response, index) => (
          <motion.div
            key={response.targetUser}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            className={`p-4 rounded-xl ${
              response.targetUser === currentUsername
                ? 'bg-indigo-50 border-l-4 border-indigo-500'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Scale className={`w-5 h-5 ${
                  response.targetUser === currentUsername ? 'text-indigo-600' : 'text-gray-600'
                }`} />
                <h3 className={`font-bold ${
                  response.targetUser === currentUsername ? 'text-indigo-800' : 'text-gray-800'
                }`}>
                  {response.targetUser}{response.targetUser === currentUsername ? ' (나)' : ''}님에 대한 판결
                </h3>
              </div>
              
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                response.percentage > 75
                  ? 'bg-red-100 text-red-700'
                  : response.percentage > 50
                    ? 'bg-orange-100 text-orange-700'
                    : response.percentage > 25
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
              }`}>
                책임 {response.percentage}%
              </div>
            </div>
            
            {/* 판결 메시지 */}
            <div className={`p-3 rounded-lg mb-3 ${
              response.targetUser === currentUsername ? 'bg-white' : 'bg-gray-50'
            }`}>
              <p className="whitespace-pre-wrap break-words">{response.message}</p>
            </div>
            
            {/* 판단 근거 */}
            <div className="mb-3">
              <div className="text-sm font-medium mb-2 text-gray-700">판단 근거:</div>
              <ul className="space-y-1">
                {response.reasoning.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="text-gray-400 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <span className="text-gray-800">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 조치 사항 */}
            <div>
              <div className="text-sm font-medium mb-2 text-gray-700">조치 사항:</div>
              <div className={`text-sm p-3 rounded-lg ${
                response.targetUser === currentUsername
                  ? 'bg-indigo-50 text-indigo-800'
                  : 'bg-gray-50 text-gray-800'
              }`}>
                {response.punishment}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* 갈등 원인 및 해결 방안 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-purple-50 p-4 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-800">갈등의 근본 원인</h3>
          </div>
          <p className="text-purple-900">{verdict.conflict_root_cause}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-green-50 p-4 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">해결 방안</h3>
          </div>
          <p className="text-green-900">{verdict.recommendation}</p>
        </motion.div>
      </div>
      
      {/* 항소 옵션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="flex justify-center pt-4"
      >
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          항소하기
        </button>
      </motion.div>
    </div>
  );
};

export default VerdictDisplay;