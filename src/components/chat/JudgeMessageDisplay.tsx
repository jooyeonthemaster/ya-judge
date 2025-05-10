'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Gavel, MessageCircle, FileText, AlertTriangle, 
  CheckCircle, HelpCircle, Scale, Lightbulb,
  ChevronDown, ChevronUp, Sparkles, Clock
} from 'lucide-react';

interface JudgeMessageDisplayProps {
  text: string;
  stage: string;
}

export default function JudgeMessageDisplay({ text, stage }: JudgeMessageDisplayProps) {
  const [expanded, setExpanded] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fullTextRef = useRef('');
  const charIndexRef = useRef(0);
  
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
  
  // 판사 메시지 변환
  const transformJudgeMessage = (message: string) => {
    if (!message) return '';
    
    // 기본 문구 변환
    let transformed = message;
    
    // undefined 문자열 제거
    transformed = transformed.replace(/\. undefined/g, '.');
    transformed = transformed.replace(/ undefined[.,]?/g, '');
    transformed = transformed.replace(/undefined$/g, '');
    
    // 단계별 인트로 문구 개선
    if (stage === 'opening' && message.includes('모두 진술 단계를 시작')) {
      transformed = transformed.replace(
        '지금부터 모두 진술 단계를 시작하겠습니다.',
        '지금부터 모두 진술 단계를 시작하겠습니다. 모두 진술은 각 당사자가 자신의 주장을 요약하여 발표하는 단계입니다. 각 당사자는 상대방의 발언을 방해하지 말고 차례를 지켜주시기 바랍니다. 이 단계에서는 *5분의 제한 시간*이 주어지며, 핵심적인 내용을 간결하게 전달해 주시기 바랍니다.'
      );
    }
    
    if (stage === 'issues' && message.includes('쟁점 정리')) {
      transformed = transformed.replace(
        '쟁점을 정리하겠습니다',
        '지금부터 제시된 내용을 바탕으로 쟁점을 정리하겠습니다'
      );
    }
    
    if (stage === 'questions') {
      transformed = transformed.replace(
        '질문을 드리겠습니다',
        '쟁점에 관하여 몇 가지 질문을 드리겠습니다'
      );
    }
    
    // 마크다운 처리
    transformed = transformed
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/```(.*?)```/g, '<code>$1</code>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // 비어있는 경우 기본 텍스트 반환
    if (!transformed || transformed.trim().length === 0) {
      return '판사 메시지를 불러오는 중 오류가 발생했습니다.';
    }
    
    return transformed;
  };

  // 타이핑 효과 설정
  useEffect(() => {
    if (!text) return;
    
    // 텍스트 변환 및 초기화
    const transformedText = transformJudgeMessage(text) || '';
    fullTextRef.current = transformedText;
    
    // 인사말 처리 - 중요 부분은 즉시 표시
    if (stage === 'opening' && text.includes('안녕하세요')) {
      // 인사말 부분은 바로 표시
      const greeting = '안녕하세요, 법정에 오신 것을 환영합니다.';
      setDisplayedText(greeting);
      charIndexRef.current = greeting.length;
      
      // 나머지 부분은 타이핑 효과로 표시 (빠른 속도)
      const typingInterval = setInterval(() => {
        if (charIndexRef.current < fullTextRef.current.length) {
          setDisplayedText(prevText => prevText + fullTextRef.current[charIndexRef.current]);
          charIndexRef.current++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 3); // 타이핑 속도 더 빠르게 (3ms)
      
      return () => clearInterval(typingInterval);
    } else {
      // 일반 메시지는 기존 방식으로 표시 (빠른 속도)
      charIndexRef.current = 0;
      setDisplayedText('');
      setIsTyping(true);
      
      // 타이핑 효과 시작 - 속도 증가
      const typingInterval = setInterval(() => {
        if (charIndexRef.current < fullTextRef.current.length) {
          setDisplayedText(prevText => prevText + fullTextRef.current[charIndexRef.current]);
          charIndexRef.current++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 3); // 타이핑 속도 더 빠르게 (3ms)
      
      return () => clearInterval(typingInterval);
    }
  }, [text, stage]);
  
  // 판사 메시지 템플릿 선택
  const renderMessageContent = () => {
    // 비어있는 경우 처리
    if (!displayedText) {
      return <p className="text-gray-500 italic">메시지를 로드하는 중...</p>;
    }
    
    // JSON 형식 메시지 체크
    if (text.startsWith("{") || text.includes("responses") || text.includes("issues")) {
      // JSON 형식은 타이핑 효과 없이 기존 형식대로 처리
      return <p className="text-gray-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(text) }} />;
    }
    
    // 타이핑 효과가 적용된 텍스트를 단락별로 나누기
    const paragraphs = displayedText.split('\n\n').filter(p => p.trim());
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, idx) => {
          // paragraph가 undefined인 경우 처리
          if (!paragraph) return null;
          
          // 첫 단락은 특별 처리 (주요 메시지)
          if (idx === 0) {
            return (
              <div key={idx} className="text-lg font-medium text-indigo-900 border-b border-indigo-100 pb-3">
                {stage === 'opening' && <Clock className="inline-block w-5 h-5 mr-2 text-indigo-500" />}
                {stage !== 'opening' && <Sparkles className="inline-block w-5 h-5 mr-2 text-indigo-500" />}
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
        {isTyping && <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1"></span>}
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