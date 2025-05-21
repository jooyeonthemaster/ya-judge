import React from 'react';

interface FormatTimeProps {
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
}

// Export the formatTime function separately for reuse
export const formatTime = (timestamp: string): string => {
  try {
    // 타임스탬프가 없는 경우 빈 문자열 반환
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // 유효하지 않은 날짜인 경우 빈 문자열 반환
    if (isNaN(date.getTime())) return '';
    
    // 모든 시간을 상대적 시간으로 표시
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    // 초 단위 표시 (1분 미만)
    if (diffSecs < 60) return '방금 전';
    
    // 분 단위 표시 (1시간 미만)
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}분 전`;
    
    // 시간 단위 표시 (1일 미만)
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    // 일 단위 표시 (30일 미만)
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;
    
    // 그 이상은 날짜 표시
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('시간 포맷팅 오류:', error);
    return '';
  }
};

const FormatTime: React.FC<FormatTimeProps> = ({ timestamp, className, style }) => {
  return <span className={className} style={style}>{formatTime(timestamp)}</span>;
};

export default FormatTime; 