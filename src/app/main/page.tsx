'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Laugh
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

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

  // 목업 데이터 - 실제 서비스에선 필요한 경우에만 사용
  const features = [
    {
      icon: Gavel,
      title: '공정한 판결',
      description: '감정에 휘둘리지 않는 중립적 판단으로 갈등 상황 해결',
      color: 'bg-blue-400'
    },
    {
      icon: Brain,
      title: '맞춤형 분석',
      description: '대화 패턴과 감정을 분석하여 최적의 해결책 제시',
      color: 'bg-pink-400'
    },
    {
      icon: HeartHandshake,
      title: '관계 개선 조언',
      description: '갈등 이후 더 나은 관계를 위한 실질적인 도움',
      color: 'bg-green-400'
    },
    {
      icon: Laugh,
      title: '재미있는 경험',
      description: '진지한 갈등도 유쾌하게 해결하는 특별한 경험',
      color: 'bg-yellow-400'
    }
  ];

  const useCases = [
    {
      title: '답 없는 커플 싸움',
      description: '같은 말만 반복하는 연인과의 대화, AI 판사와 함께 객관적으로 해결해요',
      icon: Heart,
      color: 'bg-pink-100 text-pink-600'
    },
    {
      title: '친구들과의 말싸움',
      description: '쪼잔한 일로 1시간째 논쟁 중이라면? 판사야가 깔끔하게 정리해드립니다',
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      title: '집안일 분담 갈등',
      description: '룸메이트와의 집안일 분담 갈등, 이제 공정하게 해결해요',
      icon: UserCheck,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: '게임 내 분쟁',
      description: '게임 아이템 분배부터 전략 논쟁까지, 객관적인 판정으로 해결',
      icon: Medal,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const steps = [
    {
      number: '1',
      title: '채팅방 생성',
      description: '간단히 버튼 하나로 재판 채팅방을 만들고 링크를 공유하세요.',
      detailedSteps: [
        '메인 화면에서 "재판 시작하기" 버튼을 클릭하세요',
        '자동으로 생성된 채팅방 링크를 친구들에게 공유하세요',
        '채팅방에 입장하면 자동으로 참여자 번호가 부여됩니다'
      ],
      icon: MessageSquare
    },
    {
      number: '2', 
      title: '대화 나누기',
      description: '서로의 입장을 자유롭게 이야기하며 진솔한 대화를 나누세요.',
      detailedSteps: [
        '서로의 의견을 자유롭게 주고받으세요',
        '감정에 치우치지 않고 자신의 입장을 설명해보세요',
        '상대방의 이야기도 끝까지 경청해보세요'
      ],
      icon: Users
    },
    {
      number: '3',
      title: '판결 받기',
      description: '충분한 대화 후 "야 판사야!" 버튼을 눌러 공정한 판결을 받으세요.',
      detailedSteps: [
        '대화가 충분히 이루어졌다면 "판사 부르기" 버튼을 클릭하세요',
        'AI 판사가 대화를 분석하고 객관적인 판결을 내립니다',
        '판결 결과에는 갈등 원인과 해결책도 함께 제시됩니다'
      ],
      icon: Gavel
    }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="bg-white shadow-sm py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-indigo-500" />
            <span className="font-bold text-xl text-indigo-500">야 판사야!</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createRoom}
            className="px-4 py-2 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
          >
            재판 시작하기
          </motion.button>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-indigo-600 leading-tight">
                갈등은 이제 <br />
                <span className="relative">
                  AI 판사
                  <svg className="absolute bottom-2 left-0 w-full" viewBox="0 0 300 12" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5C68 2 207 2 299 9" stroke="#FCD34D" strokeWidth="8" strokeLinecap="round" fill="none" />
                  </svg>
                </span>에게!
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-lg">
                싸움이 길어질수록 해결은 어려워집니다. 이제 AI 판사의 재미있고 공정한 판결로 갈등을 쉽게 해결하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createRoom}
                  disabled={isCreating}
                  className="px-8 py-4 bg-indigo-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-indigo-600 transition-all"
                >
                  {isCreating ? '방 생성 중...' : '재판 시작하기'}
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#how-it-works"
                  className="px-8 py-4 bg-white text-indigo-500 font-bold text-lg rounded-full shadow-md border border-indigo-100 hover:bg-indigo-50 transition-all"
                >
                  이용 방법 알아보기
                </motion.a>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:w-1/2 relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-100 relative">
                <div className="flex items-start mb-4 gap-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">A</div>
                  <div className="flex-1 bg-pink-50 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <p>너 진짜 내 생일도 기억 못하면서 뭐가 중요하다는 거야?</p>
                  </div>
                </div>
                <div className="flex items-start mb-4 gap-4 justify-end">
                  <div className="flex-1 bg-blue-50 p-3 rounded-2xl rounded-tr-none shadow-sm">
                    <p>너도 내가 일이 많다는 걸 알면서 자꾸 그런 말 하는 거 아니야?</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">B</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-5 h-5 text-yellow-600" />
                    <p className="font-bold text-yellow-700">판사의 판결</p>
                  </div>
                  <p className="text-gray-700">양측 모두 감정적으로 대화하고 있습니다. A는 기념일의 중요성을, B는 현실적 어려움을 인정하고 타협점을 찾아보세요.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 장식 요소 */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-pink-200 opacity-20 blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-indigo-200 opacity-20 blur-xl" />
        <div className="absolute top-40 right-20 w-10 h-10 rounded-full bg-yellow-200 opacity-40 blur-md" />
      </section>

      {/* 사용 사례 섹션 */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">어떤 갈등도 해결해 드립니다</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              사소한 말다툼부터 복잡한 감정싸움까지, 모든 갈등 상황을 AI 판사가 쉽고 재미있게 해결해드려요.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg ${useCase.color} flex items-center justify-center mb-4`}>
                  <useCase.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{useCase.title}</h3>
                <p className="text-gray-600">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">AI 판사만의 특별함</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              감정이 아닌 논리로 판단하고, 갈등의 근본 원인을 파악하여 실질적인 해결책을 제시합니다.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-6 items-start"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">이용 방법</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              단 3단계로 갈등 상황을 해결하고 더 나은 관계를 만들어보세요.
            </p>
          </motion.div>
          
          <div className="relative">
            <div className="hidden md:block absolute top-24 left-0 w-full border-t-2 border-dashed border-gray-200 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-5 mx-auto">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 text-center">{step.title}</h3>
                  <p className="text-gray-600 mb-5 text-center">{step.description}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {step.detailedSteps.map((detailedStep, dIndex) => (
                        <li key={dIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{detailedStep}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createRoom}
              className="px-8 py-4 bg-indigo-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-indigo-600 transition-all"
            >
              지금 바로 시작하기
            </motion.button>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gavel className="h-6 w-6 text-indigo-500" />
            <span className="font-bold text-xl text-indigo-500">야 판사야!</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} 야 판사야! 모든 권리 보유. | 갈등 해결을 위한 AI 판결 서비스
          </p>
        </div>
      </footer>
    </main>
  );
} 