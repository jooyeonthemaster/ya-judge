'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, FileBadge, SendHorizonal } from 'lucide-react';

interface EvidenceRequestProps {
  id: string;
  targetUser: string;
  claim: string;
  requestReason: string;
  isMine: boolean;
  onSubmit: (id: string, evidence: string) => void;
}

export const EvidenceRequest = ({
  id,
  targetUser,
  claim,
  requestReason,
  isMine,
  onSubmit
}: EvidenceRequestProps) => {
  const [evidence, setEvidence] = useState("");
  
  const handleSubmit = () => {
    if (!evidence.trim()) return;
    onSubmit(id, evidence);
    setEvidence("");
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg shadow-sm mb-4 ${
        isMine 
          ? 'bg-yellow-50 border border-yellow-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Gavel className={`w-5 h-5 ${isMine ? 'text-yellow-600' : 'text-gray-600'}`} />
        <h3 className={`font-bold ${isMine ? 'text-yellow-800' : 'text-gray-800'}`}>
          {isMine ? '증거 요청 (나에게)' : '증거 요청'}
        </h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">주장:</p>
          <p className="text-gray-800 bg-white p-2 rounded border border-gray-100">{claim}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">이유:</p>
          <p className="text-gray-800 bg-white p-2 rounded border border-gray-100">{requestReason}</p>
        </div>
        
        {isMine && (
          <div className="mt-3 space-y-2">
            <div className="text-sm font-medium text-yellow-700">
              증거 제출:
            </div>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="증거 내용을 입력하세요..."
              className="w-full border border-yellow-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              rows={3}
            />
            
            <button
              onClick={handleSubmit}
              disabled={!evidence.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                evidence.trim()
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors`}
            >
              <FileBadge className="w-4 h-4" />
              <span>증거 제출</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EvidenceRequest;