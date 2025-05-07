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
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl ${useCase.color} flex items-center justify-center mb-4`}>
                  <useCase.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{useCase.title}</h3>
                <p className="text-gray-600">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createRoom}
              className="px-8 py-4 bg-indigo-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-indigo-600 transition-all"
            >
              내 갈등 해결하기
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">AI 판사의 특별한 능력</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              단순한 대화가 아닌, 전문적인 분석과 재미있는 판결로 갈등을 해결합니다
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              3단계로 간단하게
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">이용 방법</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              복잡한 과정 없이 3단계로 갈등을 해결하세요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-bold text-xl flex items-center justify-center mr-4">
                      {step.number}
                    </div>
                    <step.icon className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <h4 className="font-medium text-indigo-700 mb-2">상세 과정</h4>
                    <ul className="space-y-2">
                      {step.detailedSteps.map((detailedStep, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{detailedStep}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-12 text-indigo-300">
                    <ChevronRight className="w-full h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 사용자 후기 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">사용자들의 경험</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI 판사와 함께 갈등을 해결한 사용자들의 이야기를 들어보세요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "2시간 동안 해결 못한 영화 선택 문제를 AI 판사가 3분 만에 해결해줬어요. 덕분에 영화 시작 전에 팝콘도 살 수 있었습니다!",
                name: "영화광 커플",
                role: "데이트 중 갈등"
              },
              {
                quote: "친구들과 여행 경비 정산으로 다툴 뻔했는데, 판사야가 공정하게 정리해줘서 우정도 지키고 돈 문제도 해결했어요.",
                name: "여행 동아리",
                role: "여행 경비 갈등"
              },
              {
                quote: "남편과 집안일 분담으로 매일 싸웠는데, AI 판사의 판결 덕분에 이제는 서로 이해하며 평화롭게 지내고 있어요.",
                name: "행복한 부부",
                role: "가사 분담 갈등"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-md border border-gray-100"
              >
                <div className="mb-4 text-indigo-400">
                  <svg width="45" height="36" className="fill-current">
                    <path d="M13.415.001C6.07 5.185.887 13.681.887 23.041c0 7.632 4.608 12.096 9.936 12.096 5.04 0 8.784-4.032 8.784-8.784 0-4.752-3.312-8.208-7.632-8.208-.864 0-2.016.144-2.304.288.72-4.896 5.328-10.656 9.936-13.536L13.415.001zm24.768 0c-7.2 5.184-12.384 13.68-12.384 23.04 0 7.632 4.608 12.096 9.936 12.096 4.896 0 8.784-4.032 8.784-8.784 0-4.752-3.456-8.208-7.776-8.208-.864 0-1.872.144-2.16.288.72-4.896 5.184-10.656 9.792-13.536L38.183.001z"></path>
                  </svg>
                </div>
                <p className="text-gray-700 mb-6">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              이제 갈등을 혼자 해결하지 마세요
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              답 없는 싸움, 해결되지 않는 갈등, 끝나지 않는 논쟁...<br />
              AI 판사가 공정하고 재미있게 도와드립니다
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createRoom}
              className="px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              무료로 시작하기
            </motion.button>
            <p className="mt-4 text-sm opacity-80">
              회원가입이나 복잡한 절차 없이 바로 시작할 수 있어요
            </p>
          </motion.div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 flex items-center gap-2">
              <Gavel className="h-6 w-6 text-indigo-400" />
              <span className="font-bold text-xl text-white">야 판사야!</span>
            </div>
            <div className="space-y-2 text-center md:text-right">
              <p className="text-gray-400">AI 기반 갈등 해결 플랫폼</p>
              <p className="text-gray-500 text-sm">© 2025 야 판사야! 모든 권리 보유</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}