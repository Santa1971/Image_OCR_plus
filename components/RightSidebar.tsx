import React, { useState, useEffect } from 'react';
import { OCRFile } from '../types';

interface RightSidebarProps {
  item: OCRFile | undefined;
  isOpen?: boolean;
  onClose?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ item, isOpen = false, onClose }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (item?.status === 'processing') {
        interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    } else {
        setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [item?.status, item?.id]);

  const getConfidenceColor = (score: number) => {
      if (score >= 90) return 'bg-success text-success-text';
      if (score >= 70) return 'bg-primary text-primary-text';
      if (score >= 50) return 'bg-yellow-500 text-yellow-900';
      return 'bg-error text-error-text';
  };

  const getConfidenceBg = (score: number) => {
      if (score >= 90) return 'bg-success';
      if (score >= 70) return 'bg-primary';
      if (score >= 50) return 'bg-yellow-500';
      return 'bg-error';
  };

  const downloadFile = (content: string, type: 'json' | 'md' | 'doc', filename: string) => {
      let mimeType = 'text/plain';
      let extension = 'txt';
      let dataStr = content;

      if (type === 'json') {
          mimeType = 'application/json';
          extension = 'json';
      } else if (type === 'md') {
          mimeType = 'text/markdown';
          extension = 'md';
      } else if (type === 'doc') {
          mimeType = 'application/vnd.ms-word;charset=utf-8';
          extension = 'doc';
          // Simple HTML wrapper for Word
          dataStr = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${filename}</title></head>
            <body>${content}</body>
            </html>`;
      }

      const blob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleDownload = (type: 'json' | 'md' | 'doc') => {
      if (!item) return;
      const baseName = item.file.name.replace(/\.[^/.]+$/, "");
      const pub = item.metadata?.public_doc;
      
      if (type === 'json') {
          const exportData = {
              filename: item.file.name,
              summary: item.summary,
              text: item.textCorrected || item.textGemini,
              keywords: item.keywords,
              metadata: item.metadata,
              studioResults: item.studioResults
          };
          downloadFile(JSON.stringify(exportData, null, 2), 'json', baseName);
      } else if (type === 'md') {
          let mdContent = `# ${baseName}\n\n`;
          
          if (pub && Object.values(pub).some(v => v)) {
              mdContent += `## 공공기관 문서 정보\n`;
              mdContent += `| 항목 | 내용 |\n|---|---|\n`;
              if (pub.doc_number) mdContent += `| 문서번호 | ${pub.doc_number} |\n`;
              if (pub.date) mdContent += `| 생산일자 | ${pub.date} |\n`;
              if (pub.sender) mdContent += `| 발신 | ${pub.sender} |\n`;
              if (pub.receiver) mdContent += `| 수신 | ${pub.receiver} |\n`;
              mdContent += `\n`;
          }

          mdContent += `## 요약\n${item.summary}\n\n## 분석 내용\n${item.textCorrected || item.textGemini}\n\n## 키워드\n${item.keywords?.join(', ')}`;
          downloadFile(mdContent, 'md', baseName);
      } else if (type === 'doc') {
          // Public Doc Table HTML
          let pubDocHtml = "";
          if (pub && Object.values(pub).some(v => v)) {
              pubDocHtml = `
              <h3>[공공기관 문서 정보]</h3>
              <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse:collapse;">
                  <tr><th bgcolor="#f0f0f0">문서번호</th><td>${pub.doc_number || "-"}</td><th bgcolor="#f0f0f0">생산일자</th><td>${pub.date || "-"}</td></tr>
                  <tr><th bgcolor="#f0f0f0">발신</th><td>${pub.sender || "-"}</td><th bgcolor="#f0f0f0">수신</th><td>${pub.receiver || "-"}</td></tr>
              </table>
              <br/>
              `;
          }

          const htmlContent = `
            <h1>${baseName}</h1>
            ${pubDocHtml}
            <h3>[요약]</h3><p>${item.summary}</p>
            <h3>[분석 내용]</h3><p>${(item.textCorrected || item.textGemini).replace(/\n/g, '<br>')}</p>
            <h3>[키워드]</h3><p>${item.keywords?.join(', ')}</p>
          `;
          downloadFile(htmlContent, 'doc', baseName);
      }
  };

  return (
    <>
        {/* Mobile Overlay Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        ></div>

        {/* Sidebar Container */}
        <aside 
            className={`
                fixed top-0 bottom-0 right-0 w-80 bg-surface border-l border-border flex flex-col shrink-0 z-50 overflow-y-auto shadow-2xl transition-transform duration-300
                md:relative md:translate-x-0 md:shadow-[-5px_0_20px_rgba(0,0,0,0.02)] md:z-20 md:h-full
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface/90 sticky top-0 z-10 backdrop-blur-md">
                <h3 className="text-text-main font-bold text-sm uppercase tracking-wide">분석 리포트</h3>
                <button onClick={onClose} className="md:hidden text-text-secondary p-1">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            {!item || item.status === 'idle' ? (
                <div className="p-5 text-center mt-10 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">analytics</span>
                    <p className="text-xs">분석 결과가 여기에 표시됩니다.</p>
                </div>
            ) : item.status === 'processing' ? (
                <div className="p-5 text-center mt-10">
                    <div className="relative inline-block">
                        <span className="material-symbols-outlined text-4xl mb-2 text-primary animate-spin">smart_toy</span>
                    </div>
                    <p className="text-sm font-bold text-text-main">AI 분석 중...</p>
                    <p className="text-xs text-text-muted mt-1 mb-2">
                        {item.mediaType === 'image' ? '이미지 및 텍스트 분석' : item.mediaType === 'audio' ? '음성 인식 및 요약' : '영상 프레임 분석'} 중
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border rounded-full text-xs font-mono text-primary font-bold">
                        <span className="material-symbols-outlined text-sm">timer</span>
                        <span>{elapsed}s</span>
                    </div>
                </div>
            ) : item.status === 'error' ? (
                <div className="p-5 text-center mt-10">
                    <span className="material-symbols-outlined text-4xl mb-2 text-error">error</span>
                    <p className="text-sm font-bold text-error">분석 실패</p>
                    <p className="text-xs text-text-muted mt-2 p-2 bg-surface-hover rounded text-left break-words whitespace-pre-wrap">{item.errorMsg}</p>
                </div>
            ) : (
                <>
                    {/* Export / Download Section (Moved to Top) */}
                    <div className="p-5 pb-0">
                        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-text-secondary mb-3 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">download</span> 리포트 저장
                            </h4>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDownload('json')}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border border-border hover:bg-surface-hover hover:border-primary/50 transition-all text-text-main hover:text-primary"
                                >
                                    <span className="material-symbols-outlined text-xl">data_object</span>
                                    <span className="text-[10px] font-bold">JSON</span>
                                </button>
                                <button 
                                    onClick={() => handleDownload('md')}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border border-border hover:bg-surface-hover hover:border-primary/50 transition-all text-text-main hover:text-primary"
                                >
                                    <span className="material-symbols-outlined text-xl">markdown</span>
                                    <span className="text-[10px] font-bold">Markdown</span>
                                </button>
                                <button 
                                    onClick={() => handleDownload('doc')}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border border-border hover:bg-surface-hover hover:border-primary/50 transition-all text-text-main hover:text-primary"
                                >
                                    <span className="material-symbols-outlined text-xl">description</span>
                                    <span className="text-[10px] font-bold">Word</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Summary */}
                    <div className="p-5 border-b border-border bg-surface-subtle/30">
                        <div className="flex justify-between text-[10px] text-text-muted mb-2 font-mono uppercase font-semibold">
                        <span>핵심 요약</span>
                        </div>
                        <div className="bg-surface p-3 rounded-lg border border-border shadow-sm text-xs leading-relaxed text-text-main font-medium">
                            {item.summary || "요약 내용이 없습니다."}
                        </div>
                        
                        {/* Accuracy & Confidence Section */}
                        {(item.metadata?.accuracy || item.metadata?.confidence !== undefined) && (
                            <div className="mt-3 bg-surface p-3 rounded-lg border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-blue-600">verified</span>
                                        <span className="text-[10px] font-bold text-text-secondary uppercase">분석 정확도</span>
                                    </div>
                                    {item.metadata.confidence !== undefined && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getConfidenceColor(item.metadata.confidence)} bg-opacity-20`}>
                                            {item.metadata.confidence}점
                                        </span>
                                    )}
                                </div>
                                
                                {/* Confidence Bar */}
                                {item.metadata.confidence !== undefined && (
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${getConfidenceBg(item.metadata.confidence)}`} 
                                            style={{ width: `${item.metadata.confidence}%` }}
                                        ></div>
                                    </div>
                                )}

                                {item.metadata.accuracy && (
                                    <p className="text-xs text-text-main leading-relaxed pt-1 border-t border-border/50 mt-1">
                                        {item.metadata.accuracy}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Public Document Info */}
                    {item.metadata?.public_doc && Object.keys(item.metadata.public_doc).length > 0 && Object.values(item.metadata.public_doc).some(v => v) && (
                        <div className="px-5 py-4 border-b border-border">
                            <h4 className="text-xs font-bold text-text-secondary mb-3 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">article</span> 공공기관 문서 정보
                            </h4>
                            <div className="flex flex-col gap-2">
                                {item.metadata.public_doc.doc_number && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-text-muted font-bold">문서번호</span>
                                        <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded">{item.metadata.public_doc.doc_number}</span>
                                    </div>
                                )}
                                {item.metadata.public_doc.title && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-text-muted font-bold">제목</span>
                                        <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded font-medium">{item.metadata.public_doc.title}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    {item.metadata.public_doc.sender && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-text-muted font-bold">발신</span>
                                            <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded">{item.metadata.public_doc.sender}</span>
                                        </div>
                                    )}
                                    {item.metadata.public_doc.receiver && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-text-muted font-bold">수신</span>
                                            <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded">{item.metadata.public_doc.receiver}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {item.metadata.public_doc.department && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-text-muted font-bold">생산부서</span>
                                            <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded">{item.metadata.public_doc.department}</span>
                                        </div>
                                    )}
                                    {item.metadata.public_doc.date && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-text-muted font-bold">생산일자</span>
                                            <span className="text-xs text-text-main bg-surface border border-border p-1.5 rounded">{item.metadata.public_doc.date}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Colors (Images only) */}
                    {item.metadata?.colors && item.metadata.colors.length > 0 && (
                        <div className="px-5 py-4 border-b border-border">
                            <h4 className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">palette</span> 주요 색상
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                                {item.metadata.colors.map((color, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="size-8 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }}></div>
                                        <span className="text-[9px] font-mono text-text-muted">{color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col p-4 gap-3 pb-20">
                        {/* Keywords */}
                        <details className="flex flex-col rounded-xl bg-surface border border-border shadow-sm group overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 select-none bg-surface hover:bg-surface-hover transition-colors">
                                <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-secondary text-lg">sell</span>
                                <p className="text-text-main text-xs font-bold leading-normal">키워드 / 태그</p>
                                </div>
                                <span className="material-symbols-outlined text-text-muted group-open:rotate-180 transition-transform text-lg">expand_more</span>
                            </summary>
                            <div className="px-4 pb-5 pt-2 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {item.keywords?.map((k, i) => (
                                        <span key={i} className="text-[10px] font-bold text-primary-text bg-primary-light px-2 py-1 rounded-md border border-primary/10">
                                            #{k}
                                        </span>
                                    ))}
                                    {item.metadata?.objects?.map((obj, i) => (
                                        <span key={`obj-${i}`} className="text-[10px] font-bold text-text-secondary bg-surface-subtle px-2 py-1 rounded-md border border-border">
                                            {obj}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </details>

                        {/* Location Info */}
                        {item.metadata?.location && (
                            <div className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3">
                                <div className="bg-red-50 p-1.5 rounded-full text-red-500 shrink-0">
                                    <span className="material-symbols-outlined text-lg">place</span>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-text-muted uppercase">장소 정보</h4>
                                    <p className="text-xs text-text-main font-medium mt-0.5">{item.metadata.location}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </aside>
    </>
  );
};