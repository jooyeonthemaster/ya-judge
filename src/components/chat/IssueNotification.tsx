import { useState, useEffect } from 'react';
import { Scale, ChevronDown, ChevronUp } from 'lucide-react';

interface IssueNotificationProps {
  issues: string[];
  hasNewIssues: boolean;
}

export default function IssueNotification({ issues, hasNewIssues }: IssueNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Clear the new issues flag when opening
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  if (issues.length === 0) return null;
  
  return (
    <div className={`flex-shrink-0 mt-3 opacity-60 hover:opacity-100 transition-opacity duration-300 bg-white shadow-lg rounded-lg ${isOpen ? 'p-4' : 'p-4 pb-2'} border border-pink-200 mx-2 ${hasNewIssues && !isOpen ? 'border-pink-500 animate-pulse' : ''}`}>
      <div 
        className="flex items-center justify-between cursor-pointer mb-2" 
        onClick={toggleOpen}
      >
        <h3 className={`font-bold ${hasNewIssues && !isOpen ? 'text-pink-600' : 'text-gray-800'} flex items-center`}>
          <Scale className="h-4 w-4 mr-1.5 text-pink-600" />
          {hasNewIssues && !isOpen 
            ? "새로운 쟁점이 제기되었습니다" 
            : `현재 쟁점 목록: ${issues.length}개`}
        </h3>
        {isOpen 
          ? <ChevronUp className="w-4 h-4 text-pink-600" /> 
          : <ChevronDown className="w-4 h-4 text-pink-600" />}
      </div>
      
      {isOpen && (
        <ul className="space-y-2 max-h-[180px] overflow-y-auto">
          {issues.map((issue, index) => (
            <li key={index} className="text-sm bg-pink-50 p-2 rounded-md border border-pink-100 shadow-sm">
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 