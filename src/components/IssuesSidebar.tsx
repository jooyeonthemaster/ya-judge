import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, X } from 'lucide-react';

interface IssuesSidebarProps {
  issues: string[];
}

const IssuesSidebar: React.FC<IssuesSidebarProps> = ({ issues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewIssues, setHasNewIssues] = useState(false);
  const [previousIssuesCount, setPreviousIssuesCount] = useState(0);
  
  // Check if new issues have been detected
  useEffect(() => {
    if (issues.length > previousIssuesCount) {
      setHasNewIssues(true);
    }
    setPreviousIssuesCount(issues.length);
  }, [issues, previousIssuesCount]);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      // When closing the sidebar, clear the new issues flag
      setHasNewIssues(false);
    }
  };
  
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={toggleSidebar}
      >
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          {issues.length > 0 ? (
            <h2 className="text-lg font-bold">
              {hasNewIssues && !isOpen 
                ? "새로운 쟁점이 감지되었습니다" 
                : `현재 감지된 쟁점: ${issues.length}개`}
            </h2>
          ) : (
            <h2 className="text-lg font-bold">감지된 쟁점</h2>
          )}
        </div>
        {issues.length > 0 && (
          isOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />
        )}
      </div>
      
      {isOpen && (
        issues.length === 0 ? (
          <div className="text-gray-500 italic p-3 bg-gray-50 rounded-lg">
            아직 감지된 쟁점이 없습니다. 대화를 계속하시면 AI 판사가 쟁점을 분석합니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {issues.map((issue, idx) => (
              <li 
                key={idx} 
                className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-500"
              >
                <div 
                  className="prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ 
                    __html: issue.replace(
                      /\*\*(.*?)\*\*/g, 
                      '<strong class="text-indigo-700">$1</strong>'
                    )
                  }} 
                />
              </li>
            ))}
          </ul>
        )
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>5분 내에 대화를 통해 쟁점들을 해결하세요. 판사는 쟁점을 파악하여 적절히 개입합니다.</p>
      </div>
    </div>
  );
};

export default IssuesSidebar; 