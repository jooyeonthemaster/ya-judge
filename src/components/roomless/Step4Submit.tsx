'use client';

import { motion } from 'framer-motion';
import { Send, Check, AlertTriangle, Clock, FileText, Heart, Settings, User } from 'lucide-react';

interface Step4SubmitProps {
  formData: {
    title: string;
    description: string;
    plaintiff: string;
    defendant: string;
    relationship: string;
    duration: string;
    category: string;
    tags: string[];
    intensity: string;
    character: string;
  };
  isSubmitting: boolean;
  onSubmit: () => void;
  onPrevious: () => void;
}

export default function Step4Submit({ formData, isSubmitting, onSubmit, onPrevious }: Step4SubmitProps) {
  const summaryItems = [
    {
      icon: FileText,
      title: '갈등 상황',
      content: formData.title,
      detail: formData.description.length > 100 ? formData.description.substring(0, 100) + '...' : formData.description,
      color: 'from-pink-500 to-purple-600'
    },
    {
      icon: Heart,
      title: '관계 정보',
      content: `${formData.plaintiff} ↔ ${formData.defendant}`,
      detail: `${formData.relationship} · ${formData.duration || '기간 미입력'}`,
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Settings,
      title: '판결 옵션',
      content: `${formData.intensity} · ${formData.character}`,
      detail: formData.category ? `카테고리: ${formData.category}` : '카테고리 미선택',
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
        >
          <Send className="w-10 h-10 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
            재판 청구서 제출
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            입력하신 내용을 확인하고 제출해주세요.<br/>
            <span className="text-emerald-600 font-semibold">AI 판사가 공정하게 심리하겠습니다!</span>
          </p>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="space-y-4">
        {summaryItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-800 font-semibold mb-1">{item.content}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* 태그 정보 */}
        {formData.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200"
          >
            <h3 className="text-lg font-bold text-indigo-900 mb-3">키워드 태그</h3>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 주의사항 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">제출 전 확인사항</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 입력하신 모든 정보는 익명으로 처리됩니다</li>
              <li>• AI 판사의 판결은 참고용이며, 법적 효력은 없습니다</li>
              <li>• 판결 결과는 약 30초 내에 확인할 수 있습니다</li>
              <li>• 제출 후에는 내용을 수정할 수 없습니다</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* 예상 소요 시간 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <Clock className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-semibold">예상 판결 시간: 30초 내외</span>
        </div>
      </motion.div>

      {/* 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex justify-between pt-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPrevious}
          disabled={isSubmitting}
          className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
            isSubmitting 
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          ← 이전
        </motion.button>
        <motion.button
          whileHover={!isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`px-8 py-4 rounded-xl font-bold text-white transition-all duration-200 shadow-lg flex items-center space-x-2 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl'
          }`}
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>판결 진행 중...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>재판 청구서 제출하기</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 