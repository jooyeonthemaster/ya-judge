'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gavel, MessageCircle, FileText, AlertTriangle, 
  CheckCircle, HelpCircle, Scale, Lightbulb,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

interface JudgeMessageDisplayProps {
  text: string;
  stage: string;
}

export default function JudgeMessageDisplay({ text, stage }: JudgeMessageDisplayProps) {
  const [expanded, setExpanded] = useState(true);
  
  // 판사 메시지에서 중요 부분 강조 처리 (예: *강조*를 볼드체로)
  const formatMessage = (message: string) => {
    // 강조 표시 처리
    return message.replace(/\*([^*]+)\*/g, '<strong class="text-indigo-900 bg-indigo-50 px-1 rounded">$1</strong>');
  };
  
  // 단계별 아이콘 및 제목 정의
  const getStageInfo = () => {
    switch(stage) {
      case 'intro':
        return { 
          icon: <Gavel className="w-5 h-5 text-white" />, 
          title: '재판 소개' 
        };
      case 'opening':
        return { 
          icon: <MessageCircle className="w-5 h-5 text-white" />, 
          title: '모두 진술' 
        };
      case 'issues':
        return { 
          icon: <FileText className="w-5 h-5 text-white" />, 
          title: '쟁점 정리' 
        };
      case 'discussion':
        return { 
          icon: <Scale className="w-5 h-5 text-white" />, 
          title: '토론 진행' 
        };
      case 'questions':
        return { 
          icon: <HelpCircle className="w-5 h-5 text-white" />, 
          title: '판사 질문' 
        };
      case 'closing':
        return { 
          icon: <CheckCircle className="w-5 h-5 text-white" />, 
          title: '최종 변론' 
        };
      case 'verdict':
        return { 
          icon: <Gavel className="w-5 h-5 text-white" />, 
          title: '최종 판결' 
        };
      default:
        return { 
          icon: <Gavel className="w-5 h-5 text-white" />, 
          title: '판사 메시지' 
        };
    }
  };
  
  // 판사 메시지 변환 (재미있는 말투 적용)
  const transformJudgeMessage = (message: string) => {
    // 기본 문구 변환
    let transformed = message;
    
    // 단계별 인트로 문구 개선
    if (stage === 'opening' && message.includes('모두 진술 단계를 시작')) {
      transformed = transformed.replace(
        '지금부터 모두 진술 단계를 시작하겠습니다.',
        '✨ 자, 무대는 여러분의 것! 지금부터 각자의 드라마틱한 스토리를 들려주세요~'
      );
    }
    
    if (stage === 'issues' && message.includes('쟁점 정리')) {
      transformed = transformed.replace(
        '쟁점을 정리하겠습니다',
        '복잡한 이야기를 세 줄 요약해볼게요! 핵심은 바로 이것! 🔍'
      );
    }
    
    if (stage === 'questions') {
      transformed = transformed.replace(
        '질문을 드리겠습니다',
        '잠깐! 판사님이 궁금한 게 있어요. 이것 좀 설명해주시겠어요? 🤔'
      );
    }
    
    // 일반적인 형식적 표현 개선
    transformed = transformed
      .replace('안녕하세요', '여러분 안녕하세요~ 👋')
      .replace('환영합니다', '환영합니다! 🎉')
      .replace('법정에 오신 것을', '오늘의 법정에 입장하신 것을')
      .replace('설명해주세요', '들려주세요')
      .replace('정해진 시간이', '⏱️ 정해진 시간이')
      .replace('도움이 됩니다', '큰 도움이 됩니다! 👍');
    
    return transformed;
  };
  
  // 판사 메시지 템플릿 선택
  const renderMessageContent = () => {
    // JSON 형식 메시지 체크
    if (text.startsWith("{") || text.includes("responses") || text.includes("issues")) {
      // JSON 형식은 기존 형식대로 처리
      return <p className="text-gray-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(text) }} />;
    }
    
    // 일반 텍스트 메시지를 단락별로 나누고 각 단락에 스타일 적용
    // 재미있는 말투 적용
    const transformedText = transformJudgeMessage(text);
    const paragraphs = transformedText.split('\n\n').filter(p => p.trim());
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, idx) => {
          // 첫 단락은 특별 처리 (주요 메시지)
          if (idx === 0) {
            return (
              <div key={idx} className="text-lg font-medium text-indigo-900 border-b border-indigo-100 pb-3">
                <Sparkles className="inline-block w-5 h-5 mr-2 text-indigo-500" />
                <span dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} />
              </div>
            );
          }
          
          // 지시사항이나 안내 (예: "예시:" 로 시작하는 부분)
          if (paragraph.includes("예시:") || paragraph.includes("참고:") || paragraph.includes("주의:")) {
            return (
              <div key={idx} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                <Lightbulb className="inline-block w-4 h-4 mr-2 text-blue-600" />
                <span className="text-blue-900" dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} />
              </div>
            );
          }
          
          // 불릿 포인트로 시작하는 항목들
          if (paragraph.includes('- ')) {
            const items = paragraph.split('- ').filter(item => item.trim());
            return (
              <ul key={idx} className="space-y-2 pl-1">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2 mt-0.5">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <span className="text-gray-900" dangerouslySetInnerHTML={{ __html: formatMessage(item.trim()) }} />
                  </li>
                ))}
              </ul>
            );
          }
          
          // 일반 단락
          return (
            <p key={idx} className="text-gray-900" dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} />
          );
        })}
      </div>
    );
  };
  
  const { icon, title } = getStageInfo();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md border border-indigo-200 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-full hover:bg-indigo-400 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </button>
      </div>
      
      {/* 내용 */}
      {expanded && (
        <div className="p-4">
          {renderMessageContent()}
        </div>
      )}
    </motion.div>
  );
} 