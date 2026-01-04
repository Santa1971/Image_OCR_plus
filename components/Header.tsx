import React from 'react';

interface HeaderProps {
  onSettingsClick: () => void;
  onLogoClick?: () => void;
  onClear: () => void;
  onExport: () => void;
  onStartProcess: () => void;
  onStopProcess?: () => void;
  onImportJSON?: () => void; 
  onDownloadWord?: () => void;
  onDownloadMarkdown?: () => void;
  isProcessing: boolean;
  hasItems: boolean;
  hasFinishedItems: boolean;
  filter: string;
  setFilter: (filter: string) => void;
  currentView: 'workspace' | 'settings';
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  
  // Progress Props
  progressStats?: { current: number; total: number; percentage: number };
  elapsedTime?: string;
  totalDuration?: string;
  finishedCount?: number;
  
  // Usage
  apiUsage?: { used: number; limit: number };
}

export const Header: React.FC<HeaderProps> = ({ 
  onSettingsClick, 
  onLogoClick,
  onClear, 
  onExport, 
  onStartProcess,
  onStopProcess,
  onImportJSON,
  onDownloadWord,
  onDownloadMarkdown,
  isProcessing,
  hasItems,
  hasFinishedItems,
  filter,
  setFilter,
  currentView,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  progressStats,
  elapsedTime,
  totalDuration,
  finishedCount,
  apiUsage
}) => {
  const filters = [
    { id: 'all', label: '전체' },
    { id: 'processing', label: '분석중' },
    { id: 'done', label: '완료' },
    { id: 'error', label: '오류' }
  ];

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/40 bg-surface/80 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 shrink-0 z-30 shadow-sm relative h-14 md:h-16 transition-all">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Left Menu Toggle */}
        {currentView === 'workspace' && (
            <button 
                onClick={onToggleLeftSidebar}
                className="md:hidden p-2 -ml-2 rounded-xl text-text-secondary hover:bg-white/50 transition-colors"
            >
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
        )}

        <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
            <div className="size-8 md:size-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
            <h2 className="text-text-main text-lg font-extrabold leading-tight tracking-tight hidden xs:block">AI OCR 프로</h2>
        </div>

        {/* Start Analysis Button & Progress Stats */}
        {currentView === 'workspace' && (
            <div className="hidden md:flex items-center gap-3 ml-4">
                {isProcessing ? (
                    <button 
                        onClick={onStopProcess}
                        className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md bg-error hover:bg-red-600 text-white shadow-error/30 hover:-translate-y-0.5 animate-pulse-slow ring-2 ring-white"
                    >
                        <span className="material-symbols-outlined text-sm">stop_circle</span>
                        <span>중지</span>
                    </button>
                ) : (
                    <button 
                        onClick={onStartProcess}
                        disabled={!hasItems}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md ring-2 ring-white ${
                            hasItems 
                                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/30 hover:-translate-y-0.5' 
                                : 'bg-gray-100 text-text-muted cursor-not-allowed border border-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        <span>분석 시작</span>
                    </button>
                )}

                {/* Progress Indicator */}
                {isProcessing && progressStats && (
                    <div className="flex items-center gap-2 text-xs font-mono text-text-secondary bg-white/60 px-3 py-1.5 rounded-lg border border-white/50 shadow-sm animate-fade-in">
                        <span className="text-primary font-bold">{progressStats.current}/{progressStats.total}</span>
                        <span className="text-text-muted">({progressStats.percentage}%)</span>
                        <div className="w-px h-3 bg-gray-300 mx-1"></div>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {elapsedTime}
                        </span>
                    </div>
                )}

                {/* Completion Stats */}
                {!isProcessing && totalDuration && (
                    <div className="flex items-center gap-2 text-xs font-mono text-success-text bg-success-light/50 px-3 py-1.5 rounded-lg border border-success/20 shadow-sm animate-fade-in">
                        <span className="font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            완료
                        </span>
                        {finishedCount !== undefined && (
                            <>
                                <span className="font-bold">{finishedCount}개 파일</span>
                                <div className="w-px h-3 bg-success/20 mx-1"></div>
                            </>
                        )}
                        <span>소요시간: {totalDuration}</span>
                    </div>
                )}
            </div>
        )}
      </div>
      
      {/* Middle Navigation - Only visible in Workspace Desktop */}
      <div className="hidden md:flex flex-1 justify-center items-center gap-4">
        {currentView === 'workspace' && (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-full px-1.5 py-1 border border-white/60 shadow-inner animate-fade-in">
                    {filters.map((f) => (
                        <button 
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            filter === f.id 
                            ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' 
                            : 'hover:bg-white/50 text-text-secondary hover:text-text-main'
                        }`}
                        >
                        {f.label}
                        </button>
                    ))}
                </div>
                
                {/* API Usage Indicator */}
                {apiUsage && (
                    <div className="flex items-center gap-2 text-[10px] font-bold bg-black/30 px-3 py-1.5 rounded-full border border-white/10 shadow-sm whitespace-nowrap" title="일일 API 사용량 (추정치)">
                        <div className="flex flex-col items-end leading-none gap-0.5">
                            <span className="text-white">사용: {apiUsage.used}</span>
                            <span className="text-gray-400">잔여: {Math.max(0, apiUsage.limit - apiUsage.used)}</span>
                        </div>
                        <div className="h-6 w-1 bg-white/20 rounded-full relative overflow-hidden">
                             <div 
                                className={`absolute bottom-0 w-full transition-all duration-500 ${
                                    (apiUsage.used / apiUsage.limit) > 0.9 ? 'bg-error' : (apiUsage.used / apiUsage.limit) > 0.7 ? 'bg-yellow-400' : 'bg-success'
                                }`} 
                                style={{ height: `${Math.min(100, (apiUsage.used / apiUsage.limit) * 100)}%` }}
                             ></div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
        {currentView === 'workspace' ? (
            <div className="flex gap-1 md:gap-2 animate-fade-in">
            {/* Desktop Actions */}
            <div className="hidden md:flex gap-2">
                <button 
                    onClick={onSettingsClick}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-3 bg-white/50 hover:bg-white border border-white/60 text-text-secondary hover:text-text-main transition-all shadow-sm hover:shadow-md"
                    title="설정"
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
                <button 
                    onClick={onImportJSON}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-3 bg-white/50 hover:bg-white border border-white/60 text-text-secondary hover:text-primary transition-all shadow-sm hover:shadow-md"
                    title="문서 뷰어"
                >
                    <span className="material-symbols-outlined text-[20px]">description</span>
                </button>
                <button 
                    onClick={onClear}
                    disabled={!hasItems || isProcessing}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-white/50 hover:bg-white border border-white/60 text-text-secondary hover:text-error text-sm font-bold leading-normal transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    <span>초기화</span>
                </button>
                <div className="w-px h-8 bg-border/50 mx-1 self-center"></div>
                <button 
                    onClick={onDownloadWord}
                    disabled={!hasFinishedItems} 
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl h-10 px-3 bg-white/50 hover:bg-white border border-white/60 text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    title="Word 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">file_download</span>
                    <span>Word</span>
                </button>
                <button 
                    onClick={onDownloadMarkdown}
                    disabled={!hasFinishedItems} 
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl h-10 px-3 bg-white/50 hover:bg-white border border-white/60 text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    title="Markdown 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">markdown</span>
                    <span>MD</span>
                </button>
                <button 
                    onClick={onExport}
                    disabled={!hasFinishedItems}
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl h-10 px-3 bg-white/50 hover:bg-white border border-white/60 text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    title="CSV 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">download</span>
                    <span>CSV</span>
                </button>
            </div>

            {/* Mobile Actions (Reduced) */}
            <div className="flex md:hidden gap-2">
                 <button 
                    onClick={onSettingsClick}
                    className="p-2 rounded-xl text-text-secondary hover:bg-white/50 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">settings</span>
                </button>
                {isProcessing ? (
                    <button 
                        onClick={onStopProcess}
                        className="flex items-center justify-center rounded-xl h-9 px-4 bg-error text-white text-xs font-bold shadow-md"
                    >
                        <span className="material-symbols-outlined text-lg animate-pulse">stop_circle</span>
                    </button>
                ) : (
                    <button 
                        onClick={onStartProcess}
                        disabled={!hasItems}
                        className="flex items-center justify-center rounded-xl h-9 px-4 bg-primary text-white text-xs font-bold shadow-md disabled:opacity-50"
                    >
                        <span>분석</span>
                    </button>
                )}
            </div>

            {/* Mobile Right Info Toggle */}
            <button 
                onClick={onToggleRightSidebar}
                className="md:hidden p-2 rounded-xl text-text-secondary hover:bg-white/50 transition-colors"
            >
                <span className="material-symbols-outlined text-[24px]">info</span>
            </button>
            </div>
        ) : (
            <div className="flex gap-2 animate-fade-in">
                 <button 
                    onClick={onSettingsClick}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-white hover:bg-gray-50 border border-white/60 text-text-main font-bold text-sm transition-all shadow-sm group"
                >
                    <span className="material-symbols-outlined text-[18px] mr-0 md:mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    <span className="hidden md:inline">워크스페이스로 돌아가기</span>
                </button>
            </div>
        )}
      </div>
    </header>
  );
};