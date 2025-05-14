'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, MessageCircle, FileText, AlertTriangle, 
  CheckCircle, HelpCircle, Scale, Lightbulb,
  ChevronDown, ChevronUp, Sparkles, Clock,
  Shield, Award, BookOpen, ScrollText
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
    return message.replace(/\*([^*]+)\*/g, '<strong class="text-amber-900 bg-amber-50 px-1.5 rounded-md font-medium">$1</strong>');
  };
  
  // 단계별 아이콘 및 제목 정의
  const getStageInfo = () => {
    switch(stage) {
      case 'intro':
        return { 
          icon: <BookOpen className="w-5 h-5 text-white" />, 
          title: '재판 소개',
          color: 'from-amber-500 to-amber-600'
        };
      case 'opening':
        return { 
          icon: <MessageCircle className="w-5 h-5 text-white" />, 
          title: '모두 진술',
          color: 'from-amber-500 to-amber-600'
        };
      case 'issues':
        return { 
          icon: <ScrollText className="w-5 h-5 text-white" />, 
          title: '쟁점 정리',
          color: 'from-amber-500 to-amber-600'
        };
      case 'discussion':
        return { 
          icon: <Scale className="w-5 h-5 text-white" />, 
          title: '토론 진행',
          color: 'from-amber-500 to-amber-600'
        };
      case 'questions':
        return { 
          icon: <HelpCircle className="w-5 h-5 text-white" />, 
          title: '판사 질문',
          color: 'from-amber-500 to-amber-600'
        };
      case 'closing':
        return { 
          icon: <CheckCircle className="w-5 h-5 text-white" />, 
          title: '최종 변론',
          color: 'from-amber-500 to-amber-600'
        };
      case 'verdict':
        return { 
          icon: <Gavel className="w-5 h-5 text-white" />, 
          title: '최종 판결',
          color: 'from-amber-500 to-amber-600'
        };
      default:
        return { 
          icon: <Shield className="w-5 h-5 text-white" />, 
          title: '판사 메시지',
          color: 'from-amber-500 to-amber-600'
        };
    }
  };
  
  // 판사 메시지 변환
  const transformJudgeMessage = (message: string) => {
    if (!message) return '';
    
    console.log('===== transformJudgeMessage 함수 입력 =====');
    console.log('입력 메시지 길이:', message.length);
    console.log(message);
    
    // 기본 문구 변환
    let transformed = message;
    
    // undefined 문자열 제거 전 상태 확인
    console.log('===== undefined 제거 전 =====');
    console.log(transformed);
    
    // 강화된 undefined 문자열 제거 로직
    // 1. 문장 끝에 나타나는 undefined
    transformed = transformed.replace(/\. undefined/g, '.');
    transformed = transformed.replace(/\.\s*undefined/g, '.');
    
    // 2. 공백과 함께 나타나는 undefined
    transformed = transformed.replace(/ undefined[.,]?/g, '');
    transformed = transformed.replace(/\s+undefined\s*/g, ' ');
    
    // 3. 텍스트 끝에 나타나는 undefined
    transformed = transformed.replace(/undefined$/g, '');
    transformed = transformed.replace(/undefined\s*$/g, '');
    
    // 4. 줄 시작 부분의 undefined
    transformed = transformed.replace(/^undefined\s*/gm, '');
    
    // 5. 문자 사이의 undefined
    transformed = transformed.replace(/([^\s])undefined([^\s])/g, '$1$2');
    
    // 6. 모든 남아있는 undefined 제거
    transformed = transformed.replace(/undefined/g, '');
    
    console.log('===== undefined 제거 후 =====');
    console.log(transformed);
    
    // 마크다운 처리 - 더 풍부한 처리로 강화
    transformed = transformed
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-amber-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-amber-800">$1</em>')
      .replace(/__(.*?)__/g, '<u class="text-amber-900">$1</u>')
      .replace(/~~(.*?)~~/g, '<del class="text-gray-500">$1</del>')
      .replace(/```(.*?)```/g, '<code class="bg-amber-50 px-1 rounded text-amber-900 font-mono text-sm">$1</code>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold text-amber-900 mb-2">$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-semibold text-amber-800 mb-1.5">$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3 class="text-base font-medium text-amber-800 mb-1">$1</h3>');
    
    // 비어있는 경우 기본 텍스트 반환
    if (!transformed || transformed.trim().length === 0) {
      return '판사 메시지를 불러오는 중 오류가 발생했습니다.';
    }
    
    console.log('===== 최종 변환 결과 =====');
    console.log(transformed);
    
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
          const nextChar = fullTextRef.current.charAt(charIndexRef.current);
          setDisplayedText(prevText => prevText + nextChar);
          charIndexRef.current++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 5); // 타이핑 속도 조절
      
      return () => clearInterval(typingInterval);
    } else {
      // 일반 메시지는 기존 방식으로 표시
      charIndexRef.current = 0;
      setDisplayedText('');
      setIsTyping(true);
      
      // 타이핑 효과 시작
      const typingInterval = setInterval(() => {
        if (charIndexRef.current < fullTextRef.current.length) {
          const nextChar = fullTextRef.current.charAt(charIndexRef.current);
          setDisplayedText(prevText => prevText + nextChar);
          charIndexRef.current++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 5); // 타이핑 속도 조절
      
      return () => clearInterval(typingInterval);
    }
  }, [text, stage]);
  
  // 판사 메시지 템플릿 선택
  const renderMessageContent = () => {
    // 비어있는 경우 처리
    if (!displayedText) {
      return (
        <div className="flex items-center justify-center h-24">
          <div className="flex space-x-2 items-center">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-3 h-3 rounded-full bg-amber-600 animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      );
    }
    
    // JSON 형식 메시지 체크
    if (text.startsWith("{") || text.includes("responses") || text.includes("issues")) {
      // JSON 형식도 'undefined' 문자열 제거 로직을 적용
      const cleanedJsonText = transformJudgeMessage(text);
      return <p className="text-gray-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(cleanedJsonText) }} />;
    }
    
    // 쟁점 정리 단계의 메시지를 특별히 처리
    if (stage === 'issues') {
      // 쟁점을 찾기 위한 패턴
      // 1. 숫자로 시작하는 패턴 (1. 쟁점내용, 2. 쟁점내용)
      // 2. 불릿으로 시작하는 패턴 (• 쟁점내용, * 쟁점내용, - 쟁점내용)
      // 3. '쟁점 #번호:' 패턴 (쟁점 1:, 쟁점 #1:)
      
      // 쟁점 구분을 위한 정규식 패턴들
      const patterns = [
        /(\d+\.\s+[\s\S]*?)(?=\d+\.|$)/g,            // 1. 쟁점내용
        /(?:•|\*|-)\s+([\s\S]*?)(?=(?:•|\*|-)|$)/g,   // • 쟁점내용
        /쟁점\s+#?(\d+):\s+([\s\S]*?)(?=쟁점|$)/g,    // 쟁점 1: 내용
      ];
      
      let issues: string[] = [];
      let issuesFound = false;
      
      // 각 패턴으로 쟁점 찾기 시도
      for (const pattern of patterns) {
        const matches = [...displayedText.matchAll(pattern)];
        if (matches.length > 0) {
          issuesFound = true;
          if (pattern.toString().includes('쟁점')) {
            // '쟁점 #번호:' 패턴인 경우
            issues = matches.map(match => match[2] ? match[2].trim() : '');
          } else if (pattern.toString().includes('\\d+\\.')) {
            // '숫자.' 패턴인 경우
            issues = matches.map(match => match[0].trim());
          } else {
            // 불릿 패턴인 경우
            issues = matches.map(match => match[1] ? match[1].trim() : '');
          }
          break;
        }
      }
      
      // 쟁점을 찾지 못한 경우, 텍스트에서 쟁점으로 보이는 문장을 찾음
      if (!issuesFound) {
        // 단락을 나누고 쟁점을 문맥상 찾기
        const paragraphs = displayedText.split('\n\n').filter(p => p.trim());
        
        // "쟁점", "논의사항", "해결할 점" 등의 키워드를 포함하는 단락을 찾아서 쟁점으로 처리
        for (const paragraph of paragraphs) {
          if (paragraph.includes('쟁점') || paragraph.includes('논의') || paragraph.includes('해결') || 
              paragraph.includes('다음') || paragraph.includes('문제') || paragraph.includes('사안')) {
            const sentences = paragraph.split(/[.!?]\s+/);
            issues = sentences.filter(s => s.trim().length > 10);  // 짧은 문장 제외
            issuesFound = issues.length > 0;
            break;
          }
        }
      }
      
      // 구조화된 쟁점 정리 UI 반환
      if (issuesFound && issues.length > 0) {
        const paragraphs = displayedText.split('\n\n').filter(p => p.trim());
        const introText = paragraphs[0] || '다음 쟁점들에 대해 논의하겠습니다:';
        
        return (
          <div className="space-y-5">
            {/* 쟁점 정리 소개 */}
            <div className="text-lg font-medium text-amber-900 border-b border-amber-200 pb-3">
              <ScrollText className="inline-block w-5 h-5 mr-2 text-amber-600" />
              <span dangerouslySetInnerHTML={{ __html: formatMessage(introText) }} />
            </div>
            
            {/* 쟁점 목록 (카드 형태) */}
            <div className="space-y-4 mt-3">
              {issues.map((issue, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    boxShadow: '0 4px 6px rgba(251, 191, 36, 0.04), 0 1px 3px rgba(251, 191, 36, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <div className="flex items-start">
                    <div className="bg-amber-100 text-amber-700 rounded-full h-7 w-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-sm font-semibold">{idx + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 text-base">쟁점 {idx + 1}</h3>
                      <p className="text-amber-800 mt-1.5" dangerouslySetInnerHTML={{ __html: issue }}></p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* 토론 안내 */}
            <div className="bg-amber-50 p-4 rounded-md border-l-4 border-amber-400">
              <Lightbulb className="inline-block w-4 h-4 mr-2 text-amber-600" />
              <span className="text-amber-900">각 쟁점에 대한 토론은 차례로 진행됩니다. 토론 중에는 증거를 제시하거나 반론을 제기할 수 있습니다.</span>
            </div>
          </div>
        );
      }
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
              <motion.div 
                key={idx} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-medium text-amber-900 border-b border-amber-200 pb-3"
              >
                {stage === 'opening' && <Clock className="inline-block w-5 h-5 mr-2 text-amber-600" />}
                {stage !== 'opening' && <Award className="inline-block w-5 h-5 mr-2 text-amber-600" />}
                <span dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} />
              </motion.div>
            );
          }
          
          // 지시사항이나 안내 (예: "예시:" 로 시작하는 부분)
          if (paragraph.includes("예시:") || paragraph.includes("참고:") || paragraph.includes("주의:")) {
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
                className="bg-amber-50 p-4 rounded-md border-l-4 border-amber-400"
              >
                <Lightbulb className="inline-block w-4 h-4 mr-2 text-amber-600" />
                <span className="text-amber-900" dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} />
              </motion.div>
            );
          }
          
          // 불릿 포인트로 시작하는 항목들
          if (paragraph.includes('- ')) {
            const items = paragraph.split('- ').filter(item => item.trim());
            return (
              <motion.ul 
                key={idx} 
                className="space-y-2.5 pl-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 * idx }}
              >
                {items.map((item, itemIdx) => (
                  <motion.li 
                    key={itemIdx} 
                    className="flex items-start"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 * (idx + itemIdx) }}
                  >
                    <div className="bg-amber-100 text-amber-700 rounded-full p-1 mr-2 mt-0.5">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <span className="text-amber-900" dangerouslySetInnerHTML={{ __html: formatMessage(item.trim()) }} />
                  </motion.li>
                ))}
              </motion.ul>
            );
          }
          
          // 일반 단락
          return (
            <motion.p 
              key={idx} 
              className="text-amber-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * idx }}
              dangerouslySetInnerHTML={{ __html: formatMessage(paragraph) }} 
            />
          );
        })}
        {isTyping && (
          <motion.span 
            className="inline-block w-2 h-4 bg-amber-500 ml-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          ></motion.span>
        )}
      </div>
    );
  };
  
  const { icon, title, color } = getStageInfo();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden"
      style={{
        boxShadow: '0 4px 6px rgba(251, 191, 36, 0.05), 0 1px 3px rgba(251, 191, 36, 0.1), 0 10px 15px -5px rgba(251, 191, 36, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
      }}
    >
      {/* 헤더 */}
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${color} text-white`}>
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            {icon}
          </div>
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </button>
      </div>
      
      {/* 내용 */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5"
          >
            {renderMessageContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 