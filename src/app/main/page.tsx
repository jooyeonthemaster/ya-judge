'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Scale, 
  Brain, 
  Gavel, 
  Heart, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ChevronRight,
  HeartHandshake,
  SmilePlus,
  Sparkles,
  CheckCircle2,
  Share2,
  Lightbulb,
  Medal,
  UserCheck,
  Laugh,
  ArrowRight,
  Flame
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [activeCase, setActiveCase] = useState(0);

  // Clear local storage when navigating to main page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }, []);

  const createRoom = () => {
    setIsCreating(true);
    try {
      const roomId = Math.random().toString(36).substr(2, 9);
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Room creation error:', error);
      setIsCreating(false);
      alert('방 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const goToRoomless = () => {
    router.push('/roomless');
  };

  // 실제 커플 갈등 사례
  const coupleConflicts = [
    {
      id: 1,
      title: "600만원 명품백 배신극",
      scenario: "결혼기념일에 약속한 명품백 대신 여행을 선택한 남편의 끔찍한 배신",
      personA: "1년 동안 기다려온 기념일 선물이 이건가요? 허니문 때부터 약속했던 명품백은요? 당신 말 믿고 친구들한테 자랑까지 했는데 이제 제 체면은 어쩌라고요?",
      personB: "그 가방보다 추억이 더 중요하다고 생각했어. 그리고 지금 우리 형편에 600만원짜리 가방은 너무 사치잖아. 여행이 훨씬 가치있는 선물이라고 생각했는데...",
      verdict: "A에게 85%의 책임이 있습니다. 물질적 가치와 타인의 시선에 지나치게 집착하며, 배우자의 경제적 상황을 고려하지 않는 이기적 태도가 확인됩니다. 진정한 사랑은 명품이 아닌 함께하는 시간에서 비롯됩니다."
    },
    {
      id: 2,
      title: "7년 연인 SNS 불륜 의혹",
      scenario: "일주일간 잠수 후 발견된 남자친구의 충격적인 인스타그램 DM 내역",
      personA: "전화도 안 받고 카톡도 씹더니 전 여친과 호캉스 계획까지 세웠네? DM 내용이 이거밖에 없을까? 7년 연애가 이렇게 끝나는 거야?",
      personB: "그건 단순한 친구 만남이었어! 너무 오해하지 마. 그리고 내 폰을 왜 몰래 봤어? 이건 명백한 사생활 침해라고! 내가 지금 피해자야.",
      verdict: "B에게 91%의 압도적 책임이 있습니다. 장기간의 잠수와 은밀한 메시지는 명백한 신뢰 위반이며, 오히려 피해자인 척 상대방을 비난하는 전형적인 가스라이팅이 확인됩니다. 즉각적인 관계 재고가 필요합니다."
    },
    {
      id: 3,
      title: "결혼식 비용 파탄 위기",
      scenario: "예비신부 부모의 과도한 결혼식 요구로 파혼 직전까지 간 커플",
      personA: "400명 하객에 5성급 호텔, 그리고 신혼여행은 몰디브? 당신 부모님이 비용의 절반만 내겠다는데 나머지는 어떻게 감당해? 이러다 결혼 시작부터 빚더미인데!",
      personB: "우리 인생에 한 번뿐인 결혼식인데 왜 이렇게 인색해? 내 부모님 체면도 있고, 친척들 모두 호화롭게 결혼했는데 우리만 초라하게 하면 평생 흠이 될 거야.",
      verdict: "양측 모두에게 문제가 있으나, B에게 73%의 책임이 있습니다. 재정적 현실을 무시한 과시적 행사 강요는 미래 가정의 안정성을 심각하게 위협합니다. 결혼은 하루의 행사가 아닌 평생의 여정임을 명심하세요."
    }
  ];

  // 앱 기능 소개
  const features = [
    {
      icon: Gavel,
      title: '냉철한 판결',
      description: '감정은 배제하고 오직 논리와 증거만으로 정확한 잘못의 비율까지 판단',
      color: 'bg-gradient-to-br from-pink-400 to-pink-600'
    },
    {
      icon: Brain,
      title: '심리 분석',
      description: '말 속에 숨겨진 진짜 감정과 상대방을 조종하려는 심리적 술수까지 간파',
      color: 'bg-gradient-to-br from-pink-400 to-pink-600'
    },
    {
      icon: HeartHandshake,
      title: '해결책 제시',
      description: '단순 판결을 넘어 갈등의 근본 원인과 구체적인 화해 전략까지 제공',
      color: 'bg-gradient-to-br from-pink-400 to-pink-600'
    },
    {
      icon: Flame,
      title: '가차없는 진실',
      description: '듣기 싫지만 관계 개선을 위해 반드시 알아야 할 뼈아픈 진실 직면',
      color: 'bg-gradient-to-br from-pink-400 to-pink-600'
    }
  ];

  // 사용 사례
  const useCases = [
    {
      title: '데이트 비용 전쟁',
      description: '더치페이 vs 남자가 다? 수입 차이는? 합리적인 분담 비율을 결정해 드립니다',
      icon: Heart,
      color: 'bg-pink-100 text-pink-500'
    },
    {
      title: '집착 VS 무관심',
      description: '답장 시간, 만남 빈도... 정상적인 관심과 위험한 집착의 경계는 어디인가요?',
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-500'
    },
    {
      title: '과거 연애사 논쟁',
      description: '전 애인과의 관계, SNS 활동, 숨겨야 할까요? 솔직해야 할까요?',
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-500'
    },
    {
      title: '결혼 압박과 회피',
      description: '연애 기간, 나이... 결혼 논의의 적기와 올바른 접근법을 알려드립니다',
      icon: Users,
      color: 'bg-pink-100 text-pink-500'
    }
  ];

  // 이용 방법
  const steps = [
    {
      number: '1',
      title: '익명 재판 개정',
      description: '버튼 한 번으로 완전 익명 채팅방 생성, 링크만 공유하면 상대방도 익명으로 참여',
      icon: MessageSquare
    },
    {
      number: '2', 
      title: '철저한 진술',
      description: '감정을 숨기지 말고 모든 사실과 감정을 있는 그대로 진술하세요',
      icon: Users
    },
    {
      number: '3',
      title: '최종 판결',
      description: '인공지능 판사가 증거를 분석하고 누가 얼마나 잘못했는지 명확히 판결',
      icon: Gavel
    }
  ];

  // 자동으로 사례 변경하는 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCase((prev) => (prev + 1) % coupleConflicts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-y-auto" style={{ maxWidth: '380px', margin: '0 auto' }}>
      {/* 헤더 */}
      <header className="bg-white py-3 sticky top-0 z-50 border-b border-pink-300 shadow-lg backdrop-blur-sm bg-white/90">
        <div className="px-4 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl bg-gradient-to-r from-pink-600 to-purple-600 text-transparent bg-clip-text tracking-tighter">야 판사야!</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={createRoom}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-700 text-white font-bold hover:from-pink-700 hover:to-purple-800 transition-all shadow-md text-sm"
          >
            지금 바로 판결받기
          </motion.button>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="pt-8 pb-10 bg-gradient-to-b from-pink-50 via-pink-50 to-white relative overflow-hidden">
        <div className="px-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-black mb-4 tracking-tight leading-none">
              <span className="block text-pink-600 mb-1">더 이상</span>
              <span className="block text-5xl relative">
                <span className="relative inline-block">
                  참을 수 없는
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5C68 2 207 2 299 9" stroke="#FFC0CB" strokeWidth="8" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </span>
              <span className="block text-pink-800 mt-1">커플 분쟁</span>
            </h1>
            <div className="flex justify-center items-center">
              <div className="relative w-64 h-64 mx-auto my-3 drop-shadow-2xl">
              <Image 
                src="/images/judge.png" 
                alt="판사 캐릭터" 
                width={220} 
                height={220}
                className="object-contain relative z-10 transform hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -right-2 -top-4 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg transform rotate-12 z-20">
                83% 승률!
              </div>
            </div>
            </div>
            
            
            <p className="text-lg text-gray-800 mb-6 font-bold px-2 leading-snug">
              <span className="text-pink-600 block">관계 파탄 직전에서 단 한 번의 판결로</span>
              <span className="block mt-1 bg-gradient-to-r from-pink-700 to-purple-700 text-transparent bg-clip-text text-xl">모든 불화가 해결됩니다</span>
            </p>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createRoom}
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              {isCreating ? '판결방 생성 중...' : '지금 즉시 판결받기 →'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={goToRoomless}
              className="w-full py-4 mt-3 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              혼자서 판결받기 →
            </motion.button>
            
            <div className="mt-4 px-3 py-2.5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 flex items-center gap-2 shadow-sm">
              <Sparkles className="w-5 h-5 text-pink-600 flex-shrink-0" />
              <p className="text-sm text-pink-800 font-semibold">
                <span className="font-black">4,200쌍</span> 이상의 커플이 <span className="underline decoration-wavy decoration-pink-400 underline-offset-2">관계 회복</span> 성공!
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 실제 커플 갈등 사례 */}
      <section className="py-12 bg-white relative">
        <div className="px-5 relative z-10">
          <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700 text-center leading-tight">
            극한의 갈등,<br/>냉철한 판결
          </h2>
          <p className="text-sm text-gray-700 mb-8 text-center font-semibold leading-snug px-5">
            <span className="text-pink-600">감정은 배제하고</span> 순수 논리로<br/>
            <span className="underline decoration-wavy decoration-pink-300 underline-offset-2">
              누가 얼마나 잘못했는지
            </span> 정확히 알려드립니다
          </p>
          
          <div className="bg-white rounded-xl shadow-xl p-5 border border-pink-100 relative z-10 transform transition-all hover:shadow-2xl">
            <div className="absolute -top-4 -right-3 z-20">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg transform rotate-3">
                오늘의 핫이슈
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-pink-600 to-purple-700 p-3 rounded-lg shadow-md">
              <Flame className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-lg text-white">
                {coupleConflicts[activeCase].title}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 italic border-l-3 border-pink-400 pl-3 py-1 bg-pink-50 rounded-r-md">
              {coupleConflicts[activeCase].scenario}
            </p>
            
            <div className="flex items-start mb-4 gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-md">A</div>
              <div className="flex-1 bg-pink-50 p-3.5 rounded-lg text-sm shadow-md border border-pink-200 rounded-tl-none transform -rotate-1">
                <p className="font-semibold text-gray-800 leading-snug">{coupleConflicts[activeCase].personA}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-6 gap-3 justify-end">
              <div className="flex-1 bg-blue-50 p-3.5 rounded-lg text-sm shadow-md border border-blue-200 rounded-tr-none transform rotate-1">
                <p className="font-semibold text-gray-800 leading-snug">{coupleConflicts[activeCase].personB}</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-md">B</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-pink-300 p-4 rounded-lg shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Gavel className="w-5 h-5 text-pink-700" />
                <p className="font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700">판사의 최종 판결</p>
              </div>
              <p className="text-sm text-gray-800 font-bold leading-snug">{coupleConflicts[activeCase].verdict}</p>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              {coupleConflicts.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveCase(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeCase === index 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 scale-125 shadow-md' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 기능 하이라이트 - 4단계 심판 프로세스 */}
      <section className="py-14 bg-gradient-to-b from-white to-pink-50 relative">
        <div className="px-5 relative z-10">
          <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700 text-center leading-tight">
            AI 판사의<br/>4단계 해부 과정
          </h2>
          <p className="text-sm text-gray-700 mb-10 text-center font-semibold leading-snug">
            <span className="text-pink-600">세계 최초</span>의 커플 갈등 맞춤형<br/>
            <span className="underline decoration-wavy decoration-pink-300 underline-offset-2">
              정밀 심리 분석 알고리즘
            </span>이 적용되었습니다
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center border border-pink-100 transform hover:-translate-y-1 hover:border-pink-300"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-full flex items-center justify-center mb-3 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-extrabold mb-2 text-gray-800 text-center">{feature.title}</h3>
                <p className="text-xs text-gray-600 text-center leading-snug">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 사용 사례 */}
      <section className="py-12 bg-white relative">
        <div className="px-5 relative z-10">
          <h2 className="text-2xl font-extrabold mb-2 text-pink-600 text-center">끝나지 않는 논쟁들</h2>
          <p className="text-sm text-gray-600 mb-8 text-center font-medium leading-snug">
            어떤 갈등도 AI 판사 앞에서는<br/>명쾌한 결론을 얻게 됩니다
          </p>
          
          <div className="space-y-4">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all border border-pink-100 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full ${useCase.color} flex items-center justify-center shadow-md`}>
                  <useCase.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-1 text-gray-800">{useCase.title}</h3>
                  <p className="text-xs text-gray-600 leading-snug">{useCase.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-400 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 mx-auto max-w-xs">
            <div className="px-4 py-3 bg-pink-50 rounded-lg border border-pink-100 text-center">
              <p className="text-xs text-gray-700 font-medium">
                <span className="text-pink-600 font-bold">87%</span>의 커플이 판결 후 관계가 개선되었습니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section id="how-it-works" className="py-12 bg-gradient-to-b from-pink-50 to-white relative">
        <div className="px-5 relative z-10">
          <h2 className="text-2xl font-extrabold mb-2 text-pink-600 text-center">3분만에 판결받기</h2>
          <p className="text-sm text-gray-600 mb-8 text-center font-medium">
            복잡한 과정 없이<br/>즉각적인 해결책을 얻으세요
          </p>
          
          <div className="space-y-6 relative">
            <div className="absolute left-7 top-7 w-0.5 h-[calc(100%-60px)] bg-gradient-to-b from-pink-400 to-pink-300 z-0"></div>
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all relative z-10 pl-16"
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-extrabold shadow-md">
                  {step.number}
                </div>
                <h3 className="text-base font-bold mb-1.5 text-gray-800">{step.title}</h3>
                <p className="text-xs text-gray-600 leading-snug">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createRoom}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:from-pink-600 hover:to-pink-700 transition-all"
            >
              30초만에 판결 받으러 가기
            </motion.button>
            <p className="mt-3 text-xs text-gray-500">
              별도 회원가입 없이 바로 시작할 수 있어요
            </p>
          </div>
        </div>
      </section>

      {/* 추가 섹션: 사용자 후기 */}
      <section className="py-12 bg-white relative">
        <div className="px-5 relative z-10">
          <h2 className="text-2xl font-extrabold mb-2 text-pink-600 text-center">판결 후 달라진 일상</h2>
          <p className="text-sm text-gray-600 mb-8 text-center font-medium leading-snug">
            실제 커플들의 솔직한 후기를<br/>확인해 보세요
          </p>
          
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl shadow-md border border-pink-100 relative">
              <div className="absolute top-5 right-5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">J</div>
                <div>
                  <p className="text-sm font-bold">지은 & 민호</p>
                  <p className="text-xs text-gray-500">연애 2년차</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-snug italic">
                "남친이 친구들과 술 마시느라 우리 기념일을 까먹은 일로 거의 헤어질 뻔했어요. AI 판사의 냉정한 판결(남친 잘못 85%)로 그가 진심으로 사과하고 관계를 다시 생각하게 됐어요. 지금은 기념일에 더 신경 쓰는 남친이 되었답니다!"
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">관계 개선</span>
                <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">책임감 향상</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md border border-pink-100 relative">
              <div className="absolute top-5 right-5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">D</div>
                <div>
                  <p className="text-sm font-bold">도윤 & 서연</p>
                  <p className="text-xs text-gray-500">연애 1년차</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-snug italic">
                "여자친구의 과도한 잠수와 집착 논쟁이 매일 반복됐어요. AI 판사가 서로의 애착 유형을 분석해주고 구체적인 소통 방법을 제안해줬는데, 솔직히 커플 상담보다 더 직접적이고 효과적이었습니다. 이젠 서로의 패턴을 이해하고 존중해요."
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">이해력 상승</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">소통 개선</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-white text-white">
        <div className="w-full border-t border-gray-300 py-[38px] flex-col pl-7">
          <div className="flex-col">
            <p className="text-black">NEANDER CO.,LTD</p>
            <p className="text-gray-400 text-[14px]">AC'SCENT</p>
          </div>
          <div className="flex mt-[30px]">
            <div className="text-black text-[14px] mr-20 xs:mr-5">
              <p>TERMS OF SERVICES</p>
              <p>PRIVACY POLICY</p>
            </div>
            <div className="text-gray-400 text-[14px]">
              <p>이용약관</p>
              <p>개인정보처리방침</p>
            </div>
          </div>
          <div className="flex-col mt-[30px] text-black text-[14px]">
            <p>SNS</p>
            <p className="text-gray-400">INSTAGRAM @AC_SCENT</p>
          </div>
          <div className="flex-col mt-[30px] text-black text-[14px]">
            <p>CONTACT</p>
            <p className="text-gray-400">T. 02-336-3368</p>
            <p className="text-gray-400">E. neander@neander.co.kr</p>
          </div>
          <div className="flex-col mt-[30px] text-black text-[14px]">
            <div>
              <p>HONGDAE STORE</p>
              <p className="text-gray-400">서울특별시 마포구 와우산로29라길 22 지하 1층</p>
            </div>
            <div className="mt-[30px]">
              <p className="text-gray-400">사업자등록번호: 683-86-02812</p>
              <p className="text-gray-400 pt-1">통신판매신고번호: 2033-서울서대문-1558</p>
              <p className="text-gray-400 pt-1">CEO. 유재영, 이동주</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
} 