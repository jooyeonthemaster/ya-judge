import { useEffect, useRef, useState } from 'react';
import { analyzeConversation, type InterventionData, type Message } from '@/lib/gemini';
import { useChatStore } from '@/store/chatStore';
import { ref, set, get, runTransaction } from 'firebase/database';
import { database } from '@/lib/firebase';

interface UseRealTimeAnalysisProps {
  messages: Message[];
  roomId: string;
  isEnabled: boolean;
}

export const useRealTimeAnalysis = ({ 
  messages, 
  roomId, 
  isEnabled 
}: UseRealTimeAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedCount, setLastAnalyzedCount] = useState(0);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessages = useRef<Set<string>>(new Set());
  
  const { 
    judgeInterventions, 
    addJudgeIntervention, 
    detectedIssues,
    updateDetectedIssues,
    addMessage
  } = useChatStore();

  // 욕설 패턴 즉시 감지 (gemini.ts와 동일한 패턴)
  const detectProfanityInMessage = (text: string): boolean => {
    const severeProfanityPatterns = [
      '씨발', '시발', 'ㅅㅂ', 'ㅆㅂ', '개새끼', '개색끼', '개색기', 'ㄱㅅㄲ',
      '병신', '븅신', 'ㅂㅅ', '자지', 'ㅈㅈ', '좆', 'ㅈ같', '좆같', 
      '니미', '니엄마', '엄마', '느금마', '개좆', '개지랄', '지랄', 'ㅈㄹ',
      '꺼져', '닥쳐', '죽어', '뒤져', '개죽음', '뒈져', '죽을래', '뒤져라',
      '미친놈', '미친년', '정신병', '장애인', '병신새끼', '또라이새끼',
      '변태', '새끼', '새기', 'ㅅㄲ'
    ];
    
    const cleanText = text.toLowerCase().replace(/[\s.,!?]/g, '');
    return severeProfanityPatterns.some(pattern => 
      cleanText.includes(pattern.toLowerCase())
    );
  };

  // 메시지 고유 키 생성
  const getMessageKey = (message: Message): string => {
    return `${message.name}_${message.text}_${message.timestamp || Date.now()}`;
  };

  // 즉시 욕설 경고 처리
  const handleImmediateProfanityWarning = async (message: Message) => {
    if (!database || !message.name) return;

    const lockRef = ref(database, `rooms/${roomId}/profanityLock`);
    
    try {
      // 트랜잭션으로 중복 방지
      const result = await runTransaction(lockRef, (currentData) => {
        const now = Date.now();
        
        // 3초 내에 이미 경고했으면 중복 방지
        if (currentData && currentData.timestamp && (now - currentData.timestamp < 3000)) {
          return; // 트랜잭션 취소
        }
        
        return {
          timestamp: now,
          messageKey: getMessageKey(message),
          user: message.name
        };
      });

      if (!result.committed) {
        console.log('🚫 최근에 이미 욕설 경고했음. 중복 방지.');
        return;
      }

      console.log('🚨 욕설 감지! 즉시 경고 실행');

      // 판사 개입 기록
      addJudgeIntervention(
        'warning',
        `⚠️ ${message.name}님! 욕설 그만! 진정하세요! 🛑`,
        message.name
      );

      // 고유 식별자로 중복 방지
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const warningMessage = `⚠️ ${message.name}님! 욕설 그만! 진정하세요! 🛑 [#${uniqueId}]`;

      await addMessage({
        user: 'judge',
        name: '판사',
        text: warningMessage,
        roomId
      });

      // 3초 후 락 해제
      setTimeout(async () => {
        try {
          await set(lockRef, null);
        } catch (error) {
          console.error('락 해제 실패:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ 욕설 경고 오류:', error);
    }
  };

  // 메시지 변경 감지 및 즉시 욕설 체크
  useEffect(() => {
    if (!isEnabled) return;

    const userMessages = messages.filter(msg => msg.user === 'user-general');
    
    // 새로운 메시지만 체크
    const newMessages = userMessages.slice(lastAnalyzedCount);
    
    newMessages.forEach(message => {
      const messageKey = getMessageKey(message);
      
      // 이미 처리된 메시지는 건너뛰기
      if (processedMessages.current.has(messageKey)) {
        return;
      }
      
      // 메시지 키 기록
      processedMessages.current.add(messageKey);
      
      // 욕설 즉시 감지 및 처리
      if (detectProfanityInMessage(message.text)) {
        console.log(`🔥 욕설 감지됨: ${message.name} - ${message.text}`);
        handleImmediateProfanityWarning(message);
      }
    });

    setLastAnalyzedCount(userMessages.length);

    // 메모리 관리 - 처리된 메시지 키 정리 (최근 50개만 유지)
    if (processedMessages.current.size > 50) {
      const keysArray = Array.from(processedMessages.current);
      processedMessages.current = new Set(keysArray.slice(-30));
    }

  }, [messages.length, isEnabled]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      processedMessages.current.clear();
    };
  }, []);

  return {
    isAnalyzing,
    lastAnalyzedCount
  };
};