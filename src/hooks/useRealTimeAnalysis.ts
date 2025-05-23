import { useEffect, useRef, useState } from 'react';
import { analyzeConversation, type InterventionData, type Message } from '@/lib/gemini';
import { useChatStore } from '@/store/chatStore';

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
  const { 
    judgeInterventions, 
    addJudgeIntervention, 
    detectedIssues,
    updateDetectedIssues,
    addMessage
  } = useChatStore();

  // 실시간 분석 함수
  const performAnalysis = async () => {
    if (!isEnabled || isAnalyzing || messages.length === 0) {
      console.log(`분석 건너뜀: isEnabled=${isEnabled}, isAnalyzing=${isAnalyzing}, messages=${messages.length}`);
      return;
    }

    // 사용자 메시지만 필터링
    const userMessages = messages.filter(msg => msg.user === 'user-general');
    
    // 새로운 메시지가 있는지 확인
    if (userMessages.length <= lastAnalyzedCount) {
      console.log(`새 메시지 없음: current=${userMessages.length}, last=${lastAnalyzedCount}`);
      return;
    }

    console.log(`🔍 실시간 분석 시작: ${userMessages.length}개 메시지 (이전: ${lastAnalyzedCount}개)`);
    setIsAnalyzing(true);

    try {
      const interventionData: InterventionData = await analyzeConversation(
        messages,
        judgeInterventions.map(i => ({
          id: i.id,
          type: i.type,
          timestamp: i.timestamp,
          text: i.text,
          targetUser: i.targetUser
        })),
        detectedIssues
      );

      console.log('📊 분석 결과:', interventionData);

      if (interventionData.shouldIntervene && interventionData.message) {
        console.log('⚖️ 판사 개입 필요!', interventionData);

        // 새로운 개입 추가
        addJudgeIntervention(
          interventionData.type || 'issue',
          interventionData.message,
          interventionData.targetUser
        );

        // 판사 메시지 직접 추가
        await addMessage({
          user: 'judge',
          name: '판사',
          text: interventionData.message,
          roomId
        });

        // 새로운 쟁점 추가
        if (interventionData.detectedIssues && interventionData.detectedIssues.length > 0) {
          const newIssues = [...detectedIssues];
          interventionData.detectedIssues.forEach(issue => {
            if (!newIssues.includes(issue)) {
              newIssues.push(issue);
            }
          });
          updateDetectedIssues(newIssues);
        }

        console.log('✅ 판사 개입 완료');
      } else {
        console.log('📝 개입 불필요 - 정상적인 대화 진행 중');
      }

      setLastAnalyzedCount(userMessages.length);
    } catch (error) {
      console.error('❌ 실시간 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 메시지 변경 감지 및 즉시 분석 (지연 시간 단축)
  useEffect(() => {
    if (!isEnabled) {
      console.log('⏸️ 실시간 분석 비활성화됨');
      return;
    }

    const userMessages = messages.filter(msg => msg.user === 'user-general');
    const newUserMessageCount = userMessages.length;

    // 새로운 사용자 메시지가 있을 때만 분석
    if (newUserMessageCount > lastAnalyzedCount) {
      console.log(`📢 새로운 사용자 메시지 감지: ${newUserMessageCount} (이전: ${lastAnalyzedCount})`);
      
      // 기존 타이머 취소
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // 즉시 분석 실행 (지연 시간 최소화)
      analysisTimeoutRef.current = setTimeout(() => {
        performAnalysis();
      }, 500); // 0.5초로 단축
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [messages.length, isEnabled]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAnalyzing,
    lastAnalyzedCount
  };
};