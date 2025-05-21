interface TypingUser {
  username: string;
  isTyping: boolean;
}

interface TypingIndicatorProps {
  typingUsers: Record<string, TypingUser>;
  currentUsername: string;
}

export default function TypingIndicator({ typingUsers, currentUsername }: TypingIndicatorProps) {
  const typingUsersList = Object.values(typingUsers)
    .filter(user => user.isTyping && user.username !== currentUsername);
  
  if (typingUsersList.length === 0) return null;
  
  return (
    <div className="flex items-center space-x-2 ml-12 mt-1">
      <div className="bg-pink-100 rounded-lg px-3 py-1.5 shadow-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
      <span className="text-xs text-pink-500">
        {typingUsersList.map(user => user.username).join(', ')} 변론 작성 중...
      </span>
    </div>
  );
} 