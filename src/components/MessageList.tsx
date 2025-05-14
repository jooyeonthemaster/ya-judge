import React from 'react';
import { format } from 'date-fns';
import { Message } from '../lib/gemini';
import { JudgeIntervention } from '../store/chatStore';
import JudgeInterventionComponent from './JudgeIntervention';

interface MessageListProps {
  messages: Message[];
  interventions: JudgeIntervention[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, interventions }) => {
  return (
    <div className="space-y-4">
      {messages.map(message => {
        const isJudge = message.user === 'judge';
        const timestamp = new Date(message.timestamp);
        
        // 판사 메시지인 경우 개입 유형 찾기
        const intervention = isJudge 
          ? interventions.find(i => message.id === i.id) 
          : undefined;
        
        if (isJudge && intervention) {
          // 판사 메시지는 JudgeIntervention 컴포넌트로 렌더링
          return (
            <JudgeInterventionComponent
              key={message.id}
              type={intervention.type}
              message={message.text}
              targetUser={intervention.targetUser}
            />
          );
        }
        
        // 일반 사용자 메시지
        return (
          <div 
            key={message.id}
            className={`message p-4 rounded-lg ${
              isJudge 
                ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                : 'bg-white border border-gray-200'
            }`}
          >
            {/* 메시지 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="font-bold">
                  {message.name}
                  {message.sender && ` → ${message.sender.username.split(' → ')[1]}`}
                </span>
              </div>
              
              <span className="text-xs text-gray-500">
                {format(timestamp, 'HH:mm:ss')}
              </span>
            </div>
            
            {/* 메시지 유형 표시 */}
            {message.messageType && (
              <div className={`inline-block px-2 py-1 rounded text-xs mb-2 ${
                message.messageType === 'evidence' ? 'bg-blue-100 text-blue-700' :
                message.messageType === 'objection' ? 'bg-red-100 text-red-700' :
                message.messageType === 'closing' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {message.messageType === 'evidence' && '증거'}
                {message.messageType === 'objection' && '반론'}
                {message.messageType === 'question' && '질문'}
                {message.messageType === 'closing' && '최종변론'}
                {message.relatedIssue && ` - ${message.relatedIssue}`}
              </div>
            )}
            
            {/* 메시지 내용 */}
            <div 
              className="message-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: message.text }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MessageList; 