'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Users,
  Rocket,
  Target,
  Globe,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Crown,
  Palette,
  Megaphone,
  Code2,
  ChevronRight,
  Store,
  Smartphone,
  Calendar,
  Zap,
  BarChart3,
  Layers,
  Shield,
  Eye,
  Hand,
  Star,
  CircleDot,
  Crosshair,
  DollarSign,
  Check,
  X,
  Minus,
  Lock,
} from 'lucide-react';

type TabType = 'team' | 'bm';

export default function TeamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('team');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">
            팀 & BM 소개
          </h1>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto pb-20">
        {/* Company Identity */}
        <section className="px-5 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 rounded-full border border-pink-200 mb-3">
              <Building2 className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-xs font-bold text-pink-700 tracking-tight">
                (주) 네안데르 일동
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight mb-1.5">
              체험형 AI 콘텐츠를<br />만드는 사람들
            </h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              바이브코딩으로 실전에서 증명하는 팀
            </p>
          </motion.div>
        </section>

        {/* Tab Switch */}
        <div className="px-5 mb-5">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'team'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4" />
                팀 소개
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bm')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'bm'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Rocket className="w-4 h-4" />
                BM 소개
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'team' ? (
            <TeamTab key="team" />
          ) : (
            <BMTab key="bm" />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TEAM TAB
   ═══════════════════════════════════════════════════ */
function TeamTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.25 }}
      className="px-5 space-y-5"
    >
      {/* Company Timeline */}
      <section>
        <SectionHeader icon={Calendar} title="회사 연혁" />
        <div className="mt-3 space-y-0">
          <TimelineItem year="2023" quarter="상반기" title="예비창업패키지 최우수 선정" accent="pink" />
          <TimelineItem year="2023" quarter="8월" title="(주) 네안데르 법인 설립" accent="purple" />
          <TimelineItem year="2023" quarter="하반기" title="AI 조향사 기반 오프라인 매장 운영 시작" accent="pink" />
          <TimelineItem year="2025" quarter="" title="단일 매장 연 매출 5억원 달성" accent="yellow" highlight />
          <TimelineItem year="2025" quarter="" title="AI 조향 프로그램 온라인 런칭" accent="blue" />
          <TimelineItem year="2026" quarter="" title="AI 커플앱 글로벌 런칭 준비" accent="green" isLast />
        </div>
      </section>

      {/* Core Competency */}
      <section>
        <SectionHeader icon={Zap} title="핵심 역량" />
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <CompetencyCard icon="🧪" title="AI 조향 기술" desc="퍼스널 이미지 분석 기반 향수 추천" />
          <CompetencyCard icon="💻" title="바이브코딩" desc="팀 전원 개발 역량 보유" />
          <CompetencyCard icon="🏪" title="오프라인 실전" desc="자체 매장 운영으로 검증" />
          <CompetencyCard icon="⚡" title="내부 솔루션" desc="회계·견적·업무 자체 개발" />
        </div>
      </section>

      {/* AI 조향 매장 */}
      <section>
        <SectionHeader icon={Store} title="AI 조향 매장" />
        <div className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-sm text-gray-700 font-medium leading-relaxed mb-3">
            AI가 <span className="font-bold text-amber-800">퍼스널 이미지</span>를 분석하여
            어울리는 향수를 추천하고, 고객이 직접 조향하는 체험 프로그램
          </p>
          <div className="space-y-2 mb-3">
            <FeatureChip label="내 이미지에 맞는 향수 추천" />
            <FeatureChip label="최애 아이돌·캐릭터 이미지 분석" />
            <FeatureChip label="직접 향을 블렌딩하는 조향 체험" />
          </div>
          <a
            href="https://map.naver.com/p/entry/place/1274492663"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            네이버 지도에서 보기
          </a>
        </div>
      </section>

      {/* Revenue Highlight */}
      <section>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-emerald-100" />
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Revenue</span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-black tracking-tighter">5억</span>
            <span className="text-lg font-bold mb-1 text-emerald-100">원/년</span>
          </div>
          <p className="text-sm text-emerald-100 font-medium mt-1">
            단일 매장 기준 · 기존 향수 공방 대비 AI 차별화
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section>
        <SectionHeader icon={Users} title="팀 멤버" />
        <div className="mt-3 space-y-3">
          <TeamMemberCard
            name="김주연"
            role="CTO · 팀 리드"
            icon={Crown}
            iconColor="text-amber-500"
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
            tags={['바이브코딩 선구자', 'AI 프로그램 개발', '매장 운영 총괄']}
            description="'바이브코딩' 개념 등장 전부터 비개발자로서 ChatGPT 생성 코드를 활용, 다양한 AI 프로그램을 직접 개발·적용해온 실전형 리더"
          />
          <TeamMemberCard
            name="유재영"
            role="기획"
            icon={Target}
            iconColor="text-blue-500"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            tags={['고려대 조형예술 석사', '기획 역량', '바이브코딩']}
            description="예술적 감각과 체계적 기획력을 겸비, 서비스 방향성과 사용자 경험을 설계"
          />
          <TeamMemberCard
            name="유선화"
            role="마케팅"
            icon={Megaphone}
            iconColor="text-pink-500"
            bgColor="bg-pink-50"
            borderColor="border-pink-200"
            tags={['고려대 첨단기술비즈니스 석사', '콘텐츠 제작', '바이럴 마케팅']}
            description="데이터 기반 마케팅 전략과 바이럴 콘텐츠 제작으로 서비스 확산을 주도"
          />
          <TeamMemberCard
            name="이동주"
            role="디자인"
            icon={Palette}
            iconColor="text-purple-500"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            tags={['서강대 예술공학', '디자인', '프로그램 기획']}
            description="예술공학적 사고로 UX/UI 설계부터 프로그램 기획까지 전방위 디자인을 담당"
          />
        </div>
      </section>

      {/* Team Differentiator */}
      <section className="pb-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-black tracking-tight">팀 전원 바이브코딩 역량 보유</span>
          </div>
          <p className="text-sm text-gray-300 font-medium leading-relaxed">
            각자 도메인 전문성 위에 프로그래밍 역량을 쌓아,
            기획 → 디자인 → 개발 → 마케팅 전 과정을 자체 수행.
            외주 없이 빠르게 실행하고 실전에서 검증합니다.
          </p>
        </div>
      </section>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   BM TAB — Full Business Plan
   ═══════════════════════════════════════════════════ */
function BMTab() {
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25 }}
      className="px-5 space-y-6"
    >
      {/* ── 1. Executive Summary ── */}
      <section>
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 rounded-2xl p-5 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full mb-3">
              <Globe className="w-3 h-3 text-indigo-300" />
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                Executive Summary
              </span>
            </div>
            <h3 className="text-lg font-black leading-snug tracking-tight mb-2">
              글로벌 최초, K-Couple App +{' '}
              <span className="text-indigo-300">AI Pet</span> +{' '}
              <span className="text-amber-300">동양 미스틱</span>
            </h3>
            <p className="text-sm text-gray-300 font-medium leading-relaxed mb-4">
              한국이 커플앱의 원조다. 썸원(DAU 130만), 비트윈(누적 2,300만)이 증명했다.
              하지만 이 경험은 한국에 갇혀 있었다.
            </p>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">
                글로벌에 없는 것
              </p>
              <p className="text-sm text-white font-bold leading-relaxed">
                커플 기록(다이어리/캘린더/D-day) +{' '}
                <span className="text-indigo-300">AI 펫</span> +{' '}
                <span className="text-amber-300">동양 미스틱(사주/관상/손금/타로)</span>을
                하나로 통합한 앱 ={' '}
                <span className="text-emerald-400 font-black">전 세계 0개</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 기존 서비스 포트폴리오 ── */}
      <section>
        <SectionHeader icon={Sparkles} title="기존 서비스 포트폴리오" />
        <div className="mt-3 space-y-2.5">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-3.5 border border-pink-100">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-base">⚖️</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-gray-900 tracking-tight">야 판사야!</h4>
                <p className="text-[11px] text-gray-500 font-medium">AI 커플 갈등 해결 · 웹 서비스</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <MiniTag label="실시간 채팅 재판" color="pink" />
              <MiniTag label="AI 심리 분석" color="pink" />
              <MiniTag label="솔로 판결 모드" color="pink" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-3.5 border border-violet-100">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-base">🌸</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-gray-900 tracking-tight">AI 조향 프로그램</h4>
                <p className="text-[11px] text-gray-500 font-medium">오프라인 매장 + 온라인 런칭 완료</p>
              </div>
              <a
                href="https://www.acscent.co.kr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4 text-violet-400" />
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <MiniTag label="연 매출 5억" color="violet" />
              <MiniTag label="AI 이미지 분석" color="violet" />
              <MiniTag label="O2O 검증 완료" color="violet" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Market Opportunity ── */}
      <section>
        <SectionHeader icon={TrendingUp} title="시장 기회" />
        <div className="mt-3 space-y-3">
          {/* Market Size Cards */}
          <div className="grid grid-cols-2 gap-2">
            <MarketSizeCard
              value="$228억"
              label="글로벌 점성술 시장"
              sub="2034 · 5.9% CAGR"
              color="purple"
            />
            <MarketSizeCard
              value="$90억"
              label="점성술 앱 시장"
              sub="2030 · 20% CAGR"
              color="blue"
            />
            <MarketSizeCard
              value="$61.8억"
              label="데이팅/관계 앱"
              sub="2024 · 6%+ CAGR"
              color="pink"
            />
            <MarketSizeCard
              value="Blue Ocean"
              label="커플앱 + 점성술"
              sub="제대로 된 플레이어 0"
              color="emerald"
            />
          </div>

          {/* Why Now */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3.5 border border-amber-100">
            <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-2">Why Now?</p>
            <div className="space-y-2">
              <WhyNowItem text="Z세대 점성술 붐 — 관련 지출 $128억 → $228억" />
              <WhyNowItem text="틱톡 커플 가상펫 콘텐츠 폭발적 바이럴" />
              <WhyNowItem text="요가·풍수처럼 동양 문화 프리미엄 포지셔닝 가능" />
              <WhyNowItem text="AI 개인화 기술 성숙 — 소규모 팀도 고품질 구현" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Target Demographics ── */}
      <section>
        <SectionHeader icon={Crosshair} title="타겟 고객" />
        <div className="mt-3 space-y-2">
          <TargetCard
            priority="Primary"
            label="Gen Z Couples (18-28)"
            market="미국·영국·캐나다·호주"
            stats={[
              '미국인 30%가 점성술/타로 이용 (Pew Research)',
              'Z세대 80%가 점성술에 관심',
              '조직 종교 대신 유연한 영성 추구',
            ]}
            color="indigo"
          />
          <TargetCard
            priority="Secondary"
            label="한국·일본 커플 (18-35)"
            market="검증된 커플앱 문화권"
            stats={[
              '한국 커플앱 본고장, 높은 전환율',
              '일본 사주(四柱推命) 문화 강세',
            ]}
            color="pink"
          />
          <TargetCard
            priority="Tertiary"
            label="스페인어권 · 동남아"
            market="점성술 앱 시장 $2.05억"
            stats={[
              '남미: 점성술 수요 높음',
              '동남아: Widgetable이 수요 증명',
            ]}
            color="teal"
          />
        </div>
      </section>

      {/* ── 5. Competitive Landscape ── */}
      <section>
        <SectionHeader icon={Shield} title="경쟁 분석" />
        <div className="mt-3">
          {/* Our Position Highlight */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3.5 border border-emerald-200 mb-3">
            <p className="text-xs font-black text-emerald-800 mb-2">
              각각이 잘하는 게 다르고, 아무도 전부 합치지 못했다
            </p>
            <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
              Paired는 AI 없고, Pengu는 깊이 없고, Co-Star는 커플 특화 아님.
              Between은 혁신 정체. 모든 것을 통합한 앱은 존재하지 않는다.
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">기능 비교 매트릭스</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-2 py-1.5 font-bold text-gray-500 sticky left-0 bg-white min-w-[72px]">기능</th>
                    <th className="px-1.5 py-1.5 font-bold text-gray-400 min-w-[40px]">Paired</th>
                    <th className="px-1.5 py-1.5 font-bold text-gray-400 min-w-[40px]">Pengu</th>
                    <th className="px-1.5 py-1.5 font-bold text-gray-400 min-w-[44px]">Co-Star</th>
                    <th className="px-1.5 py-1.5 font-bold text-gray-400 min-w-[44px]">Between</th>
                    <th className="px-1.5 py-1.5 font-black text-emerald-600 bg-emerald-50 min-w-[36px]">Ours</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow label="AI Pet (대화)" values={['x', 'tri', 'x', 'x', 'o']} />
                  <ComparisonRow label="커플 다이어리" values={['x', 'x', 'x', 'o', 'o']} />
                  <ComparisonRow label="D-day/캘린더" values={['tri', 'x', 'x', 'o', 'o']} />
                  <ComparisonRow label="AI 갈등 판결" values={['x', 'x', 'x', 'x', 'o']} />
                  <ComparisonRow label="사주/운세" values={['x', 'x', 'w', 'x', 'o']} />
                  <ComparisonRow label="관상/손금 AI" values={['x', 'x', 'x', 'x', 'o']} />
                  <ComparisonRow label="타로" values={['x', 'x', 'x', 'x', 'o']} />
                  <ComparisonRow label="1일1질문" values={['o', 'x', 'x', 'x', 'o']} />
                  <ComparisonRow label="펫 꾸미기" values={['x', 'o', 'x', 'x', 'o']} />
                  <ComparisonRow label="관계 학습" values={['x', 'x', 'x', 'x', 'o']} />
                </tbody>
              </table>
            </div>
            <div className="px-3 py-1.5 border-t border-gray-100 flex items-center gap-3 text-[9px] text-gray-400">
              <span className="flex items-center gap-0.5"><span className="text-emerald-500 font-bold">O</span> 있음</span>
              <span className="flex items-center gap-0.5"><span className="text-amber-500 font-bold">△</span> 일부</span>
              <span className="flex items-center gap-0.5"><span className="text-gray-300 font-bold">X</span> 없음</span>
              <span className="flex items-center gap-0.5"><span className="text-blue-400 font-bold">W</span> 서양만</span>
            </div>
          </div>

          {/* Key Competitors */}
          <div className="mt-3 space-y-2">
            <CompetitorCard
              name="Paired"
              origin="UK"
              raised="$7.32M"
              downloads="800만"
              strength="NYT/BBC 피처, Google Play Awards"
              weakness="AI 부재, 정적 콘텐츠 반복 피로, 기록 기능 없음"
              expanded={expandedCompetitor === 'paired'}
              onToggle={() => setExpandedCompetitor(expandedCompetitor === 'paired' ? null : 'paired')}
            />
            <CompetitorCard
              name="Co-Star"
              origin="US"
              raised=""
              downloads="2,000만+"
              strength="Z세대 점성술 시장 선점, 월 $400K 매출"
              weakness="서양 점성술만, 커플 특화 아님, 궁합은 부가 기능"
              expanded={expandedCompetitor === 'costar'}
              onToggle={() => setExpandedCompetitor(expandedCompetitor === 'costar' ? null : 'costar')}
            />
            <CompetitorCard
              name="Pengu"
              origin="Global"
              raised=""
              downloads="수백만"
              strength="틱톡 바이럴, Z세대, 귀여운 UX"
              weakness="광고 과다 리뷰 급락, AI 깊이 없음, 커플 기능 빈약"
              expanded={expandedCompetitor === 'pengu'}
              onToggle={() => setExpandedCompetitor(expandedCompetitor === 'pengu' ? null : 'pengu')}
            />
          </div>
        </div>
      </section>

      {/* ── 6. Product Architecture ── */}
      <section>
        <SectionHeader icon={Layers} title="프로덕트 구조" />
        <div className="mt-3">
          {/* Architecture Diagram */}
          <div className="bg-gray-900 rounded-2xl p-4 text-white">
            {/* AI Pet Hub */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-3 text-center mb-3">
              <span className="text-lg">🐣</span>
              <p className="text-sm font-black tracking-tight">AI Pet (Central Hub)</p>
              <p className="text-[10px] text-indigo-200 font-medium">
                커플 히스토리 학습 · 모든 데이터 연결
              </p>
            </div>

            {/* Three Layers */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-[10px] font-black text-blue-300 mb-1 text-center">Core Layer</p>
                <p className="text-[9px] text-gray-400 text-center leading-snug">
                  다이어리 · 캘린더<br />
                  D-day · 앨범<br />
                  버킷리스트
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-[10px] font-black text-amber-300 mb-1 text-center">Mystic Layer</p>
                <p className="text-[9px] text-gray-400 text-center leading-snug">
                  사주 궁합 · 관상<br />
                  손금 · 타로<br />
                  일일 운세
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-[10px] font-black text-pink-300 mb-1 text-center">Social Layer</p>
                <p className="text-[9px] text-gray-400 text-center leading-snug">
                  AI 챗 · 1일1질문<br />
                  갈등 판결<br />
                  밸런스 게임
                </p>
              </div>
            </div>

            {/* Connection Examples */}
            <div className="space-y-1.5">
              <ConnectionExample
                from="캘린더 기념일 등록"
                to="펫이 운세 + 데이트 추천 + 선물 제안"
              />
              <ConnectionExample
                from="갈등 판결 후"
                to="펫이 다이어리에 '오늘의 교훈' 자동 기록"
              />
              <ConnectionExample
                from="일기에 'had a rough day'"
                to="펫이 위로 + 상대방에게 넌지시 알림"
              />
            </div>
          </div>

          {/* AI Pet Detail */}
          <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3.5 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">🐣</span>
              <h4 className="text-sm font-black text-gray-900 tracking-tight">AI Pet 시스템</h4>
            </div>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-3">
              단순 캐릭터가 아닌 <span className="font-bold text-indigo-700">&ldquo;우리 관계를 아는 AI 존재&rdquo;</span>
              — 시간이 지날수록 커플을 더 잘 이해
            </p>
            <div className="grid grid-cols-2 gap-2">
              <PetFeatureCard emoji="🥚" title="함께 부화" desc="커플이 같이 알에서 펫을 부화" />
              <PetFeatureCard emoji="📈" title="성장 시스템" desc="Egg → Baby → Adult → Special" />
              <PetFeatureCard emoji="🧠" title="성격 AI" desc="커플 패턴 학습, 고유 성격 형성" />
              <PetFeatureCard emoji="👕" title="꾸미기" desc="옷·악세서리·시즌 한정 아이템" />
            </div>
          </div>

          {/* Mystic Layer Detail */}
          <div className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3.5 border border-amber-100">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">🔮</span>
              <div>
                <h4 className="text-sm font-black text-gray-900 tracking-tight">Mystic Layer</h4>
                <p className="text-[10px] text-gray-500 font-bold">바이럴 엔진 + 구독 전환 핵심</p>
              </div>
            </div>
            <div className="space-y-2">
              <MysticFeature
                name="사주 궁합 (BaZi Destiny)"
                desc="오행 기반 커플 궁합 · 서양 Zodiac 비교 설명"
                viral="We let Ancient Eastern AI read our destiny"
              />
              <MysticFeature
                name="관상 AI (Face Reading)"
                desc="카메라 얼굴 촬영 → AI 관상 분석"
                viral="AI read my boyfriend's face and said..."
              />
              <MysticFeature
                name="손금 AI (Palm Reading)"
                desc="카메라 손바닥 촬영 → 러브라인 분석"
                viral="We compared our love lines"
              />
              <MysticFeature
                name="AI 타로 카드"
                desc="커플 전용 스프레드 · 카드 뽑기 인터랙션"
                viral=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Go-to-Market ── */}
      <section>
        <SectionHeader icon={Rocket} title="Go-to-Market" />
        <div className="mt-3 space-y-3">
          {/* TikTok First */}
          <div className="bg-gray-900 rounded-xl p-3.5 text-white">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base">📱</span>
              <h4 className="text-sm font-black tracking-tight">TikTok-First Viral Strategy</h4>
            </div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-3">
              Pengu, Sush, Widgetable 전부 틱톡 바이럴로 성장.
              점성술/운세 콘텐츠 2024년 23억 뷰 기록.
            </p>
            <div className="space-y-1.5">
              <ViralContent
                content="AI read our couple destiny using Eastern astrology"
                impact={5}
                format="리액션"
              />
              <ViralContent
                content="AI read my boyfriend&apos;s face and said THIS"
                impact={5}
                format="서프라이즈"
              />
              <ViralContent
                content="Our AI pet judged our fight"
                impact={5}
                format="코미디"
              />
              <ViralContent
                content="Eastern vs Western astrology — different results!"
                impact={4}
                format="교육"
              />
            </div>
          </div>

          {/* PR Angles */}
          <div className="bg-white rounded-xl p-3.5 border border-gray-200">
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">PR 앵글</p>
            <div className="space-y-2">
              <PRAngle
                angle="K-Culture의 다음 수출품은 커플앱이다"
                targets="K-pop, K-drama 이후 K-Couple Culture"
              />
              <PRAngle
                angle="Ancient Eastern Wisdom meets AI"
                targets="TechCrunch, Mashable 타겟"
              />
              <PRAngle
                angle="Z세대가 별자리 대신 사주를 본다"
                targets="BuzzFeed, Cosmopolitan 타겟"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Monetization ── */}
      <section>
        <SectionHeader icon={DollarSign} title="수익 모델" />
        <div className="mt-3 space-y-3">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">글로벌 가격 정책</p>
            </div>
            <div className="grid grid-cols-4 gap-px bg-gray-100">
              <PricingCell header market="시장" monthly="월" annual="연" />
              <PricingCell market="US/Global" monthly="$6.99" annual="$49.99" />
              <PricingCell market="한국" monthly="₩7,900" annual="₩59,000" />
              <PricingCell market="일본" monthly="¥980" annual="¥6,800" />
            </div>
          </div>

          {/* Free vs Premium */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Free vs Premium</p>
            </div>
            <div className="p-3 space-y-1.5">
              <FreemiumRow feature="일일 운세" free="간단 버전" premium="상세 + 주간·월간" />
              <FreemiumRow feature="사주 궁합" free="기본 1회" premium="전체 분석 + 갱신" />
              <FreemiumRow feature="관상/손금" free="1회 체험" premium="무제한" />
              <FreemiumRow feature="갈등 판결" free="월 3회" premium="무제한" />
              <FreemiumRow feature="펫 채팅" free="일 5회" premium="무제한" />
              <FreemiumRow feature="타로" free="일 1회" premium="일 3회 + 특별 덱" />
              <FreemiumRow feature="관계 리포트" free="-" premium="주간+월간+연간" />
              <FreemiumRow feature="광고" free="있음" premium="없음" />
            </div>
          </div>

          {/* Conversion Strategy */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3.5 border border-purple-100">
            <p className="text-xs font-black text-purple-800 mb-1.5">구독 전환 전략</p>
            <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
              Mystic 기능(사주, 관상, 손금) 1회 무료 체험 →
              결과의 <span className="font-bold text-purple-700">50%만 공개</span> →
              &ldquo;Unlock full reading&rdquo; → 구독 유도.
            </p>
            <div className="mt-2 bg-white/70 rounded-lg px-3 py-2 border border-purple-100">
              <p className="text-xs font-black text-purple-700">
                점성술 앱 프리미엄 전환율:{' '}
                <span className="text-2xl">28%</span>
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                일반 앱(2~5%)의 5배 이상
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Revenue Projections ── */}
      <section>
        <SectionHeader icon={BarChart3} title="매출 예측" />
        <div className="mt-3 space-y-2.5">
          <ProjectionCard
            phase="Phase 1"
            period="Month 1~3"
            label="Survival"
            color="amber"
            conservative={{ downloads: '5,000', mau: '2,000', cvr: '3%', mrr: '$420' }}
            optimistic={{ downloads: '20,000', mau: '8,000', cvr: '7%', mrr: '$3,920' }}
          />
          <ProjectionCard
            phase="Phase 2"
            period="Month 4~12"
            label="Early Growth"
            color="blue"
            conservative={{ downloads: '50,000', mau: '15,000', cvr: '5%', mrr: '$5,250' }}
            optimistic={{ downloads: '200,000', mau: '60,000', cvr: '10%', mrr: '$42,000' }}
          />
          <ProjectionCard
            phase="Phase 3"
            period="Year 2"
            label="Growth Track"
            color="emerald"
            conservative={{ downloads: '', mau: '100,000', cvr: '', mrr: '$35,000' }}
            optimistic={{ downloads: '', mau: '500,000', cvr: '', mrr: '$350,000' }}
          />

          {/* Breakeven */}
          <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200">
            <p className="text-xs font-black text-emerald-800 mb-1">손익분기점</p>
            <p className="text-sm text-gray-700 font-medium">
              구독자 <span className="font-black text-emerald-700">약 150~300명</span> (MAU 5,000~10,000)
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
              월 운영비 ~$800~1,800 · 글로벌 시장에서 달성 용이
            </p>
          </div>
        </div>
      </section>

      {/* ── 10. Localization ── */}
      <section>
        <SectionHeader icon={Globe} title="현지화 전략" />
        <div className="mt-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 space-y-2">
              <LocaleRow flag="🇺🇸" priority="P0" lang="English" market="US, UK, Canada, AU" note="1차 런칭 언어" />
              <LocaleRow flag="🇰🇷" priority="P1" lang="Korean" market="South Korea" note="커플앱 본고장" />
              <LocaleRow flag="🇯🇵" priority="P2" lang="Japanese" market="Japan" note="사주 문화 강세" />
              <LocaleRow flag="🇪🇸" priority="P3" lang="Spanish" market="Latin America" note="점성술 $2.05억" />
              <LocaleRow flag="🇧🇷" priority="P4" lang="Portuguese" market="Brazil" note="영성 수용도 높음" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. Tech Stack ── */}
      <section>
        <SectionHeader icon={Code2} title="기술 스택" />
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <TechItem label="Frontend" value="Expo (React Native)" />
            <TechItem label="Backend/DB" value="Supabase" />
            <TechItem label="AI Engine" value="Claude API" />
            <TechItem label="Payment" value="RevenueCat" />
            <TechItem label="Push" value="Firebase FCM" />
            <TechItem label="i18n" value="i18next" />
            <TechItem label="Analytics" value="Mixpanel" />
            <TechItem label="Image AI" value="Claude Vision" />
          </div>
        </div>
      </section>

      {/* ── 12. Investment Strategy ── */}
      <section>
        <SectionHeader icon={Target} title="투자 전략" />
        <div className="mt-3 space-y-3">
          <div className="bg-gray-900 rounded-xl p-3.5 text-white">
            <p className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">Bootstrap-First</p>
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              썸원(모니모니) 벤치마킹: 투자 없이 DAU 100만까지 자생 성장.
              <span className="text-white font-bold"> 자생 매출로 ARR $100K~500K 증명 후 투자 도전.</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">투자 유치 마일스톤</p>
            </div>
            <div className="p-3 space-y-2">
              <MilestoneRow
                milestone="MAU 10K + CVR 5%+"
                action="엔젤 투자 $50K~200K"
              />
              <MilestoneRow
                milestone="MAU 50K + MRR $15K+"
                action="시드 라운드 $500K~2M"
              />
              <MilestoneRow
                milestone="MAU 200K + MRR $100K+"
                action="시리즈 A 준비"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. KPIs ── */}
      <section>
        <SectionHeader icon={Star} title="핵심 KPI" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <KPICard label="D7 Retention" value="35%+" period="Phase 1" />
          <KPICard label="구독 전환율" value="7%+" period="Phase 2" />
          <KPICard label="MAU" value="200K+" period="Year 2" />
          <KPICard label="ARR" value="$1.2M+" period="Year 2" />
        </div>
      </section>

      {/* ── Footer ── */}
      <section className="pb-6">
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400 font-medium">
            v3.0 — Global-First Business Plan
          </p>
          <p className="text-[10px] text-gray-300 font-medium">
            (주) 네안데르 일동 · Last Updated 2026.02
          </p>
        </div>
      </section>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-800" />
      <h3 className="text-base font-black text-gray-900 tracking-tight">{title}</h3>
    </div>
  );
}

/* ── Team Tab Components ── */

function TimelineItem({
  year, quarter, title, accent, highlight = false, isLast = false,
}: {
  year: string; quarter: string; title: string; accent: string;
  highlight?: boolean; isLast?: boolean;
}) {
  const dotColor: Record<string, string> = {
    pink: 'bg-pink-500', purple: 'bg-purple-500', yellow: 'bg-amber-500',
    blue: 'bg-blue-500', green: 'bg-emerald-500',
  };
  const highlightBg = highlight ? 'bg-amber-50 border border-amber-200' : 'bg-white';
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor[accent]} ring-4 ring-white shadow-sm mt-1`} />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-0.5" />}
      </div>
      <div className={`flex-1 ${highlightBg} rounded-xl px-3 py-2 mb-2`}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-black text-gray-400">{year}</span>
          {quarter && <span className="text-xs text-gray-400 font-medium">{quarter}</span>}
        </div>
        <p className={`text-sm font-bold tracking-tight ${highlight ? 'text-amber-800' : 'text-gray-800'}`}>
          {title}
        </p>
      </div>
    </div>
  );
}

function CompetencyCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
      <span className="text-xl mb-1.5 block">{icon}</span>
      <h4 className="text-sm font-black text-gray-900 tracking-tight mb-0.5">{title}</h4>
      <p className="text-xs text-gray-500 font-medium leading-snug">{desc}</p>
    </div>
  );
}

function FeatureChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </div>
  );
}

function TeamMemberCard({
  name, role, icon: Icon, iconColor, bgColor, borderColor, tags, description,
}: {
  name: string; role: string; icon: React.ElementType; iconColor: string;
  bgColor: string; borderColor: string; tags: string[]; description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-2xl p-4 border ${borderColor}`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-9 h-9 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h4 className="text-base font-black text-gray-900 tracking-tight">{name}</h4>
          <p className="text-xs text-gray-500 font-bold">{role}</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 font-medium leading-relaxed mb-2.5">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="px-2 py-0.5 bg-white/70 rounded-md text-xs font-semibold text-gray-600 border border-white">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── BM Tab Components ── */

function MiniTag({ label, color = 'pink' }: { label: string; color?: string }) {
  const styles: Record<string, string> = {
    pink: 'text-pink-700 border-pink-100 bg-white/70',
    violet: 'text-violet-700 border-violet-100 bg-white/70',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[color]}`}>
      {label}
    </span>
  );
}

function MarketSizeCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const bg: Record<string, string> = {
    purple: 'from-purple-50 to-indigo-50 border-purple-100',
    blue: 'from-blue-50 to-cyan-50 border-blue-100',
    pink: 'from-pink-50 to-rose-50 border-pink-100',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-100',
  };
  const textColor: Record<string, string> = {
    purple: 'text-purple-700',
    blue: 'text-blue-700',
    pink: 'text-pink-700',
    emerald: 'text-emerald-700',
  };
  return (
    <div className={`bg-gradient-to-br ${bg[color]} rounded-xl p-3 border`}>
      <p className={`text-lg font-black ${textColor[color]} tracking-tighter leading-none mb-0.5`}>{value}</p>
      <p className="text-[11px] font-bold text-gray-700 leading-tight">{label}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{sub}</p>
    </div>
  );
}

function WhyNowItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <ChevronRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
      <span className="text-xs font-semibold text-gray-700 leading-snug">{text}</span>
    </div>
  );
}

function TargetCard({
  priority, label, market, stats, color,
}: {
  priority: string; label: string; market: string; stats: string[]; color: string;
}) {
  const colors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    indigo: { bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-100', badge: 'bg-indigo-500', text: 'text-indigo-700' },
    pink: { bg: 'from-pink-50 to-rose-50', border: 'border-pink-100', badge: 'bg-pink-500', text: 'text-pink-700' },
    teal: { bg: 'from-teal-50 to-emerald-50', border: 'border-teal-100', badge: 'bg-teal-500', text: 'text-teal-700' },
  };
  const c = colors[color];
  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-xl p-3 border ${c.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[9px] font-black text-white ${c.badge} px-1.5 py-0.5 rounded`}>{priority}</span>
        <span className="text-sm font-black text-gray-900 tracking-tight">{label}</span>
      </div>
      <p className={`text-[11px] font-bold ${c.text} mb-1.5`}>{market}</p>
      <div className="space-y-1">
        {stats.map((s, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <CircleDot className="w-2.5 h-2.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] font-medium text-gray-600 leading-snug">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonRow({ label, values }: { label: string; values: string[] }) {
  const renderCell = (v: string) => {
    switch (v) {
      case 'o': return <span className="text-emerald-500 font-black">O</span>;
      case 'x': return <span className="text-gray-200 font-bold">X</span>;
      case 'tri': return <span className="text-amber-500 font-bold">△</span>;
      case 'w': return <span className="text-blue-400 font-bold">W</span>;
      default: return <span className="text-gray-300">-</span>;
    }
  };
  return (
    <tr className="border-b border-gray-50">
      <td className="px-2 py-1 font-bold text-gray-700 sticky left-0 bg-white">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`px-1.5 py-1 text-center ${i === values.length - 1 ? 'bg-emerald-50' : ''}`}>
          {renderCell(v)}
        </td>
      ))}
    </tr>
  );
}

function CompetitorCard({
  name, origin, raised, downloads, strength, weakness, expanded, onToggle,
}: {
  name: string; origin: string; raised: string; downloads: string;
  strength: string; weakness: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full text-left bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-gray-900 tracking-tight">{name}</span>
            <span className="text-[10px] font-bold text-gray-400">{origin}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-gray-500">{downloads} DL</span>
            {raised && <span className="text-[10px] font-bold text-blue-500">{raised} raised</span>}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      {expanded && (
        <div className="px-3 pb-2.5 pt-0 space-y-1.5 border-t border-gray-100 mt-0">
          <div className="pt-2">
            <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Strength</p>
            <p className="text-[11px] text-gray-600 font-medium leading-snug">{strength}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-500 mb-0.5">Weakness</p>
            <p className="text-[11px] text-gray-600 font-medium leading-snug">{weakness}</p>
          </div>
        </div>
      )}
    </button>
  );
}

function ConnectionExample({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-start gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
      <span className="text-[10px] font-bold text-indigo-300 flex-shrink-0 mt-0.5">→</span>
      <div className="min-w-0">
        <span className="text-[10px] text-gray-400 font-medium">{from}</span>
        <span className="text-[10px] text-white font-bold block">{to}</span>
      </div>
    </div>
  );
}

function PetFeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
      <span className="text-base block mb-1">{emoji}</span>
      <p className="text-[11px] font-black text-gray-900 tracking-tight">{title}</p>
      <p className="text-[10px] text-gray-500 font-medium leading-snug">{desc}</p>
    </div>
  );
}

function MysticFeature({ name, desc, viral }: { name: string; desc: string; viral: string }) {
  return (
    <div className="bg-white/70 rounded-lg p-2.5 border border-amber-100">
      <p className="text-[11px] font-black text-gray-900 tracking-tight mb-0.5">{name}</p>
      <p className="text-[10px] text-gray-600 font-medium leading-snug">{desc}</p>
      {viral && (
        <p className="text-[10px] text-amber-600 font-bold mt-1 italic">
          &ldquo;{viral}&rdquo;
        </p>
      )}
    </div>
  );
}

function ViralContent({ content, impact, format }: { content: string; impact: number; format: string }) {
  return (
    <div className="flex items-start gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
      <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
        {Array.from({ length: impact }).map((_, i) => (
          <Star key={i} className="w-2 h-2 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white font-medium leading-snug">&ldquo;{content}&rdquo;</p>
        <p className="text-[9px] text-gray-500 font-bold mt-0.5">{format}</p>
      </div>
    </div>
  );
}

function PRAngle({ angle, targets }: { angle: string; targets: string }) {
  return (
    <div className="flex items-start gap-2">
      <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-bold text-gray-800 leading-snug">&ldquo;{angle}&rdquo;</p>
        <p className="text-[10px] text-gray-500 font-medium">{targets}</p>
      </div>
    </div>
  );
}

function PricingCell({ header, market, monthly, annual }: { header?: boolean; market: string; monthly: string; annual: string }) {
  const cls = header ? 'font-black text-gray-500' : 'font-bold text-gray-700';
  return (
    <div className={`bg-white p-2 text-center ${header ? 'bg-gray-50' : ''}`}>
      <p className={`text-[10px] ${cls}`}>{market}</p>
      <p className={`text-[11px] ${header ? 'font-bold text-gray-400' : 'font-black text-gray-900'}`}>{monthly}</p>
      <p className={`text-[10px] ${header ? 'font-bold text-gray-400' : 'font-bold text-gray-500'}`}>{annual}</p>
    </div>
  );
}

function FreemiumRow({ feature, free, premium }: { feature: string; free: string; premium: string }) {
  return (
    <div className="flex items-center text-[11px]">
      <span className="w-[72px] font-bold text-gray-700 flex-shrink-0">{feature}</span>
      <span className="flex-1 font-medium text-gray-400 text-center">{free}</span>
      <span className="flex-1 font-bold text-indigo-600 text-center">{premium}</span>
    </div>
  );
}

function ProjectionCard({
  phase, period, label, color, conservative, optimistic,
}: {
  phase: string; period: string; label: string; color: string;
  conservative: { downloads: string; mau: string; cvr: string; mrr: string };
  optimistic: { downloads: string; mau: string; cvr: string; mrr: string };
}) {
  const badgeColors: Record<string, string> = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className={`text-[9px] font-black text-white ${badgeColors[color]} px-1.5 py-0.5 rounded`}>
          {phase}
        </span>
        <span className="text-[11px] font-bold text-gray-500">{period}</span>
        <span className="text-[11px] font-black text-gray-700 ml-auto">{label}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Conservative</p>
          {conservative.downloads && (
            <p className="text-[10px] text-gray-500 font-medium">DL: {conservative.downloads}</p>
          )}
          <p className="text-[10px] text-gray-500 font-medium">MAU: {conservative.mau}</p>
          {conservative.cvr && (
            <p className="text-[10px] text-gray-500 font-medium">CVR: {conservative.cvr}</p>
          )}
          <p className="text-[11px] font-black text-gray-700 mt-1">MRR {conservative.mrr}</p>
        </div>
        <div className="p-2.5">
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Optimistic</p>
          {optimistic.downloads && (
            <p className="text-[10px] text-gray-500 font-medium">DL: {optimistic.downloads}</p>
          )}
          <p className="text-[10px] text-gray-500 font-medium">MAU: {optimistic.mau}</p>
          {optimistic.cvr && (
            <p className="text-[10px] text-gray-500 font-medium">CVR: {optimistic.cvr}</p>
          )}
          <p className="text-[11px] font-black text-emerald-600 mt-1">MRR {optimistic.mrr}</p>
        </div>
      </div>
    </div>
  );
}

function LocaleRow({ flag, priority, lang, market, note }: { flag: string; priority: string; lang: string; market: string; note: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base flex-shrink-0">{flag}</span>
      <span className="text-[10px] font-black text-gray-400 w-6 flex-shrink-0">{priority}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-800">{lang}</p>
        <p className="text-[10px] text-gray-500 font-medium truncate">{market}</p>
      </div>
      <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{note}</span>
    </div>
  );
}

function TechItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-black text-gray-800 tracking-tight">{value}</p>
    </div>
  );
}

function MilestoneRow({ milestone, action }: { milestone: string; action: string }) {
  return (
    <div className="flex items-center gap-2">
      <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-700">{milestone}</p>
        <p className="text-[10px] text-gray-500 font-medium">{action}</p>
      </div>
    </div>
  );
}

function KPICard({ label, value, period }: { label: string; value: string; period: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
      <p className="text-xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[11px] font-bold text-gray-700 mt-0.5">{label}</p>
      <p className="text-[10px] font-medium text-gray-400">{period}</p>
    </div>
  );
}
