# 🚀 Ya-Judge 결제 모듈 구현 가이드

> **다른 프로젝트에서 재사용 가능한 완전한 결제 시스템**  
> PortOne v2 기반, 모바일 최적화, Firebase 통합

---

## 📋 목차

1. [개요](#-개요)
2. [기술 스택](#-기술 스택)
3. [설치 및 설정](#-설치-및-설정)
4. [파일 구조](#-파일-구조)
5. [핵심 구현 내용](#-핵심-구현-내용)
6. [사용 방법](#-사용-방법)
7. [커스터마이징](#-커스터마이징)
8. [트러블슈팅](#-트러블슈팅)
9. [마이그레이션 체크리스트](#-마이그레이션-체크리스트)

---

## 🎯 개요

Ya-Judge에서 구현한 결제 모듈은 **PortOne v2**를 기반으로 한 현대적인 결제 시스템입니다. 특히 **모바일 환경**에 최적화되어 있으며, 복잡한 실시간 상태 관리와 세션 지속성 문제를 해결했습니다.

### 주요 특징
- ✅ **모바일 완벽 지원**: 리다이렉트 기반 모바일 결제 플로우
- ✅ **실시간 상태 관리**: Firebase 기반 다중 클라이언트 동기화
- ✅ **세션 지속성**: 결제 중 사용자 상태 보존
- ✅ **개발자 친화적**: 테스트 도구 및 개발 모드 제공
- ✅ **관리자 기능**: 결제 취소 및 내역 관리
- ✅ **확장 가능**: 새로운 결제 수단 쉽게 추가

---

## 🛠 기술 스택

```json
{
  "결제 게이트웨이": "@portone/browser-sdk: ^0.0.19",
  "상태 관리": "zustand: ^5.0.4",
  "데이터베이스": "firebase: ^11.6.1",
  "프레임워크": "next: 15.3.1",
  "언어": "TypeScript",
  "암호화": "bcryptjs: ^3.0.2",
  "UI": "tailwindcss + framer-motion"
}
```

---

## 📦 설치 및 설정

### 1. 필수 패키지 설치

```bash
# 핵심 패키지
pnpm add @portone/browser-sdk zustand firebase bcryptjs

# 타입 정의
pnpm add -D @types/bcryptjs

# UI 관련 (선택사항)
pnpm add framer-motion lucide-react tailwindcss
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# PortOne 설정 (필수)
NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your_channel_key
PORTONE_API_SECRET=your_api_secret

# Firebase 설정 (필수)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. PortOne 계정 설정

1. [PortOne 관리자 콘솔](https://admin.portone.io/) 가입
2. 테스트 채널 생성 (KG이니시스, 카카오페이 등)
3. Store ID, Channel Key, API Secret 발급
4. 리다이렉트 URL 설정: `https://yourdomain.com/newpayment/result`

---

## 📁 파일 구조

### 복사해야 할 파일들

```
📁 프로젝트 루트/
├── 📁 src/lib/
│   └── newpayment.ts                    # 핵심 결제 유틸리티
├── 📁 src/app/store/
│   └── newPaymentStore.ts               # 결제 상태 관리
├── 📁 src/app/api/newpayment/
│   ├── initialize/route.ts              # 결제 초기화 API
│   ├── verify/route.ts                  # 결제 검증 API
│   ├── auth/route.ts                    # 관리자 인증 API
│   └── cancel/route.ts                  # 결제 취소 API
├── 📁 src/app/newpayment/
│   ├── page.tsx                         # 메인 대시보드
│   ├── checkout/page.tsx                # 결제 진행 페이지
│   ├── result/page.tsx                  # 결제 완료 페이지
│   ├── admin/page.tsx                   # 관리자 페이지
│   └── test/page.tsx                    # 테스트 페이지
└── 📁 src/components/chat/modals/
    └── PaymentConfirmModal.tsx          # 결제 확인 모달
```

---

## 🔧 핵심 구현 내용

### 1. 결제 유틸리티 (`src/lib/newpayment.ts`)

**주요 함수들:**

```typescript
// 결제 초기화 및 실행
export async function initializePayment(customer: CustomerInfo, payment: PaymentDetails)
export async function requestPayment(customer: CustomerInfo, payment: PaymentDetails)

// 결제 검증
export async function verifyPayment(paymentId: string, orderData: any)

// Firebase 저장
export async function logPaymentCompletion(paymentResult: PaymentResult, roomId?: string, username?: string, isHost?: boolean)

// 유틸리티
export function isMobileBrowser(): boolean
export function createPaymentResult(paymentId: string, customer: CustomerInfo, payment: PaymentDetails, status: string)
```

**특별한 기능:**

1. **모바일 결제 최적화**
```typescript
// KCP V2 모바일 결제 bypass 파라미터 자동 설정
if (payment.payMethod === 'MOBILE') {
  paymentRequest = {
    ...basePaymentRequest,
    bypass: {
      shop_user_id: customer.email || customer.phone || paymentId,
      digital: '1' // 항상 디지털 콘텐츠
    }
  };
}
```

2. **다중 저장 시스템**
```typescript
// 글로벌 결제 정보 저장
const paymentPath = `payment/${paymentDate}/${paymentResult.paymentId}`;

// 방별 결제 사용자 정보 저장
const roomPaidUserRef = ref(database, `rooms/${roomId}/paidUsers/${username}`);

// 방별 주문 정보 저장
const roomOrderRef = ref(database, `rooms/${roomId}/orders/${paymentResult.paymentId}`);
```

### 2. 상태 관리 (`src/app/store/newPaymentStore.ts`)

**Zustand 기반 경량 상태 관리:**

```typescript
interface PaymentState {
  paymentResult: PaymentResult | null;
  roomId: string | null;
  userName: string | null;
  isPaymentInProgress: boolean;
  isPaymentCompleted: boolean;
  paymentError: string | null;
}

// 편의 훅들
export const usePaymentStatus = () => { /* ... */ }
export const usePaymentSession = () => { /* ... */ }
export const usePaymentResult = () => { /* ... */ }
```

### 3. API 엔드포인트들

#### 결제 초기화 (`/api/newpayment/initialize`)
```typescript
// POST 요청으로 결제 데이터 초기화
// 고유 결제 ID 생성 및 검증
const paymentId = `ord_${timestamp}_${randomPart}`;
```

#### 결제 검증 (`/api/newpayment/verify`)
```typescript
// GET: 모바일 리다이렉트용 (URL 파라미터)
// POST: 데스크톱용 (요청 본문)
// 개발 모드에서 Mock 데이터 제공
```

### 4. 모바일 최적화 핵심 로직

**세션 지속성:**
```typescript
// 다중 소스 Room ID 감지
const detectedRoomId = newRoomId || 
                      sessionStorage.getItem('roomId') ||
                      localStorage.getItem('roomId') ||
                      urlParams.get('roomId') ||
                      document.referrer.match(/\/room\/([^\/\?]+)/)?.[1];
```

**호스트 Presence 복원:**
```typescript
// 결제 완료 후 호스트 상태 자동 복원
if (currentUserEntry && currentUserEntry[0] === hostUserId) {
  const hostPresenceRef = ref(database, `rooms/${roomId}/hostPresence`);
  await set(hostPresenceRef, true);
}
```

---

## 🚀 사용 방법

### 1. 기본 결제 플로우

```typescript
import { requestPayment, verifyPayment, logPaymentCompletion } from '@/lib/newpayment';
import { useNewPaymentStore } from '@/app/store/newPaymentStore';

function PaymentComponent() {
  const { setPaymentResult, setPaymentInProgress } = useNewPaymentStore();

  const handlePayment = async () => {
    setPaymentInProgress(true);
    
    try {
      // 1. 고객 정보 준비
      const customer = {
        name: "홍길동",
        email: "hong@example.com",
        phone: "010-1234-5678"
      };
      
      // 2. 결제 정보 준비
      const payment = {
        orderName: "테스트 상품",
        totalAmount: 1000,
        payMethod: "CARD"
      };
      
      // 3. 결제 실행
      const { paymentId } = await requestPayment(customer, payment);
      
      // 4. 결제 검증 (데스크톱의 경우)
      if (!isMobileBrowser()) {
        const verificationResult = await verifyPayment(paymentId, {
          totalAmount: payment.totalAmount,
          orderName: payment.orderName,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          payMethod: payment.payMethod
        });
        
        if (verificationResult.status === 'success') {
          // 5. 결제 완료 처리
          const paymentResult = createPaymentResult(paymentId, customer, payment, 'SUCCESS');
          await logPaymentCompletion(paymentResult);
          setPaymentResult(paymentResult);
        }
      }
      
    } catch (error) {
      console.error('결제 실패:', error);
    } finally {
      setPaymentInProgress(false);
    }
  };

  return (
    <button onClick={handlePayment}>
      결제하기
    </button>
  );
}
```

### 2. 모바일 결제 처리

```typescript
// 모바일에서는 sessionStorage에 정보 저장 후 리다이렉트
if (isMobileBrowser()) {
  sessionStorage.setItem('newPaymentId', paymentId);
  sessionStorage.setItem('newOrderData', JSON.stringify(formData));
  sessionStorage.setItem('newRoomId', roomId || '');
  // PortOne이 자동으로 리다이렉트 처리
  return;
}
```

### 3. 결제 결과 페이지에서 처리

```typescript
// /newpayment/result 페이지에서 자동 처리
useEffect(() => {
  // URL 파라미터 또는 sessionStorage에서 결제 정보 복원
  // 결제 검증 및 완료 처리
  // Firebase에 결과 저장
  // 사용자 상태 복원
}, []);
```

---

## 🎨 커스터마이징

### 1. 결제 수단 추가

```typescript
// src/lib/newpayment.ts에서 payMethod 확장
export type PaymentMethod = 'CARD' | 'MOBILE' | 'TRANSFER' | 'KAKAOPAY' | 'NAVERPAY';

// 각 결제 수단별 특별 처리 로직 추가
if (payment.payMethod === 'KAKAOPAY') {
  // 카카오페이 전용 설정
}
```

### 2. Firebase 스키마 커스터마이징

```typescript
// 결제 데이터 구조 확장
interface CustomPaymentResult extends PaymentResult {
  customField1: string;
  customField2: number;
  metadata: Record<string, any>;
}
```

### 3. UI 컴포넌트 커스터마이징

```typescript
// 결제 확인 모달 커스터마이징
<PaymentConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handlePaymentConfirm}
  userName={currentUser}
  customProps={yourCustomProps} // 추가 props
/>
```

### 4. 환경별 설정

```typescript
// 개발/운영 환경별 다른 설정
const isDevelopment = process.env.NODE_ENV === 'development';

const paymentConfig = {
  storeId: isDevelopment 
    ? process.env.NEXT_PUBLIC_PORTONE_DEV_STORE_ID
    : process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
  // ...
};
```

---

## 🔧 트러블슈팅

### 1. 모바일 결제 리다이렉트 실패

**문제**: 모바일에서 결제 완료 후 잘못된 페이지로 이동

**해결**:
```typescript
// src/lib/newpayment.ts에서 redirectUrl 확인
redirectUrl: window.location.origin + '/newpayment/result'
```

### 2. 세션 데이터 손실

**문제**: 모바일 결제 후 사용자 정보 손실

**해결**:
```typescript
// 다중 저장소 활용
sessionStorage.setItem('newRoomId', roomId);
sessionStorage.setItem('username', username);
localStorage.setItem('backupRoomId', roomId); // 백업
```

### 3. Firebase 권한 오류

**문제**: Firebase 데이터베이스 접근 권한 오류

**해결**:
```json
// database.rules.json
{
  "rules": {
    "payment": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "rooms": {
      "$roomId": {
        "paidUsers": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

### 4. PortOne API 오류

**문제**: 결제 검증 시 API 오류

**해결**:
```typescript
// 개발 모드 활용
if (!PORTONE_API_SECRET) {
  console.warn('개발 모드: API Secret 없음');
  // Mock 데이터 반환
}
```

### 5. 중복 결제 방지

**문제**: 사용자가 중복으로 결제 시도

**해결**:
```typescript
// Firebase에 결제 진행 상태 저장
const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
await set(isPayingRef, { status: true, user: username });
```

---

## ✅ 마이그레이션 체크리스트

### Phase 1: 환경 설정
- [ ] PortOne 계정 생성 및 채널 설정
- [ ] Firebase 프로젝트 생성 및 설정
- [ ] 환경 변수 설정 (`.env.local`)
- [ ] 필수 패키지 설치

### Phase 2: 파일 복사
- [ ] `src/lib/newpayment.ts` 복사
- [ ] `src/app/store/newPaymentStore.ts` 복사
- [ ] API 라우트 파일들 복사 (`src/app/api/newpayment/`)
- [ ] 페이지 컴포넌트들 복사 (`src/app/newpayment/`)

### Phase 3: 의존성 해결
- [ ] Firebase 설정 파일 (`src/lib/firebase.ts`) 확인
- [ ] 기존 프로젝트의 라우팅 구조와 호환성 확인
- [ ] 타입 정의 파일들 확인

### Phase 4: 커스터마이징
- [ ] 결제 금액 및 상품명 로직 수정
- [ ] UI/UX 디자인 커스터마이징
- [ ] 추가 결제 수단 설정 (필요시)
- [ ] Firebase 스키마 조정

### Phase 5: 테스트
- [ ] 개발 환경에서 데스크톱 결제 테스트
- [ ] 개발 환경에서 모바일 결제 테스트
- [ ] 관리자 기능 테스트
- [ ] 에러 시나리오 테스트

### Phase 6: 배포
- [ ] 운영 환경 변수 설정
- [ ] PortOne 운영 채널 설정
- [ ] Firebase 보안 규칙 설정
- [ ] 모니터링 및 로깅 설정

---

## 📚 추가 리소스

### 공식 문서
- [PortOne v2 API 문서](https://developers.portone.io/api/rest-v2)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Zustand 상태 관리](https://github.com/pmndrs/zustand)

### 테스트 카드 정보
```
카드번호: 4242-4242-4242-4242
유효기간: 12/25 (미래 날짜 아무거나)
CVC: 123
비밀번호: 11 (2자리 아무거나)
```

### 지원 및 문의
- PortOne 지원: support@portone.io
- Firebase 지원: Firebase Console 내 지원 섹션

---

## 🎉 마무리

이 가이드를 따라하면 Ya-Judge에서 구현한 완전한 결제 시스템을 다른 프로젝트에 성공적으로 이식할 수 있습니다. 

**핵심 포인트:**
1. **모바일 우선**: 모바일 환경을 먼저 고려한 설계
2. **상태 지속성**: 결제 과정에서 데이터 손실 방지
3. **실시간 동기화**: 다중 사용자 환경에서의 상태 관리
4. **개발자 경험**: 테스트 도구와 디버깅 기능

궁금한 점이나 추가 지원이 필요하면 언제든 문의하세요! 🚀

---

**작성일**: 2024년  
**버전**: 1.0  
**상태**: 완료  
**라이센스**: MIT
