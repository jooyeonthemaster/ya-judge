import { Gavel } from 'lucide-react';
import { JudgeMessageDisplayProps } from '@/types/chat';

export default function JudgeMessageDisplay({ text }: JudgeMessageDisplayProps) {
  // 텍스트 내에서 이모티콘과 다양한 스타일 적용
  const processedText = text
    // 강조할 단어 볼드체와 컬러 강조
    .replace(/(?:판결|결정|중요|증거|책임|잘못)/g, '<span class="font-bold text-red-600">$&</span>')
    // 감정 표현 추가
    .replace(/(?:아니|문제|거짓|틀림)/g, '<span class="font-bold text-red-600">$& 🤦‍♂️</span>')
    .replace(/(?:맞|좋|옳|훌륭)/g, '<span class="font-bold text-green-600">$& 👍</span>')
    .replace(/(?:생각해|고민해|판단해)/g, '$& 🤔')
    // 재미있는 표현 추가
    .replace(/(?:그러나|하지만)/g, '$& 😏')
    .replace(/(?:사실|진실|진짜)/g, '$& 😎')
    .replace(/(?:충격|놀라|믿을 수 없)/g, '$& 😱')
    // 욕설 레벨 관련 표현을 첫 글자만 남기고 X로 대체
    .replace(/(?:씨발|시발|ㅅㅂ|ㅆㅂ|개새끼|ㄱㅐㅅㅐㄲㅣ|병신|ㅂㅅ|미친|ㅁㅊ|존나|ㅈㄴ|지랄)/g, (match) => {
      const firstChar = match.charAt(0);
      const restChars = 'X'.repeat(match.length - 1);
      return `<span class="font-bold text-red-600">${firstChar}${restChars}</span>`;
    })
    .replace(/(?:공격적 언어|공격적 표현|상스러운 표현)/g, '<span class="font-bold text-red-600">$& ⚠️</span>');

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1.5 rounded-md">
              <Gavel className="w-5 h-5 text-white animate-bounce" />
            </div>
            <h3 className="font-bold text-white">판사님의 폭격 💥</h3>
          </div>
          <div className="bg-white/20 px-2 py-1 rounded-md text-xs">
            <span className="animate-pulse">생각 중... 🧠</span>
          </div>
        </div>
      </div>
      <div className="p-5 bg-gradient-to-b from-amber-50 to-white">
        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: processedText }}></div>
        <div className="mt-4 text-right">
          <span className="text-xs text-gray-500 italic">판사님이 현명하신 판단을 내리셨습니다! 🧙‍♂️</span>
        </div>
      </div>
    </div>
  );
} 