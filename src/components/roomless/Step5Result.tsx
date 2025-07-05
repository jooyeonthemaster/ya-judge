'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Brain, MessageCircle, Heart, Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Analysis {
  complexity: string;
  emotionalIndex: number;
  solvability: number;
  rootCause: string;
  relationshipDynamics: string;
  psychologicalPattern: string;
  communicationIssues: string;
  underlyingNeeds: string;
}

interface ResponsibilityRatio {
  plaintiff: number;
  defendant: number;
}

interface Judgment {
  caseSummary: string;
  analysis: Analysis;
  verdict: string;
  reasoning: string;
  solutions: string[];
  responsibilityRatio: ResponsibilityRatio;
  coreAdvice: string;
  finalMessage: string;
}

interface Step5ResultProps {
  judgment: Judgment;
  onRestart: () => void;
  onBackToMain: () => void;
}

const Step5Result: React.FC<Step5ResultProps> = ({ judgment, onRestart, onBackToMain }) => {
  // 마크다운 제거 함수
  const removeMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '') // **bold** 제거
      .replace(/\*/g, '')   // *italic* 제거
      .replace(/#{1,6}\s/g, '') // # headers 제거
      .replace(/`([^`]+)`/g, '$1') // `code` 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) 제거
      .trim();
  };

  // 감정 지수 색상 및 아이콘
  const getEmotionalDisplay = (index: number) => {
    if (index >= 8) return { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: '🔥', 
      label: '매우높음',
      description: '극도로 격한 감정 상태'
    };
    if (index >= 6) return { 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-200',
      icon: '⚡', 
      label: '높음',
      description: '강한 감정적 반응'
    };
    if (index >= 3) return { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: '🌊', 
      label: '보통',
      description: '일반적인 감정 수준'
    };
    return { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: '🌱', 
      label: '낮음',
      description: '차분한 감정 상태'
    };
  };

  // 해결 가능성 색상
  const getSolvabilityColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  // 복잡도 표시
  const getComplexityDisplay = (complexity: string) => {
    const complexityMap: { [key: string]: { icon: string; color: string; description: string } } = {
      '단순': { icon: '📊', color: 'text-blue-600', description: '명확한 원인과 해결책' },
      '중간': { icon: '📈', color: 'text-yellow-600', description: '다면적 요소 고려 필요' },
      '복잡': { icon: '🔄', color: 'text-orange-600', description: '여러 변수가 얽힌 상황' },
      '매우복잡': { icon: '🌀', color: 'text-red-600', description: '다층적 분석 필요' }
    };
    
    return complexityMap[complexity] || complexityMap['중간'];
  };

  const emotionalDisplay = getEmotionalDisplay(judgment.analysis.emotionalIndex);
  const complexityDisplay = getComplexityDisplay(judgment.analysis.complexity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl mb-4"
        >
          ⚖️
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          판결 완료!
        </h2>
        <p className="text-gray-600 text-lg">
          AI 판사가 공정하게 심리한 결과입니다
        </p>
      </div>

      {/* 사건 요약 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
      >
        <div className="flex items-start space-x-3">
          <div className="bg-purple-500 text-white p-2 rounded-lg">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🔨 사건 요약</h3>
            <p className="text-gray-700 leading-relaxed">
              {removeMarkdown(judgment.caseSummary)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 전문 심리 분석 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
      >
        <div className="flex items-start space-x-3 mb-6">
          <div className="bg-indigo-500 text-white p-2 rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-indigo-800">🧠 전문 심리 분석</h3>
        </div>

        {/* 기본 지표들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`${complexityDisplay.color} text-center`}>
            <div className="text-2xl mb-1">{complexityDisplay.icon}</div>
            <div className="font-semibold">갈등 복잡도</div>
            <div className="text-sm font-bold">{judgment.analysis.complexity}</div>
            <div className="text-xs text-gray-500 mt-1">{complexityDisplay.description}</div>
          </div>

          <div className={`${emotionalDisplay.color} text-center`}>
            <div className="text-2xl mb-1">{emotionalDisplay.icon}</div>
            <div className="font-semibold">감정 지수</div>
            <div className="text-sm font-bold">{judgment.analysis.emotionalIndex}/10</div>
            <div className="text-xs text-gray-500 mt-1">{emotionalDisplay.label}</div>
          </div>

          <div className={`${getSolvabilityColor(judgment.analysis.solvability)} text-center`}>
            <div className="text-2xl mb-1">
              {judgment.analysis.solvability >= 70 ? '✅' : 
               judgment.analysis.solvability >= 50 ? '⚖️' : 
               judgment.analysis.solvability >= 30 ? '⚠️' : '🚨'}
            </div>
            <div className="font-semibold">해결 가능성</div>
            <div className="text-sm font-bold">{judgment.analysis.solvability}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {judgment.analysis.solvability >= 70 ? '높은 가능성' : 
               judgment.analysis.solvability >= 50 ? '보통' : 
               judgment.analysis.solvability >= 30 ? '어려움' : '매우 어려움'}
            </div>
          </div>

          <div className="text-purple-600 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="font-semibold">핵심 원인</div>
            <div className="text-xs font-semibold mt-1">
              {judgment.analysis.rootCause.length > 15 
                ? judgment.analysis.rootCause.substring(0, 15) + '...'
                : judgment.analysis.rootCause}
            </div>
          </div>
        </div>

        {/* 상세 분석 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Scale className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-800">관계 역학</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {removeMarkdown(judgment.analysis.relationshipDynamics)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-indigo-800">심리적 패턴</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {removeMarkdown(judgment.analysis.psychologicalPattern)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800">소통 문제점</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {removeMarkdown(judgment.analysis.communicationIssues)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="font-semibold text-pink-800">숨겨진 욕구</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {removeMarkdown(judgment.analysis.underlyingNeeds)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 책임 비율 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200"
      >
        <div className="flex items-start space-x-3 mb-4">
          <div className="bg-orange-500 text-white p-2 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-orange-800">⚖️ 책임 비율</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">원고 (신청인)</span>
            <span className="font-bold text-red-600">{judgment.responsibilityRatio.plaintiff}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${judgment.responsibilityRatio.plaintiff}%` }}
              transition={{ delay: 0.8, duration: 1 }}
              className="bg-red-500 h-3 rounded-full"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">피고 (상대방)</span>
            <span className="font-bold text-blue-600">{judgment.responsibilityRatio.defendant}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${judgment.responsibilityRatio.defendant}%` }}
              transition={{ delay: 0.9, duration: 1 }}
              className="bg-blue-500 h-3 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 최종 판결 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-300"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Scale className="w-6 h-6 text-gray-600" />
          <span>⚖️ 최종 판결</span>
        </h3>
        <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 mb-4">
          <p className="text-gray-800 font-medium leading-relaxed">
            <strong>판결:</strong> {removeMarkdown(judgment.verdict)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-gray-700 leading-relaxed">
            <strong>📝 판결 근거:</strong> {removeMarkdown(judgment.reasoning)}
          </p>
        </div>
      </motion.div>

      {/* 단계별 해결 방안 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
      >
        <div className="flex items-start space-x-3 mb-6">
          <div className="bg-green-500 text-white p-2 rounded-lg">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-green-800">💡 단계별 해결 방안</h3>
        </div>

        <div className="space-y-4">
          {judgment.solutions.map((solution, index) => {
            const stepNumbers = ['1', '2', '3', '4'];
            const stepTitles = ['즉시 실행', '단기 개선', '중기 발전', '장기 비전'];
            const stepColors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  <div className={`${stepColors[index]} text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold`}>
                    {stepNumbers[index]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">{stepTitles[index]}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {removeMarkdown(solution)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 핵심 조언 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1 }}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200"
      >
        <div className="text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-lg font-semibold text-amber-800 mb-3">핵심 조언</h3>
          <p className="text-gray-800 font-medium text-lg leading-relaxed">
            "{removeMarkdown(judgment.coreAdvice)}"
          </p>
        </div>
      </motion.div>

      {/* 액션 버튼들 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => {
            // 판결 결과 공유 기능 (추후 구현)
            if (navigator.share) {
              navigator.share({
                title: 'AI 판사 판결 결과',
                text: removeMarkdown(judgment.caseSummary),
                url: window.location.href
              });
            }
          }}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          판결 결과 공유하기
        </button>
        
        <button
          onClick={onRestart}
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          새 사건 접수
        </button>
        
        <button
          onClick={onBackToMain}
          className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          메인으로
        </button>
      </motion.div>

      {/* 마무리 말씀 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200"
      >
        <div className="text-center space-y-3">
          <div className="text-3xl">💕</div>
          <h3 className="text-lg font-semibold text-pink-800">마무리 말씀</h3>
          <p className="text-gray-700 leading-relaxed">
            {removeMarkdown(judgment.finalMessage)}
          </p>
          
          <div className="mt-6 pt-4 border-t border-pink-200">
            <p className="text-sm text-gray-600">
              <strong>판결이 도움이 되셨나요?</strong><br />
              AI 판사의 판결은 참고용이며 법적 효력은 없습니다.<br />
              건전하고 건강한 관계를 위해 서로 이해하고 배려하세요 💕
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Step5Result; 