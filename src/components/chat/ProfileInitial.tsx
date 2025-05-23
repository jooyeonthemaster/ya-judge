import { ProfileInitialProps } from '@/types/chat';

export function ProfileInitial({ name, isMine, isWarning }: ProfileInitialProps) {
  const initial = name.charAt(0).toUpperCase();
  
  // 판사인 경우 이미지 사용
  if (name === '판사') {
    const imageSrc = isWarning ? '/images/angryjudge.png' : '/images/judge.png';
    const altText = isWarning ? '화난 판사' : '판사';
    
    return (
      <img 
        src={imageSrc}
        alt={altText}
        className="w-20 h-20 object-contain"
      />
    );
  }
  
  return (
    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-base font-medium ${
      isMine ? 'bg-indigo-400 text-white' : 'bg-gray-300 text-gray-700'
    }`}>
      {initial}
    </div>
  );
} 