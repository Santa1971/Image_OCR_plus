import React, { useState, useRef, useEffect } from 'react';
import { OCRFile, AnalysisMode, OCREngine } from '../types';

interface StudioTab {
    id: string;
    label: string;
    icon: string;
    prompt?: string;
}

interface MainWorkspaceProps {
  currentItem: OCRFile | undefined;
  onGenerate?: (id: string, prompt: string) => void;
  onModeChange?: (id: string, mode: AnalysisMode) => void;
  onStudioGenerate?: (id: string, tabId: string, prompt: string) => void;
  onEditImage?: (id: string) => void;
  currentOcrEngine?: OCREngine;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({ currentItem, onGenerate, onModeChange, onStudioGenerate, onEditImage, currentOcrEngine = 'tesseract' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Image Tab & View State
  const [imageTab, setImageTab] = useState<'original' | 'ai_layer'>('original'); 
  const [showOverlay, setShowOverlay] = useState(false);
  const [imgDim, setImgDim] = useState<{w: number, h: number} | null>(null);
  
  // Split View State
  const [isSplitView, setIsSplitView] = useState(false);

  // Result Tab State
  const [resultTab, setResultTab] = useState<'basic' | 'studio'>('basic');
  const [activeStudioTab, setActiveStudioTab] = useState('chat');
  const [promptInput, setPromptInput] = useState('');
  const [isJsonViewMode, setIsJsonViewMode] = useState(true); // For JSON Tab
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // OCR Tab State (Merged Column)
  const [ocrTab, setOcrTab] = useState<'gemini' | 'tesseract'>('gemini');
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'media' | 'ocr' | 'ai' | 'studio'>('media');

  // Container Refs
  const workspaceRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset view state when item changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImageTab('original'); 
    setResultTab('basic'); 
    setActiveStudioTab('chat');
    setOcrTab('gemini'); // Default to Gemini
    setPromptInput('');
    setShowOverlay(false);
    setImgDim(null);
    setIsJsonViewMode(true);
    setMobileTab('media');
  }, [currentItem?.id]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth) {
        setImgDim({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, [currentItem?.previewUrl]);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentItem?.chatHistory, mobileTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("복사되었습니다!");
  };

  const sanitizeFilename = (name: string) => {
      return name.replace(/[^a-zA-Z0-9가-힣\s\-_.]/g, '').trim();
  };

  const downloadStringAsFile = (filename: string, text: string, extension: string) => {
      if (!text) return;
      const cleanName = sanitizeFilename(filename);
      const mimeType = extension === 'json' ? 'application/json' : 'text/plain';
      const blob = new Blob([text], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${cleanName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
  };

  const handleGenerateClick = () => {
      if (promptInput.trim() && currentItem && onGenerate) {
          onGenerate(currentItem.id, promptInput);
          setPromptInput('');
      }
  };

  const handleStudioTabAction = (tabId: string, actionPrompt: string) => {
      if (currentItem && onStudioGenerate) {
          onStudioGenerate(currentItem.id, tabId, actionPrompt);
      }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const natW = e.currentTarget.naturalWidth;
      const natH = e.currentTarget.naturalHeight;
      setImgDim({ w: natW, h: natH });
      if (workspaceRef.current && natW > 0 && natH > 0) {
          const { width: viewW, height: viewH } = workspaceRef.current.getBoundingClientRect();
          const scaleW = viewW / natW;
          const scaleH = viewH / natH;
          const fitScale = Math.min(scaleW, scaleH) * 0.9; 
          setScale(fitScale > 0 ? fitScale : 1);
      }
  };

  const renderDiff = (original: string, corrected: string) => {
    if (!original) return <span className="text-text-muted italic">비교 대상 없음</span>;
    if (!corrected) return <span className="text-text-muted italic">결과 없음</span>;
    const origWords = original.split(/(\s+)/);
    const corrWords = corrected.split(/(\s+)/);
    if (Math.abs(origWords.length - corrWords.length) > Math.max(origWords.length, corrWords.length) * 0.5) {
        return <div className="text-text-main whitespace-pre-wrap">{corrected}</div>;
    }
    return (
        <div className="text-text-main whitespace-pre-wrap">
            {corrWords.map((word, idx) => {
                const origWord = origWords[idx] || "";
                const isDiff = word.trim() !== origWord.trim() && word.trim().length > 0;
                return (
                    <span 
                        key={idx} 
                        className={isDiff ? "bg-green-100 text-green-800 border-b-2 border-green-500/20" : ""}
                        title={isDiff ? `변경 전: ${origWord}` : undefined}
                    >
                        {word}
                    </span>
                );
            })}
        </div>
    );
  };

  const extractJson = (text: string): { json: string; note: string } => {
      if (!text) return { json: '', note: '' };
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
          const possibleJson = text.substring(start, end + 1);
          const note = text.substring(0, start) + text.substring(end + 1);
          try {
              const parsed = JSON.parse(possibleJson);
              return { json: JSON.stringify(parsed, null, 2), note: note.trim() };
          } catch (e) {
              return { json: possibleJson, note: note.trim() };
          }
      }
      return { json: '', note: text };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (currentItem?.mediaType !== 'image') return;
    e.preventDefault();
    const zoomIntensity = 0.1 * scale; 
    const newScale = e.deltaY < 0 ? scale + zoomIntensity : Math.max(scale - zoomIntensity, 0.05); 
    setScale(newScale);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentItem?.mediaType !== 'image') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Touch Events for Mobile Panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentItem?.mediaType !== 'image') return;
    if (e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
        // Prevent scrolling while dragging
        if(e.cancelable) e.preventDefault();
        setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };
  const handleTouchEnd = () => setIsDragging(false);

  if (!currentItem) {
    return (
        <main className="flex-1 flex flex-col items-center justify-center p-8 order-2 min-h-[50vh] relative overflow-hidden bg-transparent">
            
            <div className="flex flex-col items-center justify-center text-center z-10 animate-fade-in">
                {/* Creative 3D Folder Drop Zone */}
                <div 
                    className="folder-3d-container mb-10 cursor-pointer group"
                    onClick={() => document.getElementById('hidden-app-file-input')?.click()}
                >
                    <div className="folder-paper"></div>
                    <div className="folder-back"></div>
                    <div className="folder-front">
                        <span className="material-symbols-outlined text-white/60 text-5xl group-hover:text-white transition-colors">add_photo_alternate</span>
                    </div>
                    {/* Laser Scanner Effect */}
                    <div className="scan-line"></div>
                </div>

                <h3 className="text-3xl font-extrabold mb-4 drop-shadow-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200">
                    분석할 파일을 드롭 하거나 선택하세요
                </h3>
                <p className="text-sm md:text-base text-text-secondary font-medium bg-surface/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 mb-8 shadow-sm">
                    지원: PDF, JPG, PNG, DOCX, TXT / 오디오 / 비디오
                </p>

                <button 
                    onClick={() => document.getElementById('hidden-app-file-input')?.click()}
                    className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-primary/30 font-bold transition-all hover:-translate-y-1 hover:shadow-primary/50 active:translate-y-0 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    파일 선택하기
                </button>
            </div>
        </main>
    );
  }

  const getStudioTabs = (): StudioTab[] => {
      const common: StudioTab[] = [
          { id: 'chat', label: '자유 대화', icon: 'chat' }
      ];
      if (currentItem.mediaType === 'image') {
          return [...common, 
              { id: 'sns', label: 'SNS 홍보', icon: 'campaign', prompt: "이 이미지를 바탕으로 인스타그램 홍보 캡션을 작성해줘. 해시태그 포함." },
              { id: 'alt', label: '대체 텍스트', icon: 'visibility', prompt: "이 이미지의 시각적 요소를 상세히 묘사하여 시각장애인을 위한 대체 텍스트(Alt Text)를 작성해줘." },
              { id: 'json', label: 'JSON 변환', icon: 'data_object', prompt: "이 이미지에 있는 텍스트 정보를 JSON 포맷으로 구조화해서 추출해줘. (extractedText, correctedText, keywords, summary 포함)" }
          ];
      }
      if (currentItem.mediaType === 'video') {
          return [...common,
              { id: 'youtube', label: '유튜브용', icon: 'video_library', prompt: "이 영상 내용을 바탕으로 유튜브 영상 제목 5가지와 설명글을 작성해줘." },
              { id: 'timeline', label: '타임라인', icon: 'view_timeline', prompt: "이 영상의 주요 사건을 타임라인별로 정리해줘." }
          ];
      }
      if (currentItem.mediaType === 'audio') {
          return [...common,
              { id: 'meeting', label: '회의록', icon: 'meeting_room', prompt: "이 오디오 내용을 바탕으로 회의록을 작성해줘 (참석자, 안건, 결정사항, 향후 계획)." },
              { id: 'todo', label: '할 일', icon: 'check_box', prompt: "이 내용에서 해야 할 일(Action Items)만 목록으로 추출해줘." }
          ];
      }
      return common;
  };

  const studioTabs = getStudioTabs();

  // --- Render Sections ---

  const renderMediaPlayer = () => {
      if (currentItem.mediaType === 'video') {
          return (
              <video controls className="max-w-full max-h-full rounded-2xl shadow-lg bg-black/90">
                  <source src={currentItem.previewUrl} type={currentItem.file.type} />
              </video>
          );
      } else if (currentItem.mediaType === 'audio') {
          return (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-md rounded-2xl p-8 gap-6 border border-white/50 shadow-inner">
                  <div className="p-6 bg-primary/10 rounded-full">
                    <span className="material-symbols-outlined text-6xl text-primary">graphic_eq</span>
                  </div>
                  <audio controls className="w-full max-w-md shadow-sm rounded-lg">
                      <source src={currentItem.previewUrl} type={currentItem.file.type} />
                  </audio>
                  <p className="text-sm text-text-secondary font-mono bg-white/60 px-4 py-2 rounded-lg border border-white/60">{currentItem.file.name}</p>
              </div>
          );
      } else {
          const activeImageUrl = currentItem.previewUrl;
          const isLayerMode = imageTab === 'ai_layer';
          // Force overlay visible in AI Layer mode, regardless of toggle
          const isOverlayVisible = showOverlay || isLayerMode;

          return (
            <div className="w-full h-full flex flex-col">
                 <div className="flex p-1.5 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl mb-3 self-start gap-2 flex-wrap shadow-sm z-10">
                    <div className="flex p-0.5 bg-gray-100/50 border border-gray-200/50 rounded-lg">
                        <button 
                            onClick={() => setImageTab('original')}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${imageTab === 'original' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            원본
                        </button>
                        <button 
                            onClick={() => setImageTab('ai_layer')}
                            disabled={!currentItem.ocrData || currentItem.ocrData.length === 0}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${imageTab === 'ai_layer' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary disabled:opacity-50'}`}
                        >
                            <span className="material-symbols-outlined text-[12px]">layers</span>
                            AI 복원
                        </button>
                    </div>
                    {currentItem.mediaType === 'image' && (
                        <div className="flex items-center gap-1 bg-white/70 rounded-lg border border-white/60 px-2 shadow-sm">
                            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.05))} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <span className="text-[10px] w-8 text-center text-text-main font-bold">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(s + 0.1, 5))} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><span className="material-symbols-outlined text-sm">add</span></button>
                            {onEditImage && (
                                <>
                                    <div className="w-px h-3 bg-gray-300 mx-1"></div>
                                    <button onClick={() => onEditImage(currentItem.id)} className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-primary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">crop_rotate</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                 </div>

                <div 
                    ref={workspaceRef}
                    className="flex-1 w-full flex items-center justify-center cursor-move overflow-hidden bg-gray-50/50 rounded-2xl border border-white/60 shadow-inner relative group min-h-[300px]"
                    style={{ 
                        touchAction: 'none',
                        backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', /* Use primary color for dots in dark mode */
                        backgroundSize: '20px 20px',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)' /* Dark background */
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div 
                        style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                            transformOrigin: 'center center',
                            width: imgDim ? imgDim.w : 'auto', 
                            height: imgDim ? imgDim.h : 'auto', 
                            position: 'relative', 
                        }}
                    >
                        <img 
                            ref={imgRef}
                            src={activeImageUrl} 
                            alt="View" 
                            onLoad={onImageLoad}
                            style={{ 
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain', 
                                opacity: isLayerMode ? 0.1 : 1, 
                                filter: isLayerMode ? 'grayscale(100%)' : 'none',
                                transition: 'all 0.3s',
                                userSelect: 'none',
                                pointerEvents: 'none'
                            }}
                            draggable={false}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                            {isOverlayVisible && currentItem.ocrData && currentItem.ocrData.map((block, i) => {
                                const top = (Number(block.bbox.y0) / 1000) * 100;
                                const left = (Number(block.bbox.x0) / 1000) * 100;
                                const width = ((Number(block.bbox.x1) - Number(block.bbox.x0)) / 1000) * 100;
                                const height = ((Number(block.bbox.y1) - Number(block.bbox.y0)) / 1000) * 100;
                                const pixelHeight = (height / 100) * (imgDim?.h || 1000);
                                const fontSize = pixelHeight * 0.85; 

                                return (
                                    <div
                                        key={i}
                                        className="group/box absolute hover:z-50 hover:bg-yellow-50/50 hover:ring-2 ring-yellow-400 transition-all rounded-sm"
                                        style={{
                                            left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                                            backgroundColor: isLayerMode ? 'transparent' : 'rgba(79, 70, 229, 0.1)',
                                            color: isLayerMode ? '#000000' : 'transparent',
                                            border: isLayerMode ? 'none' : '1px solid rgba(79, 70, 229, 0.6)',
                                            fontSize: isLayerMode ? `${fontSize}px` : undefined,
                                            lineHeight: 1,
                                            display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', 
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'auto', textAlign: 'center',
                                            fontWeight: 'bold',
                                            textShadow: isLayerMode ? '0px 0px 2px rgba(255,255,255,0.9)' : 'none',
                                            fontFamily: 'sans-serif'
                                        }}
                                        title={block.text}
                                    >
                                        {isLayerMode && <span>{block.text}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
          );
      }
  };

  const renderUnifiedOcrColumn = () => {
      let content = "";
      let title = "";
      let isGemini = ocrTab === 'gemini';

      if (isGemini) {
          title = "Gemini AI";
          if (currentItem.mediaType === 'audio') content = currentItem.textCorrected;
          else content = currentItem.textGemini;
      } else {
          const isPaddle = currentOcrEngine === 'paddle';
          title = isPaddle ? "PaddleOCR" : "Tesseract";
          content = isPaddle ? currentItem.textPaddle : currentItem.textTesseract;
          
          if (currentItem.mediaType !== 'image') {
              content = "Tesseract/PaddleOCR은 이미지만 지원합니다.";
          }
      }

      return (
        <div className="flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl shadow-sm">
                    <button 
                        onClick={() => setOcrTab('gemini')}
                        className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${ocrTab === 'gemini' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        Gemini
                    </button>
                    <button 
                        onClick={() => setOcrTab('tesseract')}
                        className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${ocrTab === 'tesseract' ? 'bg-white shadow-sm text-text-main ring-1 ring-black/5' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                        <span className="material-symbols-outlined text-[14px]">text_snippet</span>
                        Tesseract
                    </button>
                </div>
                
                <button onClick={() => copyToClipboard(content)} className="p-2 text-text-muted hover:text-primary bg-white/50 hover:bg-white rounded-lg transition-all border border-transparent hover:border-white/50" title="복사">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
            </div>

            <div className="glass-panel flex-1 rounded-2xl p-5 overflow-y-auto custom-scrollbar">
                 {!isGemini && currentItem.analysisMode === 'image' && currentItem.mediaType === 'image' ? (
                     <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60">
                         <span className="material-symbols-outlined text-3xl mb-2">hide_image</span>
                         <p className="text-xs italic text-center">이미지 분석 모드입니다.<br/>(OCR 비활성화)</p>
                     </div>
                 ) : (
                     <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isGemini ? 'text-text-secondary' : 'text-text-secondary font-mono'}`}>
                        {content || (currentItem.status === 'processing' ? '분석 중...' : '데이터 없음')}
                     </p>
                 )}
            </div>
        </div>
      );
  };

  const renderQuaternaryColumn = () => {
    const renderStudioContent = () => {
        if (activeStudioTab === 'chat') {
            return (
                <div className="flex flex-col h-full min-h-[400px]">
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {currentItem.chatHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60">
                                <span className="material-symbols-outlined text-3xl mb-2">chat_bubble</span>
                                <p className="text-xs">자유롭게 대화해보세요.</p>
                            </div>
                        ) : (
                            currentItem.chatHistory.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                                        msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-white/50 text-text-main rounded-bl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 bg-white/50 border-t border-white/30 flex gap-2 backdrop-blur-sm">
                        <input 
                            type="text" 
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateClick()}
                            placeholder="메시지 입력..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/50 bg-white/80 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xs text-text-main shadow-inner"
                        />
                        <button onClick={handleGenerateClick} disabled={!promptInput.trim()} className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                </div>
            );
        } else {
            const resultText = currentItem.studioResults?.[activeStudioTab];
            let json = '';
            if (activeStudioTab === 'json' && resultText) {
                json = extractJson(resultText).json;
            }

            return (
                <div className="flex flex-col h-full p-4 overflow-y-auto min-h-[400px]">
                    {resultText ? (
                        <div className="flex flex-col h-full gap-3">
                            <div className="flex justify-between items-center mb-1">
                                <h5 className="text-xs font-bold text-text-secondary flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                                    결과
                                </h5>
                                <div className="flex gap-1.5 bg-white/50 p-1 rounded-lg border border-white/50">
                                    <button 
                                        onClick={() => {
                                            const tab = studioTabs.find(t => t.id === activeStudioTab);
                                            if(tab?.prompt) handleStudioTabAction(activeStudioTab, tab.prompt);
                                        }}
                                        className="p-1.5 hover:bg-white rounded-md text-text-main transition-all"
                                        title="재생성"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                                    </button>
                                    <button 
                                        onClick={() => downloadStringAsFile(
                                            `${currentItem.file.name}_${activeStudioTab}`, 
                                            activeStudioTab === 'json' && json ? json : resultText,
                                            activeStudioTab === 'json' ? 'json' : 'md'
                                        )}
                                        className="p-1.5 hover:bg-white rounded-md text-text-main transition-all"
                                        title="다운로드"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">download</span>
                                    </button>
                                    <button onClick={() => copyToClipboard(activeStudioTab === 'json' && json ? json : resultText)} className="text-[10px] font-bold text-white bg-primary px-3 py-1 rounded-md shadow-sm hover:bg-primary-hover transition-all">복사</button>
                                </div>
                            </div>
                            {activeStudioTab === 'json' && isJsonViewMode ? (
                                <div className="flex-1 flex flex-col gap-2 min-h-0">
                                    <pre className="flex-1 p-4 bg-[#1e1e1e] text-[#a9b7c6] text-[11px] font-mono rounded-xl overflow-auto shadow-inner border border-gray-700">{json || "No JSON"}</pre>
                                </div>
                            ) : (
                                <textarea readOnly className="flex-1 w-full p-4 rounded-xl border border-white/50 bg-white/70 text-xs resize-none text-text-main leading-relaxed shadow-inner outline-none" value={resultText} />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                            <div className="bg-primary/5 p-4 rounded-full mb-3">
                                <span className="material-symbols-outlined text-3xl text-primary">magic_button</span>
                            </div>
                            <p className="text-xs text-text-secondary mb-4 font-medium">'{studioTabs.find(t => t.id === activeStudioTab)?.label}' 콘텐츠를 생성합니다.</p>
                            <button 
                                onClick={() => {
                                    const tab = studioTabs.find(t => t.id === activeStudioTab);
                                    if(tab?.prompt) handleStudioTabAction(activeStudioTab, tab.prompt);
                                }}
                                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                            >
                                생성 시작
                            </button>
                        </div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="glass-panel flex-1 rounded-2xl shadow-lux overflow-hidden flex flex-col relative h-full">
            <div className="flex flex-col h-full bg-white/30">
                <div className="flex overflow-x-auto no-scrollbar border-b border-white/40 bg-white/40 px-2 shrink-0 backdrop-blur-sm">
                    {studioTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveStudioTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold border-b-2 transition-all whitespace-nowrap
                                ${activeStudioTab === tab.id ? 'border-primary text-primary bg-white/50' : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-white/30'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {renderStudioContent()}
                </div>
            </div>
        </div>
    );
  };

  return (
    <main className="flex-1 relative flex flex-col overflow-y-auto order-2 h-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-white/50 px-4 py-2 md:px-6 md:py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 overflow-hidden">
             <div className="bg-gradient-to-br from-primary to-primary-hover p-2 rounded-lg text-white shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-lg block">
                    {currentItem.mediaType === 'video' ? 'movie' : currentItem.mediaType === 'audio' ? 'graphic_eq' : 'image'}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="font-bold text-sm text-text-main truncate max-w-[150px] md:max-w-md">{currentItem.file.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    currentItem.status === 'done' ? 'text-success' : currentItem.status === 'processing' ? 'text-primary' : 'text-text-muted'
                }`}>
                    {currentItem.status === 'done' ? '분석 완료' : currentItem.status === 'processing' ? '분석 진행 중...' : '대기 중'}
                </span>
             </div>
        </div>
        
        {/* Desktop Split Toggle */}
        <div className="hidden md:flex items-center gap-3">
            <button 
                onClick={() => setIsSplitView(!isSplitView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isSplitView ? 'bg-primary text-white shadow-primary/20' : 'bg-white text-text-secondary border border-white hover:bg-gray-50'}`}
            >
                <span className="material-symbols-outlined text-sm">{isSplitView ? 'vertical_split' : 'grid_view'}</span>
                <span>{isSplitView ? '분할 보기' : '그리드 보기'}</span>
            </button>
        </div>
      </div>

      {/* --- Mobile View (Tabbed) --- */}
      <div className="md:hidden flex-1 flex flex-col min-h-0 bg-surface-canvas">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mobileTab === 'media' && renderMediaPlayer()}
              {mobileTab === 'ocr' && renderUnifiedOcrColumn()}
              {mobileTab === 'ai' && (
                  <div className="glass-panel p-5 rounded-2xl border border-white/60">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                            <h5 className="text-xs font-bold text-success uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">summarize</span> 핵심 요약
                            </h5>
                            <button onClick={() => copyToClipboard(currentItem.textCorrected || currentItem.summary)} className="text-text-muted hover:text-primary"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                        </div>
                        {currentItem.mediaType === 'image' && currentItem.textCorrected ? (
                            <div className="text-xs leading-relaxed text-text-main bg-white/50 p-3 rounded-lg border border-white/50">{renderDiff(currentItem.textGemini, currentItem.textCorrected)}</div>
                        ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap text-text-main font-medium">{currentItem.summary || "내용 없음"}</p>
                        )}
                  </div>
              )}
              {mobileTab === 'studio' && renderQuaternaryColumn()}
          </div>
          
          {/* Mobile Bottom Navigation */}
          <div className="bg-white/90 backdrop-blur-md border-t border-white/50 flex justify-around p-2 shadow-lg sticky bottom-0 z-20 pb-safe">
              {[
                  { id: 'media', icon: 'perm_media', label: '미디어' },
                  { id: 'ocr', icon: 'text_snippet', label: '데이터' },
                  { id: 'ai', icon: 'auto_awesome', label: 'AI분석' },
                  { id: 'studio', icon: 'chat', label: '생성/채팅' }
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMobileTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${mobileTab === tab.id ? 'text-primary bg-primary/5' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                      <span className={`material-symbols-outlined text-2xl ${mobileTab === tab.id ? 'fill-1' : ''}`}>{tab.icon}</span>
                      <span className="text-[10px] font-bold">{tab.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* --- Desktop View (Grid) --- */}
      {isSplitView ? (
        <div className="hidden md:grid flex-1 p-6 grid-cols-2 gap-6 h-full min-h-0 bg-surface-canvas">
            <section className="flex flex-col gap-3 min-w-0 h-full overflow-hidden">
                <div className="relative w-full flex-1 rounded-2xl overflow-hidden glass-panel p-1">{renderMediaPlayer()}</div>
            </section>
            <section className="flex flex-col gap-3 min-w-0 h-full overflow-hidden">
                <div className="flex-1 glass-panel rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-sm leading-7 whitespace-pre-wrap text-text-main">{currentItem.textGemini}</p>
                </div>
            </section>
        </div>
      ) : (
        <div className="hidden md:grid flex-1 p-6 grid-cols-2 2xl:grid-cols-3 gap-6 h-full min-h-0 bg-surface-canvas">
            {/* Column 1: Media Player */}
            <section className="flex flex-col gap-3 min-w-0 h-[500px] xl:h-auto">
                <div className="relative w-full h-full">{renderMediaPlayer()}</div>
            </section>
            
            {/* Column 2: Unified OCR (Gemini / Tesseract) */}
            <section className="flex flex-col gap-3 min-w-0 h-[500px] xl:h-auto">{renderUnifiedOcrColumn()}</section>
            
            {/* Column 3: Studio / Basic Analysis */}
            <section className="flex flex-col gap-3 min-w-0 h-[500px] xl:h-auto">
                 {/* Basic/Studio Tabs for Desktop Column */}
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex p-1 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl shadow-sm">
                        <button onClick={() => setResultTab('basic')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${resultTab === 'basic' ? 'bg-white shadow-sm text-text-main ring-1 ring-black/5' : 'text-text-muted hover:text-text-secondary'}`}>기본 분석</button>
                        <button onClick={() => setResultTab('studio')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${resultTab === 'studio' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-text-muted hover:text-text-secondary'}`}>AI 창작</button>
                    </div>
                </div>
                {resultTab === 'basic' ? (
                     <div className="glass-panel flex-1 rounded-2xl p-5 overflow-y-auto bg-green-50/30 border-green-100">
                        <h5 className="text-xs font-bold text-success uppercase mb-3 flex items-center gap-1.5 border-b border-green-200/50 pb-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {currentItem.mediaType === 'image' ? "AI 보정 비교 / 요약" : "핵심 요약"}
                        </h5>
                        {currentItem.mediaType === 'image' && currentItem.textCorrected ? (
                            <div className="text-xs leading-relaxed text-text-main bg-white/60 p-3 rounded-xl border border-white/60 shadow-sm">{renderDiff(currentItem.textGemini, currentItem.textCorrected)}</div>
                        ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap text-text-main font-medium">{currentItem.summary}</p>
                        )}
                     </div>
                ) : renderQuaternaryColumn()}
            </section>
        </div>
      )}
    </main>
  );
};