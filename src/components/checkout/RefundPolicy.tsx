import { Info } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center space-x-2 mb-3">
        <Info className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-500 tracking-wide uppercase">
          환불규정
        </h2>
      </div>
      <div className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
        <p>• 결제 후 <strong className="text-gray-700">10일 이내</strong> 환불 신청이 가능합니다.</p>
        <p>• 환불 문의: <strong className="text-gray-700">nadr110619@gmail.com</strong></p>
        <p>• 환불 처리는 영업일 기준 3-5일 소요됩니다.</p>
        <p>• 환불 신청 시 환불 사유를 명시해 주세요.</p>
      </div>
    </div>
  );
}
