import React from 'react';
import { 
  Gavel, 
  AlertTriangle, 
  Shield, 
  FileSearch, 
  FileText, 
  Scale 
} from 'lucide-react';
import { InterventionType } from '../lib/gemini';

interface JudgeInterventionProps {
  type: InterventionType;
  message: string;
  targetUser?: string;
}

const JudgeIntervention: React.FC<JudgeInterventionProps> = ({
  type,
  message,
  targetUser
}) => {
  // 개입 유형별 스타일 및 아이콘 정의
  const getInterventionStyle = () => {
    switch(type) {
      case 'issue':
        return {
          icon: <Gavel className="w-5 h-5" />,
          title: '쟁점 파악',
          color: 'bg-amber-100 border-amber-500 text-amber-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: '경고',
          color: 'bg-red-100 border-red-500 text-red-700'
        };
      case 'regulation':
        return {
          icon: <Shield className="w-5 h-5" />,
          title: '규제',
          color: 'bg-purple-100 border-purple-500 text-purple-700'
        };
      case 'evidence':
        return {
          icon: <FileSearch className="w-5 h-5" />,
          title: '증거 요청',
          color: 'bg-blue-100 border-blue-500 text-blue-700'
        };
      case 'summary':
        return {
          icon: <FileText className="w-5 h-5" />,
          title: '요약',
          color: 'bg-green-100 border-green-500 text-green-700'
        };
      case 'verdict':
        return {
          icon: <Scale className="w-5 h-5" />,
          title: '판결',
          color: 'bg-indigo-100 border-indigo-500 text-indigo-700'
        };
      default:
        return {
          icon: <Gavel className="w-5 h-5" />,
          title: '판사',
          color: 'bg-gray-100 border-gray-500 text-gray-700'
        };
    }
  };

  const style = getInterventionStyle();

  return (
    <div className={`p-4 rounded-lg border-l-4 ${style.color} mb-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {style.icon}
          <span className="font-bold ml-2">
            {style.title}
            {targetUser && ` (${targetUser})`}
          </span>
        </div>
      </div>

      <div
        className="message-content prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
};

export default JudgeIntervention; 