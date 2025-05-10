'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, MessageSquare } from 'lucide-react';

interface IssuesListProps {
  issues: string[];
  currentIssueIndex: number;
  onSelectIssue: (index: number) => void;
  isDiscussionStage: boolean;
}

export const IssuesList = ({
  issues,
  currentIssueIndex,
  onSelectIssue,
  isDiscussionStage
}: IssuesListProps) => {
  if (!issues.length) return null;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        <span className="font-medium text-gray-700">쟁점 목록</span>
      </div>
      
      <div className="space-y-2">
        {issues.map((issue, index) => (
          <motion.button
            key={index}
            onClick={() => isDiscussionStage && onSelectIssue(index)}
            className={`w-full text-left p-2 rounded-md flex items-start gap-2 transition-colors ${
              currentIssueIndex === index
                ? 'bg-indigo-50 border-l-4 border-indigo-500'
                : 'bg-gray-50 hover:bg-gray-100'
            } ${!isDiscussionStage && 'cursor-default'}`}
            whileHover={isDiscussionStage ? { scale: 1.01 } : {}}
            whileTap={isDiscussionStage ? { scale: 0.99 } : {}}
          >
            <div className="mt-0.5">
              {index < currentIssueIndex ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : currentIssueIndex === index ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Circle className="w-4 h-4 text-indigo-500 fill-indigo-100" />
                </motion.div>
              ) : (
                <Circle className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              currentIssueIndex === index
                ? 'text-indigo-700 font-medium'
                : index < currentIssueIndex
                  ? 'text-gray-500'
                  : 'text-gray-700'
            }`}>
              {issue}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default IssuesList;