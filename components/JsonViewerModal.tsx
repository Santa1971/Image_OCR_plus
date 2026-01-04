import React, { useState, useEffect, useRef } from 'react';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  fileName: string;
  onUploadClick?: () => void;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ isOpen, onClose, data, fileName, onUploadClick }) => {
  const [localData, setLocalData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'document' | 'raw' | 'paste'>('document');
  const [pasteInput, setPasteInput] = useState('');
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
        setLocalData(data);
        setViewMode('document');
    } else {
        setLocalData(null);
        setViewMode('paste');
    }
  }, [data, isOpen]);

  if (!isOpen) return null;

  // --- Safe Data Extractors ---
  
  const getTitle = (): string => {
      try {
          if (localData?.metadata?.public_doc?.title) return String(localData.metadata.public_doc.title);
          if (localData?.metadata?.title) return String(localData.metadata.title);
          if (fileName) return fileName.replace(/\.[^/.]+$/, "");
          return "새 문서";
      } catch (e) {
          return "문서";
      }
  };

  const getContent = (): string => {
      try {
          if (!localData) return "";
          if (typeof localData === 'string') return localData;
          
          // Prioritize specific text fields
          const textFields = ['textCorrected', 'correctedText', 'extractedText', 'textGemini'];
          for (const field of textFields) {
              if (localData[field] && typeof localData[field] === 'string') {
                  return localData[field];
              }
          }
          
          // Fallback: Check if it looks like the initial wrapper object
          if (typeof localData === 'object') {
              return JSON.stringify(localData, null, 2);
          }
          return String(localData);
      } catch (e) {
          console.error("Content extraction error", e);
          return "";
      }
  };

  const getSummary = (): string => {
      return localData?.summary && typeof localData.summary === 'string' ? localData.summary : "";
  };

  const getKeywords = (): string[] => {
      return Array.isArray(localData?.keywords) ? localData.keywords.map(String) : [];
  };

  const getMetadata = () => localData?.metadata || {};
  const metadata = getMetadata();
  const publicDoc = metadata.public_doc || {};

  // --- Actions ---

  const handlePasteProcess = () => {
    if (!pasteInput.trim()) return;

    try {
        const json = JSON.parse(pasteInput);
        setLocalData(json);
    } catch (e) {
        // Not JSON -> Treat as Markdown/Text
        const lines = pasteInput.trim().split('\n');
        let title = "새 문서";
        let content = pasteInput;

        // Smart Title Extraction
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // If first line starts with #, use it as title and remove from content
            if (firstLine.startsWith('# ')) {
                title = firstLine.replace('# ', '').trim().replace(/\*/g, '');
                content = lines.slice(1).join('\n').trim();
            } 
            // Or if it's a short line (likely a title)
            else if (firstLine.length > 0 && firstLine.length < 50 && !firstLine.includes(':')) {
                title = firstLine.replace(/\*/g, '');
                content = lines.slice(1).join('\n').trim();
            }
        }

        setLocalData({
            extractedText: content,
            metadata: { title: title },
            summary: "사용자가 붙여넣은 텍스트 문서입니다."
        });
    }
    setViewMode('document');
  };

  const handleDownloadWord = () => {
    if (!documentRef.current) return;
    
    try {
        const title = getTitle().replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '').trim() || 'document';
        const content = documentRef.current.innerHTML;
        const styles = `
            <style>
                body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; }
                h1 { font-size: 24pt; font-weight: bold; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                h2 { font-size: 18pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #666; }
                h3 { font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
                p { margin-bottom: 10px; text-align: justify; }
                blockquote { border-left: 4px solid #ccc; padding-left: 10px; color: #555; font-style: italic; margin: 10px 0; background-color: #f9f9f9; padding: 10px; }
                pre { background: #f5f5f5; padding: 10px; font-family: monospace; white-space: pre-wrap; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px; }
                hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top; }
                th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
                .summary-box { background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin-bottom: 20px; color: #1e3a8a; border-radius: 5px; }
                .keyword-tag { display: inline-block; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 8px; margin-right: 5px; font-size: 9pt; border-radius: 4px; }
                .doc-meta { margin-bottom: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; }
            </style>
        `;
        
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title>${styles}</head><body>`;
        const footer = "</body></html>";
        
        const sourceHTML = header + content + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const link = document.createElement("a");
        link.href = source;
        link.download = `${title}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("다운로드 중 오류가 발생했습니다.");
        console.error(e);
    }
  };

  // --- Safe Rendering Logic ---

  const renderTable = (rows: string[][], keyPrefix: string) => {
        try {
            if (!rows || rows.length < 2) return null;
            return (
                <div key={`${keyPrefix}-table`} className="my-6 border border-gray-300 rounded-sm" style={{ breakInside: 'avoid' }}>
                    <table className="min-w-full divide-y divide-gray-300 text-sm border-collapse font-serif w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                {rows[0].map((h, i) => (
                                    <th key={i} className="px-4 py-2 text-center font-bold text-gray-900 border-r border-gray-300 last:border-r-0 tracking-tight">
                                        {(h || "").replace(/\*\*/g, '').trim()}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 bg-white">
                            {rows.slice(1).map((row, i) => (
                                // Skip empty separator rows
                                !row.some(c => c.replace(/-/g, '').trim() === '') && (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        {row.map((cell, j) => (
                                            <td key={j} className="px-4 py-2 text-gray-900 whitespace-pre-wrap border-r border-gray-300 last:border-r-0 align-top leading-normal">
                                                {(cell || "").trim()}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } catch (e) {
            return null; // Fail silently for table rendering errors
        }
  };

  const renderFormattedContent = (input: any) => {
    // 1. Safety Check
    if (!input || typeof input !== 'string') {
        return <p className="text-gray-400 italic">내용이 없거나 텍스트 형식이 아닙니다.</p>;
    }

    try {
        const lines = input.split('\n');
        const elements: React.ReactNode[] = [];
        
        let inTable = false;
        let tableRows: string[][] = [];
        let inCodeBlock = false;
        let codeBlockContent: string[] = [];

        lines.forEach((line, index) => {
            // -- Code Block Handling --
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                    elements.push(
                        <pre key={`code-${index}`} className="my-4 p-4 bg-gray-50 border border-gray-200 rounded text-sm font-mono whitespace-pre-wrap text-gray-800 break-all" style={{ breakInside: 'avoid' }}>
                            {codeBlockContent.join('\n')}
                        </pre>
                    );
                    codeBlockContent = [];
                } else {
                    inCodeBlock = true;
                }
                return;
            }
            if (inCodeBlock) {
                codeBlockContent.push(line);
                return;
            }

            const trimmed = line.trim();
            
            // -- Table Handling --
            const isTableLine = trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.length > 2);

            if (isTableLine) {
                inTable = true;
                // Safe split logic
                const content = trimmed.replace(/^\|/, '').replace(/\|$/, '');
                const cells = content.split('|').map(c => c.trim());
                tableRows.push(cells);
                return; // Skip adding this line as text
            } else if (inTable) {
                // Table ended
                inTable = false;
                if (tableRows.length > 0) {
                    elements.push(renderTable(tableRows, `tbl-${index}`));
                }
                tableRows = [];
            }

            // -- Standard Markdown Rendering --
            if (trimmed.startsWith('### ')) {
                elements.push(<h3 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-3 font-sans tracking-tight" style={{ breakAfter: 'avoid' }}>{trimmed.substring(4)}</h3>);
            } else if (trimmed.startsWith('## ')) {
                elements.push(<h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-gray-800 pb-1 font-sans tracking-tight" style={{ breakAfter: 'avoid' }}>{trimmed.substring(3)}</h2>);
            } else if (trimmed.startsWith('# ')) {
                elements.push(<h1 key={index} className="text-2xl font-bold text-black mt-8 mb-6 font-sans tracking-tight" style={{ breakAfter: 'avoid' }}>{trimmed.substring(2)}</h1>);
            } else if (trimmed.startsWith('> ')) {
                elements.push(
                    <blockquote key={index} className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-600 bg-gray-50/50" style={{ breakInside: 'avoid' }}>
                        {trimmed.replace(/^>\s*/, '')}
                    </blockquote>
                );
            } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                elements.push(<hr key={index} className="my-8 border-t border-gray-300" />);
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                elements.push(
                    <div key={index} className="flex gap-2 mb-1 ml-4 items-start" style={{ breakInside: 'avoid' }}>
                        <span className="text-gray-500 mt-1.5 text-[6px] shrink-0">●</span>
                        <span className="text-gray-900 leading-relaxed text-justify">{trimmed.replace(/^[-•]\s+/, '')}</span>
                    </div>
                );
            } else if (/^\d+\.\s/.test(trimmed)) {
                const match = trimmed.match(/^\d+\./);
                const num = match ? match[0] : "1.";
                elements.push(
                    <div key={index} className="flex gap-2 mb-1 ml-4 items-start" style={{ breakInside: 'avoid' }}>
                        <span className="font-bold text-gray-700 text-sm w-4 shrink-0 font-sans">{num}</span>
                        <span className="text-gray-900 leading-relaxed text-justify">{trimmed.replace(/^\d+\.\s+/, '')}</span>
                    </div>
                );
            } else if (trimmed.length > 0) {
                // Paragraph with Bold Support
                const parts = trimmed.split(/(\*\*.*?\*\*)/g);
                elements.push(
                    <p key={index} className="mb-3 leading-7 text-gray-900 text-justify" style={{ breakInside: 'avoid' }}>
                        {parts.map((part, i) => 
                            part.startsWith('**') && part.endsWith('**') 
                            ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> 
                            : part
                        )}
                    </p>
                );
            }
        });
        
        // Flush remaining table or code block at end
        if (inTable && tableRows.length > 0) {
            elements.push(renderTable(tableRows, `tbl-end`));
        }
        if (inCodeBlock && codeBlockContent.length > 0) {
             elements.push(
                <pre key={`code-end`} className="my-4 p-4 bg-gray-50 border border-gray-200 rounded text-sm font-mono whitespace-pre-wrap text-gray-800 break-all" style={{ breakInside: 'avoid' }}>
                    {codeBlockContent.join('\n')}
                </pre>
            );
        }

        return elements;

    } catch (e) {
        console.error("Rendering Error:", e);
        return <pre className="whitespace-pre-wrap text-xs text-red-500">렌더링 중 오류가 발생했습니다. 원본 텍스트를 확인하세요.\n\n{input}</pre>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:block print:relative print:z-auto print:inset-auto">
      <div className="bg-surface-subtle w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:ring-0 print:overflow-visible">
        {/* Header - Hidden in Print */}
        <div className="px-6 py-4 bg-white border-b border-border flex justify-between items-center shrink-0 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-2.5 rounded-lg text-white shadow-md shadow-primary/30">
                <span className="material-symbols-outlined text-xl">description</span>
             </div>
             <div>
                <h3 className="text-lg font-bold text-text-main">문서 뷰어</h3>
                <p className="text-xs text-text-muted font-mono">{fileName || (viewMode === 'paste' ? '새 문서 작성' : '문서 보기')}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {/* Upload Button */}
             {onUploadClick && (
                <button 
                    onClick={onUploadClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-secondary bg-surface-subtle hover:bg-surface-hover border border-border rounded-lg transition-all"
                >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    파일 열기
                </button>
             )}

            {/* Document Actions */}
            {viewMode === 'document' && localData && (
                <div className="flex bg-surface-subtle p-0.5 rounded-lg border border-border mr-2">
                    <button 
                        onClick={handleDownloadWord}
                        className="px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 text-text-main hover:text-primary hover:bg-white hover:shadow-sm"
                        title="Word 파일 다운로드"
                    >
                        <span className="material-symbols-outlined text-sm">file_download</span>
                        Word 다운로드
                    </button>
                </div>
            )}

            <div className="flex bg-surface-subtle p-0.5 rounded-lg border border-border">
                <button 
                    onClick={() => setViewMode('paste')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === 'paste' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                    <span className="material-symbols-outlined text-sm">content_paste</span>
                    붙여넣기
                </button>
                <button 
                    onClick={() => setViewMode('document')}
                    disabled={!localData}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === 'document' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-secondary disabled:opacity-50'}`}
                >
                    <span className="material-symbols-outlined text-sm">wysiwyg</span>
                    문서 보기
                </button>
                <button 
                    onClick={() => setViewMode('raw')}
                    disabled={!localData}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === 'raw' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-secondary disabled:opacity-50'}`}
                >
                    <span className="material-symbols-outlined text-sm">code</span>
                    Raw JSON
                </button>
            </div>
            <div className="h-6 w-px bg-border mx-1"></div>
            <button 
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-error hover:bg-error-light rounded-full transition-colors"
                title="닫기"
            >
                <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-hidden bg-surface-canvas relative print:overflow-visible print:bg-white print:h-auto print:static">
            {viewMode === 'paste' ? (
                <div className="absolute inset-0 p-8 flex flex-col items-center justify-center">
                     <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-border p-6 flex flex-col h-full max-h-[600px]">
                        <h3 className="text-lg font-bold text-text-main mb-2">텍스트 붙여넣기</h3>
                        <p className="text-xs text-text-muted mb-4">JSON 데이터나 일반 텍스트를 붙여넣으면 문서 형식으로 자동 변환됩니다.</p>
                        <textarea 
                            value={pasteInput}
                            onChange={(e) => setPasteInput(e.target.value)}
                            placeholder='여기에 JSON 또는 텍스트를 붙여넣으세요...'
                            className="flex-1 w-full p-4 bg-surface-subtle border border-border rounded-lg resize-none text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none mb-4"
                        />
                        <button 
                            onClick={handlePasteProcess}
                            disabled={!pasteInput.trim()}
                            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all disabled:opacity-50"
                        >
                            문서 변환하기
                        </button>
                     </div>
                </div>
            ) : viewMode === 'document' ? (
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex justify-center p-8 pb-20 print:static print:p-0 print:block print:overflow-visible">
                    {/* A4 Paper Style Container */}
                    <div 
                        id="print-area"
                        ref={documentRef}
                        className="bg-white w-[210mm] min-h-[297mm] shadow-lg border border-gray-200 p-[20mm] flex flex-col gap-6 animate-fade-in origin-top font-serif print:shadow-none print:border-none print:w-full print:p-0 print:m-0"
                        style={{
                            // CSS Trick for Visual Page Breaks on Screen
                            backgroundImage: `linear-gradient(to bottom, white 0px, white calc(297mm - 1px), #e5e7eb calc(297mm - 1px), #e5e7eb 297mm)`,
                            backgroundSize: '100% 297mm'
                        }}
                    >
                        
                        {/* 1. Header Section */}
                        <div className="border-b-4 border-black pb-6 mb-2 text-center" style={{ breakInside: 'avoid' }}>
                            <h1 className="text-3xl font-extrabold text-black leading-tight mb-3 font-serif">
                                {getTitle()}
                            </h1>
                            {publicDoc.doc_number && (
                                <div className="inline-block border border-gray-800 px-3 py-1 text-sm font-bold text-gray-800 uppercase tracking-widest font-sans">
                                    대외비 / {publicDoc.doc_number}
                                </div>
                            )}
                        </div>

                        {/* 2. Metadata Grid Table */}
                        {(publicDoc.sender || publicDoc.receiver || publicDoc.date || metadata.location) && (
                            <table className="doc-meta w-full text-sm border-collapse border-t-2 border-b-2 border-gray-800 mb-4 font-sans" style={{ breakInside: 'avoid' }}>
                                <tbody>
                                    <tr className="border-b border-gray-300">
                                        <th className="bg-gray-100 text-left px-4 py-2 w-24 font-bold text-gray-700 border-r border-gray-300">발신</th>
                                        <td className="px-4 py-2 text-gray-900 w-1/3 border-r border-gray-300">{publicDoc.sender || "-"}</td>
                                        <th className="bg-gray-100 text-left px-4 py-2 w-24 font-bold text-gray-700 border-r border-gray-300">일자</th>
                                        <td className="px-4 py-2 text-gray-900">{publicDoc.date || "-"}</td>
                                    </tr>
                                    <tr>
                                        <th className="bg-gray-100 text-left px-4 py-2 font-bold text-gray-700 border-r border-gray-300">수신</th>
                                        <td className="px-4 py-2 text-gray-900 border-r border-gray-300">{publicDoc.receiver || "-"}</td>
                                        <th className="bg-gray-100 text-left px-4 py-2 font-bold text-gray-700 border-r border-gray-300">장소</th>
                                        <td className="px-4 py-2 text-gray-900">{metadata.location || "-"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}

                        {/* 3. Executive Summary */}
                        {getSummary() && (
                            <div className="summary-box bg-blue-50 border border-blue-100 p-6 rounded-lg mb-4 font-sans" style={{ breakInside: 'avoid' }}>
                                <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-widest flex items-center gap-1.5 border-b border-blue-200 pb-2">
                                    <span className="material-symbols-outlined text-sm">summarize</span> 핵심 요약 (Executive Summary)
                                </h4>
                                <p className="text-sm leading-relaxed text-blue-900 font-medium text-justify">
                                    {getSummary()}
                                </p>
                            </div>
                        )}

                        {/* 4. Main Body */}
                        <div className="flex flex-col gap-2 mt-4">
                            <h4 className="text-xs font-bold text-gray-400 border-b border-gray-300 pb-1 mb-4 uppercase tracking-widest font-sans" style={{ breakAfter: 'avoid' }}>
                                본문 내용 (Body)
                            </h4>
                            <div className="text-base text-gray-900 font-serif">
                                {renderFormattedContent(getContent())}
                            </div>
                        </div>

                        {/* 5. Footer */}
                        <div className="mt-auto pt-10 border-t border-gray-200 flex justify-between items-end font-sans" style={{ breakInside: 'avoid' }}>
                            <div>
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">키워드 (Keywords)</h5>
                                <div className="flex flex-wrap gap-2">
                                    {getKeywords().map((k: string, i: number) => (
                                        <span key={i} className="keyword-tag px-2 py-1 bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-600">
                                            #{k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-mono">AI OCR 프로 생성</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // RAW JSON VIEW
                <div className="absolute inset-0 overflow-auto p-0 bg-[#1e1e1e] text-gray-300 font-mono text-xs leading-relaxed">
                    <div className="sticky top-0 bg-[#2d2d2d] border-b border-[#3e3e3e] px-4 py-2 flex justify-between items-center text-[10px] text-gray-400">
                         <span>JSON Source</span>
                         <span>{localData ? Object.keys(localData).length : 0} keys</span>
                    </div>
                    <pre className="p-4">{JSON.stringify(localData, null, 2)}</pre>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};