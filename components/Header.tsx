import React from 'react';

interface HeaderProps {
  onSettingsClick: () => void;
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
}

export const Header: React.FC<HeaderProps> = ({ 
  onSettingsClick, 
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
  finishedCount
}) => {
  const filters = [
    { id: 'all', label: '전체' },
    { id: 'processing', label: '분석중' },
    { id: 'done', label: '완료' },
    { id: 'error', label: '오류' }
  ];

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border bg-surface px-4 py-2 md:px-6 md:py-3 shrink-0 z-30 shadow-sm relative h-14 md:h-16">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Left Menu Toggle */}
        {currentView === 'workspace' && (
            <button 
                onClick={onToggleLeftSidebar}
                className="md:hidden p-1.5 -ml-2 rounded-lg text-text-secondary hover:bg-surface-hover"
            >
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
        )}

        <div className="flex items-center gap-2 md:gap-4 cursor-pointer" onClick={() => currentView === 'settings' && onSettingsClick()}>
            <div className="size-7 md:size-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/30">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">document_scanner</span>
            </div>
            <h2 className="text-text-main text-base md:text-lg font-bold leading-tight tracking-tight hidden xs:block">AI OCR 프로</h2>
        </div>

        {/* Start Analysis Button & Progress Stats */}
        {currentView === 'workspace' && (
            <div className="hidden md:flex items-center gap-3 ml-2">
                {isProcessing ? (
                    <button 
                        onClick={onStopProcess}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm bg-error hover:bg-red-600 text-white shadow-error/20 hover:-translate-y-0.5 animate-pulse-slow"
                    >
                        <span className="material-symbols-outlined text-sm">stop_circle</span>
                        <span>중지</span>
                    </button>
                ) : (
                    <button 
                        onClick={onStartProcess}
                        disabled={!hasItems}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                            hasItems 
                                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:-translate-y-0.5' 
                                : 'bg-surface-subtle text-text-muted cursor-not-allowed border border-border'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        <span>분석 시작</span>
                    </button>
                )}

                {/* Progress Indicator */}
                {isProcessing && progressStats && (
                    <div className="flex items-center gap-2 text-xs font-mono text-text-secondary bg-surface-subtle px-3 py-1.5 rounded-lg border border-border animate-fade-in">
                        <span className="text-primary font-bold">{progressStats.current}/{progressStats.total}</span>
                        <span className="text-text-muted">({progressStats.percentage}%)</span>
                        <div className="w-px h-3 bg-border mx-1"></div>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {elapsedTime}
                        </span>
                    </div>
                )}

                {/* Completion Stats */}
                {!isProcessing && totalDuration && (
                    <div className="flex items-center gap-2 text-xs font-mono text-success-text bg-success-light/30 px-3 py-1.5 rounded-lg border border-success/20 animate-fade-in">
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
            <div className="flex items-center gap-1 bg-surface-subtle rounded-full px-1.5 py-1 border border-border shadow-inner animate-fade-in">
                {filters.map((f) => (
                    <button 
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filter === f.id 
                        ? 'bg-surface shadow-sm text-primary-text font-semibold' 
                        : 'hover:bg-surface/50 text-text-secondary hover:text-text-main'
                    }`}
                    >
                    {f.label}
                    </button>
                ))}
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
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-text-main transition-all shadow-sm"
                    title="설정"
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
                <button 
                    onClick={onImportJSON}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-primary transition-all shadow-sm"
                    title="문서 뷰어"
                >
                    <span className="material-symbols-outlined text-[20px]">description</span>
                </button>
                <button 
                    onClick={onClear}
                    disabled={!hasItems || isProcessing}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-text-main text-sm font-bold leading-normal transition-all shadow-sm disabled:opacity-50"
                >
                    <span>초기화</span>
                </button>
                <button 
                    onClick={onDownloadWord}
                    disabled={!hasFinishedItems} 
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-lg h-9 px-3 bg-surface hover:bg-surface-hover border border-border text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    title="Word 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">file_download</span>
                    <span>Word</span>
                </button>
                <button 
                    onClick={onDownloadMarkdown}
                    disabled={!hasFinishedItems} 
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-lg h-9 px-3 bg-surface hover:bg-surface-hover border border-border text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    title="Markdown 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">markdown</span>
                    <span>MD</span>
                </button>
                <button 
                    onClick={onExport}
                    disabled={!hasFinishedItems}
                    className="flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-lg h-9 px-3 bg-surface hover:bg-surface-hover border border-border text-text-main hover:text-primary text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    title="CSV 저장"
                >
                    <span className="material-symbols-outlined text-sm font-bold">download</span>
                    <span>CSV</span>
                </button>
            </div>

            {/* Mobile Actions (Reduced) */}
            <div className="flex md:hidden gap-1">
                 <button 
                    onClick={onSettingsClick}
                    className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover"
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
                {isProcessing ? (
                    <button 
                        onClick={onStopProcess}
                        className="flex items-center justify-center rounded-lg h-8 px-3 bg-error text-white text-xs font-bold shadow-md"
                    >
                        <span className="material-symbols-outlined text-sm animate-pulse">stop_circle</span>
                    </button>
                ) : (
                    <button 
                        onClick={onStartProcess}
                        disabled={!hasItems}
                        className="flex items-center justify-center rounded-lg h-8 px-3 bg-primary text-white text-xs font-bold shadow-md disabled:opacity-50"
                    >
                        <span>분석</span>
                    </button>
                )}
            </div>

            {/* Mobile Right Info Toggle */}
            <button 
                onClick={onToggleRightSidebar}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover"
            >
                <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
            </div>
        ) : (
            <div className="flex gap-2 animate-fade-in">
                 <button 
                    onClick={onSettingsClick}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-surface hover:bg-surface-hover border border-border text-text-main font-bold text-sm transition-all shadow-sm group"
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