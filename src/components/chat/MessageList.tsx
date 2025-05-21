import { MessageListProps, Message } from '@/types/chat';
import { ProfileInitial } from '@/components/chat/ProfileInitial';
import JudgeMessageDisplay from './JudgeMessageDisplay';
import CurseLevelBadge from './CurseLevelBadge';
import FormatTime from './FormatTime';
import { 
  CheckCircle2, 
  Gavel, 
  AlertTriangle, 
  Scale, 
  HelpCircle 
} from 'lucide-react';

export default function MessageList({
  messages,
  username,
  messagesEndRef,
  getUserCurseLevel,
  hasFinalVerdict,
  lastVerdictIndex
}: MessageListProps) {
  
  // Filter messages if we have a final verdict
  const filteredMessages = messages.filter((message, index) => {
    // If we found a verdict message:
    if (hasFinalVerdict) {
      // 1. Filter out any analysis messages that come after the verdict
      if (index > lastVerdictIndex && 
          message.user === 'system' && message.text.includes('판사가 상황을 분석 중입니다')) {
        return false;
      }
      
      // 2. Filter out any other judge messages that are not the final verdict
      // EXCEPT keep judge messages about cursing/aggressive language
      if (message.user === 'judge' && 
          !message.text.includes('최종 판결') && 
          !message.text.includes('공격적인 언어') && 
          !message.text.includes('욕설') && 
          !message.text.includes('부적절한 표현') && 
          index !== lastVerdictIndex) {
        return false;
      }
    }
    return true;
  });

  // If no messages, render empty state
  if (filteredMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <Gavel className="w-12 h-12 text-pink-300" />
        <p className="text-gray-400 text-center">
          아직 대화 내용이 없습니다.<br/>재판이 시작되면 여기에 대화 내용이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {filteredMessages.map((message, index) => {
        const isMine = message.sender?.username === username;
        const userId = message.sender?.id || '';
        const curseLevel = userId ? getUserCurseLevel(userId) : 0;
        const isSystemMessage = message.user === 'system';
        const isJudgeMessage = message.user === 'judge';
        
        return (
          <div 
            key={message.id || index} 
            className={`flex ${
              isJudgeMessage
                ? 'flex-col items-center'
                : isMine 
                  ? 'justify-end' 
                  : 'justify-start'
            }`}
          >
            {/* 판사 메시지 구분선 시작 */}
            {isJudgeMessage && (
              <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto my-4" />
            )}
            
            {/* 프로필 이미지 표시 조건 수정 */}
            {(isJudgeMessage || (!isMine && !isSystemMessage)) && (
              <div className={isJudgeMessage ? 'mb-2' : ''}>
                <ProfileInitial name={message.name} isMine={false} />
              </div>
            )}
            
            {/* 메시지 컨텐츠 컨테이너 */}
            <div className={`mx-2 ${
              isJudgeMessage
                ? 'max-w-[90%] w-full transform transition-all duration-300 hover:scale-[1.01]'
                : 'max-w-[80%]'
            } ${isMine ? 'order-1' : 'order-2'}`}>
              {/* 메시지 정보 (이름, 시간) 중앙 정렬 */}
              {!isSystemMessage && (
                <div className={`flex items-center mb-1 ${isJudgeMessage ? 'justify-center' : ''}`}>
                  <span className={`text-sm font-medium ${
                    isJudgeMessage 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800' 
                      : isMine 
                        ? 'text-pink-700' 
                        : 'text-purple-700'
                  }`}>
                    {isJudgeMessage ? (
                      <span className="flex items-center justify-center">
                        <Gavel className="w-4 h-4 mr-1.5 text-amber-600" />
                        {message.name}
                      </span>
                    ) : (
                      message.name
                    )}
                  </span>
                  {message.timestamp && (
                    <FormatTime 
                      timestamp={message.timestamp.toString()} 
                      className="text-xs text-gray-500 ml-2" 
                    />
                  )}
                  {curseLevel > 0 && !isJudgeMessage && !isSystemMessage && (
                    <CurseLevelBadge level={curseLevel} />
                  )}
                </div>
              )}
              
              {/* 메시지 말풍선 스타일 강화 */}
              <div
                className={`rounded-lg px-4 py-2.5 shadow-sm ${
                  isSystemMessage 
                    ? 'bg-gray-100 text-gray-800 text-sm mx-auto max-w-md border border-gray-200' 
                    : isJudgeMessage
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-gray-800'
                      : isMine
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200 text-gray-800'
                        : 'bg-white border border-gray-200 text-gray-800'
                }`}
                style={isJudgeMessage ? {
                  boxShadow: '0 4px 6px rgba(251, 191, 36, 0.05), 0 1px 3px rgba(251, 191, 36, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
                } : {}}
              >
                {isSystemMessage ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-gray-600" />
                    <span>{message.text}</span>
                  </div>
                ) : isJudgeMessage ? (
                  <div>
                    <JudgeMessageDisplay text={message.text} />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                )}
                
                {/* 메시지 타입 표시 중앙 정렬 */}
                {message.messageType && message.messageType !== 'normal' && (
                  <div className={`mt-1 flex items-center ${isJudgeMessage ? 'justify-center' : 'justify-end'}`}>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      message.messageType === 'evidence' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : message.messageType === 'objection'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : message.messageType === 'closing'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {message.messageType === 'evidence' && <Scale className="w-3 h-3 mr-1 inline" />}
                      {message.messageType === 'objection' && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                      {message.messageType === 'closing' && <Gavel className="w-3 h-3 mr-1 inline" />}
                      {message.messageType === 'question' && <HelpCircle className="w-3 h-3 mr-1 inline" />}
                      {message.messageType === 'evidence' && '증거'}
                      {message.messageType === 'objection' && '반론'}
                      {message.messageType === 'closing' && '최종변론'}
                      {message.messageType === 'question' && '질문'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* 관련 쟁점 표시 */}
              {message.relatedIssue && (
                <div className="mt-1 ml-1">
                  <span className="text-xs flex items-center text-pink-600">
                    <Scale className="w-3 h-3 mr-1" /> 
                    관련 쟁점: {message.relatedIssue}
                  </span>
                </div>
              )}
            </div>
            
            {/* 내 프로필 이미지 */}
            {isMine && !isSystemMessage && !isJudgeMessage && (
              <div className="order-2">
                <ProfileInitial name={message.name || '익명'} isMine={true} />
              </div>
            )}
            
            {/* 판사 메시지 구분선 끝 */}
            {isJudgeMessage && (
              <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto my-4" />
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 