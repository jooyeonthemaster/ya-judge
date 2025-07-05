import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RoomlessFormData {
  title: string;
  description: string;
  plaintiff: string;
  defendant: string;
  relationship: string;
  duration: string;
  category: string;
  tags: string[];
  intensity: string;
  character: string;
}

export async function POST(request: Request) {
  try {
    const formData: RoomlessFormData = await request.json();
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Analyze conflict complexity and emotional intensity
    const conflictAnalysis = analyzeConflict(formData);
    const judgePersona = getJudgePersona(formData.character, formData.intensity);
    
    const prompt = `
    역할: ${judgePersona.title}
    성격: ${judgePersona.personality}
    판결 강도: ${formData.intensity}
    
    사건 정보:
    - 제목: ${formData.title}
    - 관계: ${formData.relationship} (기간: ${formData.duration})
    - 카테고리: ${formData.category}
    - 태그: ${formData.tags.join(', ')}
    - 갈등 복잡도: ${conflictAnalysis.complexity}
    - 감정 지수: ${conflictAnalysis.emotionalIndex}
    
    당사자:
    - 원고(고소인): ${formData.plaintiff}
    - 피고(피고소인): ${formData.defendant}
    
    갈등 상황:
    ${formData.description}
    
    중요: 반드시 올바른 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 절대 포함하지 마세요.
    
    JSON 응답 규칙:
    1. 모든 문자열은 큰따옴표로 감싸기
    2. 줄바꿈 없이 한 줄로 작성
    3. 특수문자 이스케이프 처리
    4. 쉼표와 중괄호 정확히 사용
    
    응답 형식:
    {"caseSummary":"사건을 한 문장으로 요약","analysis":{"complexity":"${conflictAnalysis.complexity}","emotionalIndex":${conflictAnalysis.emotionalIndex},"solvability":${conflictAnalysis.solvability},"rootCause":"주요 원인"},"verdict":"${judgePersona.judgmentStyle} 스타일로 판결 내용을 3-4문장으로","reasoning":"판결 근거를 2-3문장으로","solutions":{"immediate":"즉시 해야 할 행동","shortTerm":"단기 개선방법","longTerm":"장기 발전방향"},"coreAdvice":"핵심 조언","finalMessage":"${judgePersona.tone} 톤으로 마무리"}
    
    위 형식 그대로 JSON만 응답하세요.
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      // Clean and validate the JSON response from AI
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      // Parse the JSON response from AI
      const judgmentData = JSON.parse(cleanedResponse);
      
      // Validate required fields
      if (!judgmentData.caseSummary || !judgmentData.verdict || !judgmentData.analysis) {
        throw new Error('Missing required fields in AI response');
      }
      
      return NextResponse.json({ 
        success: true,
        judgment: judgmentData,
        metadata: {
          complexity: conflictAnalysis.complexity,
          emotionalIndex: conflictAnalysis.emotionalIndex,
          category: formData.category,
          judgeType: judgePersona.title
        }
      });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse AI response as JSON:', parseError);
      return NextResponse.json({ 
        success: true,
        judgment: {
          caseSummary: `${formData.title}에 대한 갈등 상황`,
          analysis: {
            complexity: conflictAnalysis.complexity,
            emotionalIndex: conflictAnalysis.emotionalIndex,
            solvability: conflictAnalysis.solvability,
            rootCause: conflictAnalysis.rootCause
          },
          verdict: responseText.substring(0, 200) + "...",
          reasoning: "AI 응답 파싱 중 오류가 발생했습니다.",
          solutions: {
            immediate: "상황을 다시 정리해보세요.",
            shortTerm: "서로의 입장을 이해해보세요.",
            longTerm: "꾸준한 소통을 통해 관계를 개선해보세요."
          },
          coreAdvice: "갈등 해결에는 시간과 노력이 필요합니다.",
          finalMessage: "차근차근 해결해 나가시길 바랍니다."
        },
        metadata: {
          complexity: conflictAnalysis.complexity,
          emotionalIndex: conflictAnalysis.emotionalIndex,
          category: formData.category,
          judgeType: judgePersona.title
        }
      });
    }
    
  } catch (error) {
    console.error('Error in roomless judge API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate judgment' },
      { status: 500 }
    );
  }
}

function analyzeConflict(formData: RoomlessFormData) {
  const description = formData.description.toLowerCase();
  let complexity = '단순';
  let emotionalIndex = 1;
  let rootCause = '소통 부족';
  let solvability = 85;
  
  // 복잡도 분석
  if (description.length > 200) complexity = '복잡';
  else if (description.length > 100) complexity = '중간';
  
  // 감정 지수 계산
  const emotionalWords = ['화나', '짜증', '속상', '분노', '억울', '실망', '좌절'];
  const strongWords = ['진짜', '완전', '너무', '엄청', '정말'];
  
  emotionalWords.forEach(word => {
    if (description.includes(word)) emotionalIndex += 1;
  });
  
  strongWords.forEach(word => {
    if (description.includes(word)) emotionalIndex += 0.5;
  });
  
  // 근본 원인 파악
  if (description.includes('돈') || description.includes('비용')) {
    rootCause = '금전 문제';
    solvability = 70;
  } else if (description.includes('시간') || description.includes('약속')) {
    rootCause = '시간 관리';
    solvability = 80;
  } else if (description.includes('가족') || description.includes('친구')) {
    rootCause = '인간관계';
    solvability = 60;
  } else if (description.includes('성격') || description.includes('습관')) {
    rootCause = '성격 차이';
    solvability = 50;
  }
  
  // 카테고리별 조정
  switch (formData.category) {
    case '금전':
      solvability -= 10;
      break;
    case '의사소통':
      solvability += 15;
      break;
    case '선물':
      solvability += 10;
      break;
  }
  
  return {
    complexity,
    emotionalIndex: Math.min(Math.round(emotionalIndex), 10),
    rootCause,
    solvability: Math.max(Math.min(solvability, 95), 30)
  };
}

function getJudgePersona(character: string, intensity: string) {
  const personas: Record<string, Record<string, any>> = {
    판사: {
      순한맛: {
        title: '친근한 동네 판사',
        personality: '따뜻하고 이해심 많은',
        style: '부드럽고 공감적인',
        judgmentStyle: '상호 이해를 중시하며 온화한 톤',
        tone: '격려와 희망적인'
      },
      중간맛: {
        title: '공정한 법원 판사',
        personality: '객관적이고 균형잡힌',
        style: '논리적이면서 인간적인',
        judgmentStyle: '사실에 기반하여 공정하게',
        tone: '현실적이면서 건설적인'
      },
      매운맛: {
        title: '직설적인 베테랑 판사',
        personality: '솔직하고 단호한',
        style: '직설적이고 확신에 찬',
        judgmentStyle: '뼈아프지만 정확한 지적으로',
        tone: '강력하고 각성을 촉구하는'
      }
    },
    상담사: {
      순한맛: {
        title: '마음 따뜻한 상담사',
        personality: '공감능력이 뛰어난',
        style: '치유적이고 지지적인',
        judgmentStyle: '감정을 인정하며 부드럽게',
        tone: '위로와 격려를 담은'
      },
      중간맛: {
        title: '전문 관계 상담사',
        personality: '전문적이고 통찰력 있는',
        style: '심리학적 접근을 통한',
        judgmentStyle: '행동 패턴을 분석하여',
        tone: '전문적이면서 희망적인'
      },
      매운맛: {
        title: '현실직시 상담사',
        personality: '직접적이고 변화 지향적인',
        style: '도전적이고 성장 촉진적인',
        judgmentStyle: '변화의 필요성을 강조하며',
        tone: '도전적이면서 동기부여하는'
      }
    },
    친구: {
      순한맛: {
        title: '다정한 절친 친구',
        personality: '편안하고 재미있는',
        style: '친근하고 유머러스한',
        judgmentStyle: '친구 같은 조언으로',
        tone: '가볍고 유쾌한'
      },
      중간맛: {
        title: '진실한 조언자 친구',
        personality: '솔직하고 신뢰할 수 있는',
        style: '진심 어린 조언을 하는',
        judgmentStyle: '친구의 입장에서 솔직하게',
        tone: '진실되고 믿음직한'
      },
      매운맛: {
        title: '팩트폭격 독설친구',
        personality: '거침없고 솔직한',
        style: '디시인사이드 말투의',
        judgmentStyle: '친구답게 쓴소리로',
        tone: '독설이지만 애정 어린'
      }
    }
  };
  
  return personas[character]?.[intensity] || personas.판사.중간맛;
} 