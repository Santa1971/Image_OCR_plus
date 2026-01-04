import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { createWorker, PSM, Worker } from 'tesseract.js';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { RightSidebar } from './components/RightSidebar';
import { SettingsPage } from './components/SettingsPage';
import { JsonViewerModal } from './components/JsonViewerModal';
import { ImageEditorModal } from './components/ImageEditorModal';
import { LandingPage } from './components/LandingPage';
import { OCRFile, MediaType, AnalysisMode, OCRBlock, AutoConfig, OCREngine, SystemInstructions, AppTheme } from './types';

// Define prompts centrally to reuse in auto-gen and manual-gen
const STUDIO_PROMPTS: Record<string, string> = {
    sns: "이 이미지를 바탕으로 인스타그램 홍보 캡션을 작성해줘. 해시태그 포함.",
    alt: "이 이미지의 시각적 요소를 상세히 묘사하여 시각장애인을 위한 대체 텍스트(Alt Text)를 작성해줘.",
    json: "이 이미지에 있는 텍스트 정보를 JSON 포맷으로 구조화해서 추출해줘. (extractedText, correctedText, keywords, summary 포함)",
    youtube: "이 영상 내용을 바탕으로 유튜브 영상 제목 5가지와 설명글을 작성해줘.",
    timeline: "이 영상의 주요 사건을 타임라인별로 정리해줘.",
    meeting: "이 오디오 내용을 바탕으로 회의록을 작성해줘 (참석자, 안건, 결정사항, 향후 계획).",
    todo: "이 내용에서 해야 할 일(Action Items)만 목록으로 추출해줘."
};

const DEFAULT_AUTO_CONFIG: AutoConfig = {
    sns: false,
    alt: false,
    json: false,
    youtube: false,
    timeline: false,
    meeting: false,
    todo: false,
    word: false,
    markdown: false,
    csv: false,
    saveLocation: 'default'
};

const DEFAULT_INSTRUCTIONS: SystemInstructions = {
    ocr: "이 문서는 텍스트 추출이 주 목적입니다. 원본의 내용을 훼손하지 말고 보이는 그대로 정확하게 추출하세요. 오타나 깨진 글자는 문맥을 파악해 보정하세요.",
    image: "이 이미지의 시각적 요소, 분위기, 색감, 배치 등을 상세하게 묘사하세요. 시각장애인을 위한 대체 텍스트 수준으로 구체적이어야 합니다.",
    audio: "오디오의 내용을 빠짐없이 기록(STT)하고, 화자를 구분하여 대화 내용을 정리하세요. 핵심 요약과 키워드를 포함하세요.",
    video: "영상의 흐름, 주요 장면, 자막 내용을 시간 순서대로 정리하세요. 유튜브 업로드용 제목과 설명도 제안하세요."
};

const DAILY_QUOTA_LIMIT = 1500; // Gemini Free Tier Assumption for UI

type ViewState = 'landing' | 'workspace' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [previousView, setPreviousView] = useState<ViewState>('landing'); // Track navigation history
  
  const [items, setItems] = useState<OCRFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Progress & Timer State
  const [progressStats, setProgressStats] = useState({ current: 0, total: 0, percentage: 0 });
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [totalDuration, setTotalDuration] = useState('');
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const shouldStopRef = useRef(false);
  
  // Settings State
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash'); 
  const [ocrEngine, setOcrEngine] = useState<OCREngine>('tesseract');
  const [paddleUrl, setPaddleUrl] = useState('http://localhost:8000/ocr');
  const [customInstructions, setCustomInstructions] = useState<SystemInstructions>(DEFAULT_INSTRUCTIONS);
  const [imageOcrEnabled, setImageOcrEnabled] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoConfig, setAutoConfig] = useState<AutoConfig>(DEFAULT_AUTO_CONFIG);
  const [theme, setTheme] = useState<AppTheme>('default');
  
  // API Usage Stats
  const [apiUsage, setApiUsage] = useState(0);

  // Mobile Sidebar States
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // JSON Viewer State
  const [isJsonViewerOpen, setIsJsonViewerOpen] = useState(false);
  const [jsonViewerData, setJsonViewerData] = useState<any>(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);
  
  // Image Editor State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editorImageUrl, setEditorImageUrl] = useState('');

  // Main Upload Input Ref for shortcut
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Persistent Tesseract Worker Ref for performance
  const tesseractWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
    
    const storedModel = localStorage.getItem('gemini_model');
    if (storedModel) setModel(storedModel);

    const storedEngine = localStorage.getItem('ocr_engine');
    if (storedEngine) setOcrEngine(storedEngine as OCREngine);

    const storedPaddleUrl = localStorage.getItem('paddle_url');
    if (storedPaddleUrl) setPaddleUrl(storedPaddleUrl);

    const storedInstructions = localStorage.getItem('custom_instructions_obj');
    if (storedInstructions) {
        try {
            setCustomInstructions(JSON.parse(storedInstructions));
        } catch(e) { console.error("Instruction parse error", e); }
    } else {
        // Migration support for old string instruction
        const oldStr = localStorage.getItem('custom_instruction');
        if (oldStr) setCustomInstructions({...DEFAULT_INSTRUCTIONS, ocr: oldStr});
    }

    const storedImageOcr = localStorage.getItem('image_ocr_enabled');
    if (storedImageOcr !== null) {
        setImageOcrEnabled(storedImageOcr === 'true');
    }

    const storedAuto = localStorage.getItem('gemini_auto_config');
    if (storedAuto) {
        try {
            setAutoConfig(JSON.parse(storedAuto));
        } catch(e) { console.error("Auto config parse error", e); }
    }

    const storedTheme = localStorage.getItem('app_theme');
    if (storedTheme) {
        setTheme(storedTheme as AppTheme);
    }

    // Load API usage from local storage (reset if date changed)
    const today = new Date().toISOString().slice(0, 10);
    const storedUsageDate = localStorage.getItem('api_usage_date');
    const storedUsageCount = localStorage.getItem('api_usage_count');

    if (storedUsageDate === today && storedUsageCount) {
        setApiUsage(parseInt(storedUsageCount, 10));
    } else {
        setApiUsage(0);
        localStorage.setItem('api_usage_date', today);
        localStorage.setItem('api_usage_count', '0');
    }

    // Clean up worker on unmount
    return () => {
        if (tesseractWorkerRef.current) {
            tesseractWorkerRef.current.terminate();
        }
    };
  }, []);

  // Apply Theme
  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('theme-midnight', 'theme-nature', 'theme-ocean', 'theme-sunset');
    if (theme !== 'default') {
        document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const incrementApiUsage = () => {
      setApiUsage(prev => {
          const newValue = prev + 1;
          localStorage.setItem('api_usage_count', newValue.toString());
          localStorage.setItem('api_usage_date', new Date().toISOString().slice(0, 10));
          return newValue;
      });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in input/textarea
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        // Ctrl + O : Open File
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
             e.preventDefault();
             document.getElementById('hidden-app-file-input')?.click();
        }

        // Ctrl + Enter : Start Analysis
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
             e.preventDefault();
             if (isProcessing) {
                 handleStopProcess();
             } else {
                 startBatchProcess();
             }
        }

        // Ctrl + S : Download Word (current item)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
             e.preventDefault();
             handleDownloadWord();
        }

        // Delete : Delete selected item
        if (e.key === 'Delete' && selectedId && currentView === 'workspace') {
            if (items.find(i => i.id === selectedId)) {
                if (confirm("선택한 파일을 삭제하시겠습니까?")) {
                    deleteFiles([selectedId]);
                }
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, items, currentView, isProcessing]); 

  const handleSaveSettings = (key: string, selectedModel: string, newAutoConfig: AutoConfig, selectedEngine: OCREngine, newPaddleUrl: string, newInstructions: SystemInstructions, newImageOcrEnabled: boolean, newTheme: AppTheme) => {
    const trimmedKey = key.trim();
    setApiKey(trimmedKey);
    if (trimmedKey) {
        localStorage.setItem('gemini_api_key', trimmedKey);
    } else {
        localStorage.removeItem('gemini_api_key');
    }

    const trimmedModel = selectedModel.trim();
    if (trimmedModel) {
        setModel(trimmedModel);
        localStorage.setItem('gemini_model', trimmedModel);
    }

    setOcrEngine(selectedEngine);
    localStorage.setItem('ocr_engine', selectedEngine);

    const trimmedUrl = newPaddleUrl.trim();
    setPaddleUrl(trimmedUrl);
    localStorage.setItem('paddle_url', trimmedUrl);

    setCustomInstructions(newInstructions);
    localStorage.setItem('custom_instructions_obj', JSON.stringify(newInstructions));

    setImageOcrEnabled(newImageOcrEnabled);
    localStorage.setItem('image_ocr_enabled', String(newImageOcrEnabled));

    setAutoConfig(newAutoConfig);
    localStorage.setItem('gemini_auto_config', JSON.stringify(newAutoConfig));

    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const toggleView = () => {
      setPreviousView(currentView);
      setCurrentView(prev => prev === 'workspace' ? 'settings' : 'workspace');
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const determineMediaType = (mime: string): MediaType => {
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      return 'image';
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const newItems: OCRFile[] = Array.from(fileList)
      .map(f => {
        const mediaType = determineMediaType(f.type);
        if (!f.type.startsWith('image/') && !f.type.startsWith('video/') && !f.type.startsWith('audio/')) {
            return null;
        }
        const item: OCRFile = {
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            mediaType: mediaType,
            // @ts-ignore
            path: f.webkitRelativePath ? f.webkitRelativePath.split('/').slice(0, -1).join('/') : '',
            previewUrl: URL.createObjectURL(f),
            status: 'idle',
            analysisMode: 'all', 
            textGemini: '',
            textCorrected: '',
            textTesseract: '',
            textPaddle: '',
            fontStyle: 'sans-serif',
            summary: '',
            keywords: [],
            metadata: {},
            chatHistory: [],
            studioResults: {},
            ocrData: []
        };
        return item;
      }).filter((item): item is OCRFile => item !== null);

    if (newItems.length === 0) {
        alert("지원되는 파일 형식(이미지, 동영상, 오디오)이 아닙니다.");
        return;
    }

    setItems(prev => [...prev, ...newItems]);
    if (!selectedId && newItems.length > 0) {
        setSelectedId(newItems[0].id);
    }
    // Auto open sidebar on upload if on mobile
    setLeftSidebarOpen(true);
  };

  const deleteFiles = (ids: string[]) => {
      setItems(prevItems => {
          ids.forEach(id => {
              const item = prevItems.find(i => i.id === id);
              if (item) {
                  URL.revokeObjectURL(item.previewUrl);
                  if (item.generatedImageUrl) URL.revokeObjectURL(item.generatedImageUrl);
              }
          });

          const newItems = prevItems.filter(item => !ids.includes(item.id));
          return newItems;
      });

      if (selectedId && ids.includes(selectedId)) {
          setItems(currentItems => {
             const newItems = currentItems.filter(item => !ids.includes(item.id));
             if (newItems.length > 0) {
                 const oldIndex = currentItems.findIndex(i => i.id === selectedId);
                 const nextIndex = Math.min(Math.max(0, oldIndex), newItems.length - 1);
                 setSelectedId(newItems[nextIndex].id);
             } else {
                 setSelectedId(null);
             }
             return newItems; 
          });
      }
  };

  const updateAnalysisMode = (id: string, mode: AnalysisMode) => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, analysisMode: mode } : item));
  };

  // --- Image Editor Handlers ---

  const handleOpenImageEditor = (id: string) => {
      const item = items.find(i => i.id === id);
      if (item && item.mediaType === 'image') {
          setEditingFileId(id);
          setEditorImageUrl(item.previewUrl);
      }
  };

  const handleSaveEditedImage = (blob: Blob) => {
      if (!editingFileId) return;

      const newFile = new File([blob], "edited_image.png", { type: "image/png" });
      const newUrl = URL.createObjectURL(newFile);

      setItems(prev => prev.map(item => {
          if (item.id === editingFileId) {
              // Revoke old URL to avoid memory leak
              URL.revokeObjectURL(item.previewUrl);
              return {
                  ...item,
                  file: newFile,
                  previewUrl: newUrl,
                  status: 'idle', // Reset status so it can be processed again
                  ocrData: [], // Clear previous OCR data
                  textGemini: '',
                  textCorrected: ''
              };
          }
          return item;
      }));
  };

  // Helper function for Studio Generation (Used by both Auto and Manual)
  const fetchStudioResult = async (item: OCRFile, tabId: string, prompt: string, currentApiKey: string): Promise<string> => {
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
        });

        incrementApiUsage(); // Track Usage

        const ai = new GoogleGenAI({ apiKey: currentApiKey });
        
        let contextInstruction = `당신은 전문 콘텐츠 크리에이터입니다. 
        제공된 ${item.mediaType} 데이터와 이전 분석 내용을 바탕으로, 사용자가 요청한 콘텐츠를 작성해주세요.
        결과는 반드시 한국어로 작성하세요.`;

        // If JSON tab, enforce strict JSON response
        let config: any = { systemInstruction: contextInstruction };
        let finalPrompt = prompt;

        if (tabId === 'json') {
            contextInstruction += `\n**중요**: 결과는 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록(\`\`\`)이나 설명글을 포함하지 말고 순수한 JSON 문자열만 반환하세요.`;
            config = { 
                systemInstruction: contextInstruction,
                responseMimeType: "application/json" 
            };
            finalPrompt += " (JSON only)";
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: item.file.type } },
                    { text: finalPrompt }
                ]
            },
            config: config
        });

        return response.text || "응답을 생성할 수 없습니다.";
  };

  // Chat Generation
  const generateAIContent = async (itemId: string, prompt: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item || !apiKey) return;

      setItems(prev => prev.map(i => i.id === itemId ? {
          ...i,
          chatHistory: [...i.chatHistory, { role: 'user', text: prompt, timestamp: Date.now() }]
      } : i));

      try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
        });
        
        incrementApiUsage(); // Track Usage

        const ai = new GoogleGenAI({ apiKey });
        let contextInstruction = `당신은 사용자가 제공한 미디어 파일(${item.mediaType})을 분석하고 사용자의 요청에 맞춰 텍스트를 생성하는 AI 어시스턴트입니다. 
        이전 분석 결과(OCR 텍스트: "${item.textCorrected.slice(0, 500)}...")를 참고하되, 사용자의 구체적인 지시를 최우선으로 따르세요. 
        결과는 반드시 한국어로 작성하세요.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: item.file.type } },
                    { text: prompt }
                ]
            },
            config: { systemInstruction: contextInstruction }
        });

        const reply = response.text || "응답을 생성할 수 없습니다.";

        setItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            chatHistory: [...i.chatHistory, { role: 'model', text: reply, timestamp: Date.now() }]
        } : i));

      } catch (e: any) {
          console.error(e);
          setItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            chatHistory: [...i.chatHistory, { role: 'model', text: `오류가 발생했습니다: ${e.message}`, timestamp: Date.now() }]
        } : i));
      }
  };

  // Manual Studio Generation
  const generateStudioContent = async (itemId: string, tabId: string, prompt: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item || !apiKey) return;

      setItems(prev => prev.map(i => i.id === itemId ? {
          ...i,
          studioResults: { ...i.studioResults, [tabId]: "생성 중..." }
      } : i));

      try {
        const resultText = await fetchStudioResult(item, tabId, prompt, apiKey);
        setItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            studioResults: { ...i.studioResults, [tabId]: resultText }
        } : i));
      } catch (e: any) {
          console.error(e);
          setItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            studioResults: { ...i.studioResults, [tabId]: `오류가 발생했습니다: ${e.message}` }
        } : i));
      }
  };

  // Improved Preprocessing function for Tesseract (Grayscale + Thresholding + Contrast)
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Limit max dimension for speed, but keep high enough for accuracy
            const MAX_DIM = 2500;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_DIM) {
                    height = Math.round(height * (MAX_DIM / width));
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width = Math.round(width * (MAX_DIM / height));
                    height = MAX_DIM;
                }
            }
            
            canvas.width = width;
            canvas.height = height;

            if (ctx) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Advanced Preprocessing Loop
                // 1. Grayscale
                // 2. Simple Contrast Stretching
                // 3. Binarization (Thresholding)
                
                const threshold = 160; // Slightly higher threshold for cleaner text
                
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale
                    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    
                    // Contrast (Simple linear)
                    const contrastFactor = 1.2; 
                    const contrast = (avg - 128) * contrastFactor + 128;
                    
                    // Binarization
                    const bin = contrast >= threshold ? 255 : 0;
                    
                    data[i] = bin;
                    data[i + 1] = bin;
                    data[i + 2] = bin;
                }
                ctx.putImageData(imageData, 0, 0);
            }
            resolve(canvas.toDataURL('image/png', 0.8)); // Use JPEG/PNG compression to reduce size slightly
        };
        img.src = URL.createObjectURL(file);
    });
  };

  // Helper to initialize Tesseract Worker once
  const getTesseractWorker = async () => {
      if (tesseractWorkerRef.current) return tesseractWorkerRef.current;
      
      const worker = await createWorker('kor+eng', 1, {
            langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
            logger: m => { if(m.status === 'recognizing text') console.debug(m.progress); },
            errorHandler: err => console.error(err)
      });
      await worker.setParameters({
            tessedit_pageseg_mode: PSM.AUTO,
            tessedit_ocr_engine_mode: 1, // LSTM
      });
      
      tesseractWorkerRef.current = worker;
      return worker;
  };

  // Function to call external PaddleOCR API
  const callPaddleOCR = async (file: File, url: string): Promise<string> => {
      try {
          const base64Data = await new Promise<string>((resolve) => {
             const reader = new FileReader();
             reader.onload = () => resolve((reader.result as string).split(',')[1]);
             reader.readAsDataURL(file);
          });

          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ images: [base64Data] })
          });

          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

          const result = await response.json();
          if (Array.isArray(result.results)) {
               return result.results.map((r: any) => r.text || r).join('\n');
          }
          return JSON.stringify(result); 

      } catch (e: any) {
          console.warn("PaddleOCR Failed:", e);
          return `PaddleOCR 연결 실패:\n${e.message}\n(설정에서 API URL을 확인하세요)`;
      }
  };

  const sanitizeFilename = (name: string) => {
      // Remove characters that are invalid in filenames
      return name.replace(/[^a-zA-Z0-9가-힣\s\-_.]/g, '').trim();
  };

  const saveFile = async (blob: Blob, filename: string, dirHandle?: any) => {
      const safeName = sanitizeFilename(filename);
      if (dirHandle) {
          try {
              const fileHandle = await dirHandle.getFileHandle(safeName, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              return;
          } catch (e) {
              console.error("FileSystem write failed", e);
              // Fallback to download if FS fails
          }
      }
      downloadBlob(blob, safeName);
  };

  const analyzeItem = async (item: OCRFile, dirHandle?: any): Promise<Partial<OCRFile>> => {
      try {
        // AI Skip Logic
        const hasApiKey = !!apiKey;
        let geminiResponse: any = { text: "" };
        let geminiError = "";

        if (hasApiKey) {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(item.file);
            });
            
            incrementApiUsage(); // Track Usage

            const ai = new GoogleGenAI({ apiKey });
            const analysisModel = model;

            let promptText = "";
            let specificInstruction = "";
            const koreanInstruction = "모든 결과 값은 반드시 **한국어(Korean)**로 번역/작성해야 합니다. JSON 값에는 유효한 문자열만 포함하세요.";
            
            const advancedOCRInstruction = `
            당신은 미디어 분석 전문가입니다. 주어진 미디어를 분석하여 요청된 정보를 JSON 형식으로 반환하세요.
            응답은 반드시 유효한 JSON 형식이어야 하며, 마크다운 포맷팅이나 추가 설명을 포함하지 마십시오.
            모든 필드를 가능한 한 충실하게 채우세요. 특히 'summary'는 필수입니다.
            `;

            // Safety check for instructions
            const safeInstructions = { ...DEFAULT_INSTRUCTIONS, ...customInstructions };

            if (item.mediaType === 'image') {
                if (item.analysisMode === 'text') {
                    specificInstruction = safeInstructions.ocr || DEFAULT_INSTRUCTIONS.ocr;
                } else {
                    specificInstruction = safeInstructions.image || DEFAULT_INSTRUCTIONS.image;
                }
            } else if (item.mediaType === 'audio') {
                specificInstruction = safeInstructions.audio || DEFAULT_INSTRUCTIONS.audio;
            } else if (item.mediaType === 'video') {
                specificInstruction = safeInstructions.video || DEFAULT_INSTRUCTIONS.video;
            }

            const systemInstruction = `[기본 규칙]\n${advancedOCRInstruction}\n\n[한국어 지침]\n${koreanInstruction}\n\n[유형별 상세 지침]\n${specificInstruction}`;

            if (item.mediaType === 'image') {
                promptText = "이미지 분석 요청:\n";
                promptText += `다음 필드를 포함하는 순수 JSON 객체를 반환하세요:\n`;
                
                if (imageOcrEnabled) {
                    promptText += `1. extractedText: 이미지 내 모든 텍스트 (없으면 "텍스트 없음")\n`;
                    promptText += `2. text_annotations: 이미지 내의 모든 텍스트 라인에 대한 정밀한 좌표. [{"text": "...", "box_2d": [y_min, x_min, y_max, x_max]}] (좌표 0-1000). 작은 텍스트도 놓치지 마세요.\n`;
                    promptText += `3. correctedText: 텍스트의 오타 수정 및 정제된 버전\n`;
                    promptText += `4. fontStyle: 폰트 스타일 (예: "sans-serif", "serif", "handwriting")\n`;
                } else {
                    promptText += `1. labels: 이미지의 주요 객체나 개념에 대한 레이블 배열 (10개 이상)\n`;
                    promptText += `2. visual_analysis: 이미지의 구도, 색감, 조명 등에 대한 상세한 시각적 분석\n`;
                    promptText += `(OCR은 요청하지 않음. 이미지 내용 분석에 집중하세요)\n`;
                }
                
                promptText += `5. summary: 이미지의 시각적 내용 및 상황에 대한 상세한 한국어 요약\n`;
                promptText += `6. keywords: 핵심 키워드 배열 (5개 이상)\n`;
                promptText += `7. metadata: { description, location, objects, colors, accuracy: "100점 만점 기준의 정확도 점수 (예: 98/100)", confidence: "신뢰도(0-100 숫자)", public_doc: { doc_number, sender, receiver, title, date } }\n`;

            } else if (item.mediaType === 'audio') {
                promptText = "오디오 상세 분석 요청:\n";
                promptText += `다음 필드를 포함하는 순수 JSON 객체를 반환하세요:\n`;
                promptText += `1. correctedText: 전체 오디오 받아쓰기 (STT). 내용을 요약하지 말고 들리는 대로 전체를 전사하세요.\n`;
                promptText += `2. summary: 오디오 내용 요약\n`;
                promptText += `3. keywords: 핵심 키워드\n`;
                promptText += `4. metadata: { description, location, accuracy: "100점 만점 기준의 정확도 점수 (예: 98/100)", confidence: "신뢰도(0-100 숫자)" }\n`;
            } else if (item.mediaType === 'video') {
                promptText = "비디오 상세 분석 요청:\n";
                promptText += `다음 필드를 포함하는 순수 JSON 객체를 반환하세요:\n`;
                promptText += `1. extractedText: 영상의 주요 장면 및 흐름 묘사\n`;
                promptText += `2. correctedText: 음성 대사 또는 화면 자막 추출\n`;
                promptText += `3. summary: 영상 줄거리 요약\n`;
                promptText += `4. keywords: 핵심 키워드\n`;
                promptText += `5. metadata: { description, objects, location, accuracy: "100점 만점 기준의 정확도 점수 (예: 98/100)", confidence: "신뢰도(0-100 숫자)" }\n`;
            }

            try {
                geminiResponse = await ai.models.generateContent({
                    model: analysisModel,
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: item.file.type } },
                            { text: promptText }
                        ]
                    },
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        // Increase precision by lowering temperature
                        temperature: 0.1, 
                        topP: 0.95,
                        topK: 40,
                    }
                });
            } catch (err: any) {
                geminiError = err.message;
                // If API limit or key error, proceed but mark as error text
                if (err.message.includes("429") || err.message.includes("quota")) {
                    geminiResponse = { text: JSON.stringify({ summary: "API 할당량 초과로 AI 분석 실패", metadata: {} }) };
                } else {
                     geminiResponse = { text: JSON.stringify({ summary: "AI 분석 오류: " + err.message, metadata: {} }) };
                }
            }
        } else {
            // No API Key - Skip Gemini but allow OCR
            geminiResponse = { text: JSON.stringify({ 
                summary: "API 키가 설정되지 않아 AI 분석을 건너뛰었습니다.", 
                textGemini: "AI 분석 비활성화 상태",
                keywords: [],
                metadata: {} 
            }) };
        }

        // --- OCR ENGINE EXECUTION (Only if imageOcrEnabled is true) ---
        const ocrPromise = (async (): Promise<{tess: string, paddle: string}> => {
            const result = { tess: "", paddle: "" };
            
            if (item.mediaType === 'image' && imageOcrEnabled && (item.analysisMode === 'text' || item.analysisMode === 'all')) {
                // Case 1: Tesseract (Local) - Optimized for speed
                if (ocrEngine === 'tesseract') {
                    try {
                        const worker = await getTesseractWorker();
                        const processedImageUrl = await preprocessImage(item.file);
                        const ret = await worker.recognize(processedImageUrl);
                        result.tess = ret.data.text;
                    } catch (err) { 
                        console.warn("Tesseract Error:", err); 
                        result.tess = "Tesseract 오류: " + err;
                        // Reset worker in case of error
                        if(tesseractWorkerRef.current) {
                            await tesseractWorkerRef.current.terminate();
                            tesseractWorkerRef.current = null;
                        }
                    }
                } 
                // Case 2: PaddleOCR (API)
                else if (ocrEngine === 'paddle') {
                    result.paddle = await callPaddleOCR(item.file, paddleUrl);
                }
            }
            return result;
        })();

        // Execute OCR regardless of API key presence
        const ocrResult = await ocrPromise;

        const rawText = geminiResponse.text || "{}";
        let json: any = {};
        
        try {
            json = JSON.parse(rawText);
        } catch (parseError) {
            let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }
            try {
                json = JSON.parse(cleanText);
            } catch (finalError) {
                console.error("JSON Parse Logic Failed completely:", finalError);
                json = { 
                    extractedText: rawText, 
                    summary: "데이터 형식 변환에 실패했습니다. (전체 텍스트 참조)",
                    correctedText: rawText, 
                    metadata: { accuracy: "JSON Parsing Error", description: "분석 결과를 파싱할 수 없습니다." }
                };
            }
        }

        if (!json.summary) json.summary = "요약 정보가 없습니다.";
        if (!json.metadata) json.metadata = {};
        if (!json.keywords) json.keywords = [];
        
        // Handle no-OCR detailed analysis fallback
        if (!imageOcrEnabled && item.mediaType === 'image') {
            if (json.labels) json.keywords = [...json.keywords, ...json.labels];
            if (json.visual_analysis) json.textGemini = json.visual_analysis; // Use textGemini slot for visual analysis
        } else {
            json.textGemini = json.extractedText || "";
        }

        const ocrBlocks: OCRBlock[] = [];
        if (json.text_annotations && Array.isArray(json.text_annotations)) {
            json.text_annotations.forEach((anno: any) => {
                // Ensure text is not empty and box exists
                if (anno.text && String(anno.text).trim() !== "" && anno.box_2d && anno.box_2d.length === 4) {
                    ocrBlocks.push({
                        text: String(anno.text),
                        confidence: 100,
                        bbox: {
                            // Robust clamping to avoid out of bounds boxes
                            y0: Math.max(0, Math.min(1000, Number(anno.box_2d[0]))),
                            x0: Math.max(0, Math.min(1000, Number(anno.box_2d[1]))),
                            y1: Math.max(0, Math.min(1000, Number(anno.box_2d[2]))),
                            x1: Math.max(0, Math.min(1000, Number(anno.box_2d[3])))
                        }
                    });
                }
            });
        }
        
        const autoResults: Record<string, string> = {};

        const runStudioTask = async (tabId: string, prompt: string) => {
             if (!hasApiKey) {
                 autoResults[tabId] = "API 키가 필요합니다.";
                 return;
             }
             try {
                 await new Promise(r => setTimeout(r, 500));
                 autoResults[tabId] = await fetchStudioResult(item, tabId, prompt, apiKey);
             } catch (err) {
                 autoResults[tabId] = "자동 생성 실패";
             }
        };

        if (hasApiKey) {
            if (item.mediaType === 'image') {
                if (autoConfig.sns) await runStudioTask('sns', STUDIO_PROMPTS.sns);
                if (autoConfig.alt) await runStudioTask('alt', STUDIO_PROMPTS.alt);
                if (autoConfig.json) await runStudioTask('json', STUDIO_PROMPTS.json);
            } else if (item.mediaType === 'video') {
                if (autoConfig.youtube) await runStudioTask('youtube', STUDIO_PROMPTS.youtube);
                if (autoConfig.timeline) await runStudioTask('timeline', STUDIO_PROMPTS.timeline);
            } else if (item.mediaType === 'audio') {
                if (autoConfig.meeting) await runStudioTask('meeting', STUDIO_PROMPTS.meeting);
                if (autoConfig.todo) await runStudioTask('todo', STUDIO_PROMPTS.todo);
            }
        }
        
        const finalResult: Partial<OCRFile> = {
            status: 'done',
            textGemini: json.textGemini || "",
            textCorrected: json.correctedText || "",
            textTesseract: ocrResult.tess,
            textPaddle: ocrResult.paddle,
            ocrData: ocrBlocks,
            fontStyle: json.fontStyle || "sans-serif",
            summary: json.summary || "",
            keywords: json.keywords || [],
            metadata: json.metadata || {},
            chatHistory: [], 
            studioResults: autoResults,
            generatedImageUrl: ""
        };

        // --- Auto Save Logic ---
        if (autoConfig.word || autoConfig.markdown || autoConfig.csv) {
            setTimeout(() => {
                const now = new Date();
                const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); 
                const originalName = item.file.name;
                const lastDot = originalName.lastIndexOf('.');
                const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
                const tempItem = { ...item, ...finalResult } as OCRFile;

                if (autoConfig.word) {
                    const fileName = `${baseName}_${timestamp}.doc`;
                    const htmlContent = generateWordContent(tempItem);
                    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word;charset=utf-8' });
                    saveFile(blob, fileName, dirHandle);
                }

                if (autoConfig.markdown) {
                    const fileName = `${baseName}_${timestamp}.md`;
                    const mdContent = generateMarkdownContent(tempItem);
                    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
                    saveFile(blob, fileName, dirHandle);
                }

                if (autoConfig.csv) {
                    const fileName = `${baseName}_${timestamp}.csv`;
                    const csvContent = generateCSVContent(tempItem);
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    saveFile(blob, fileName, dirHandle);
                }
            }, 100);
        }

        return finalResult;

      } catch (e: any) {
          console.error(e);
          let errorMsg = e.message || "알 수 없는 오류가 발생했습니다.";
          return {
              status: 'error',
              errorMsg: errorMsg
          };
      }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
      const safeName = sanitizeFilename(filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleStopProcess = () => {
      if (confirm("분석을 중지하시겠습니까? 현재 진행 중인 항목이 완료된 후 중지됩니다.")) {
          shouldStopRef.current = true;
      }
  };

  const startBatchProcess = async () => {
    // If no API key, check if we can proceed with just OCR (for images)
    // For Video/Audio, we really need the API.
    const hasApiKey = !!apiKey;
    
    // Check if there are non-image files selected
    const hasNonImages = items.some(i => i.mediaType !== 'image');
    
    if (!hasApiKey && hasNonImages) {
        if(confirm("API 키가 없습니다. 동영상/오디오 분석을 위해서는 키가 필요합니다. 설정으로 이동하시겠습니까?")) {
            setCurrentView('settings');
            return;
        }
    }
    
    if (!hasApiKey && !hasNonImages) {
        // Only images, warn that AI features will be off
        // Optional: show toast or small warning
    }

    let dirHandle: any = null;
    // Check if any auto-save option is enabled
    const isAutoSaveEnabled = autoConfig.word || autoConfig.markdown || autoConfig.csv;
    
    if (autoConfig.saveLocation === 'custom' && isAutoSaveEnabled) {
        try {
            // @ts-ignore
            if (window.showDirectoryPicker) {
                 // @ts-ignore
                 dirHandle = await window.showDirectoryPicker();
            } else {
                alert("이 브라우저는 폴더 직접 저장을 지원하지 않습니다. 기본 다운로드 폴더를 사용합니다.");
            }
        } catch (e) {
            // User cancelled
            return;
        }
    }

    if (isProcessing) return;
    
    setIsProcessing(true);
    shouldStopRef.current = false;
    
    const itemsToProcess = items.filter(i => i.status === 'idle' || i.status === 'error');
    const total = itemsToProcess.length;
    
    if (total === 0) {
        setIsProcessing(false);
        return;
    }

    // Reset Progress & Timer
    setProgressStats({ current: 0, total, percentage: 0 });
    setElapsedTime('00:00');
    setTotalDuration('');
    startTimeRef.current = Date.now();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(formatTime(sec));
    }, 1000);

    // Mobile: Close sidebars to show progress
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);

    let completed = 0;
    for (const item of itemsToProcess) {
        // Check stop signal before starting next item
        if (shouldStopRef.current) {
            break;
        }

        // Update selected ID to the current item being processed
        setSelectedId(item.id);
        
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
        const result = await analyzeItem(item, dirHandle);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...result } as OCRFile : i));

        completed++;
        setProgressStats({ 
            current: completed, 
            total, 
            percentage: Math.round((completed / total) * 100) 
        });
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
    const totalSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTotalDuration(formatTime(totalSec));
    setIsProcessing(false);
  };

  const clearAll = () => {
    if (confirm("목록을 초기화 하시겠습니까? (설정 및 API 키는 유지됩니다)")) {
        // Revoke URLs to avoid memory leaks
        items.forEach(i => {
            if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
            if (i.generatedImageUrl) URL.revokeObjectURL(i.generatedImageUrl);
        });
        setItems([]);
        setSelectedId(null);
        setProgressStats({ current: 0, total: 0, percentage: 0 });
        setElapsedTime('00:00');
        setTotalDuration('');
    }
  };

  const exportCSV = () => {
    const BOM = '\uFEFF';
    // Add Auto Generated Columns + Detailed Metadata from Report
    const header = "파일명,타입,모드,상태,요약,키워드,인식객체,주요색상,장소,정확도,신뢰도(점수),문서번호,발신,수신,제목,생산부서,생산일자,분석내용(Raw),분석내용(Corrected),SNS홍보,대체텍스트,JSON결과,유튜브,타임라인,회의록,할일\n";
    
    const rows = items.map(item => {
        const escape = (str: string | undefined | null) => (str || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const meta = item.metadata || {};
        const pub = meta.public_doc || {};
        const sr = item.studioResults || {};
        
        return `"${escape(item.file.name)}","${item.mediaType}","${item.analysisMode}","${item.status}","${escape(item.summary)}","${escape((item.keywords || []).join(', '))}","${escape((meta.objects || []).join(', '))}","${escape((meta.colors || []).join(', '))}","${escape(meta.location)}","${escape(meta.accuracy)}","${meta.confidence ?? ''}","${escape(pub.doc_number)}","${escape(pub.sender)}","${escape(pub.receiver)}","${escape(pub.title)}","${escape(pub.department)}","${escape(pub.date)}","${escape(item.textGemini)}","${escape(item.textCorrected)}","${escape(sr.sns)}","${escape(sr.alt)}","${escape(sr.json)}","${escape(sr.youtube)}","${escape(sr.timeline)}","${escape(sr.meeting)}","${escape(sr.todo)}"`
    }).join("\n");
    
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analysis_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const generateMarkdownContent = (item: OCRFile): string => {
      let md = `# ${item.file.name}\n\n`;
      const pub = item.metadata?.public_doc;
      
      if (pub && Object.values(pub).some(v => v)) {
          md += `## 공공기관 문서 정보\n`;
          md += `| 항목 | 내용 |\n|---|---|\n`;
          if (pub.doc_number) md += `| 문서번호 | ${pub.doc_number} |\n`;
          if (pub.date) md += `| 생산일자 | ${pub.date} |\n`;
          if (pub.sender) md += `| 발신 | ${pub.sender} |\n`;
          if (pub.receiver) md += `| 수신 | ${pub.receiver} |\n`;
          md += `\n`;
      }

      md += `## 요약\n${item.summary}\n\n`;
      md += `## 분석 내용\n${item.textCorrected || item.textGemini}\n\n`;
      if (item.keywords && item.keywords.length > 0) {
          md += `## 키워드\n${item.keywords.join(', ')}`;
      }
      return md;
  };

  const generateCSVContent = (item: OCRFile): string => {
      const BOM = '\uFEFF';
      const escape = (str: string | undefined | null) => (str || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const meta = item.metadata || {};
      const pub = meta.public_doc || {};
      
      const header = "파일명,요약,키워드,장소,정확도,문서번호,발신,수신,제목,생산일자,분석내용\n";
      const row = `"${escape(item.file.name)}","${escape(item.summary)}","${escape((item.keywords || []).join(', '))}","${escape(meta.location)}","${escape(meta.accuracy)}","${escape(pub.doc_number)}","${escape(pub.sender)}","${escape(pub.receiver)}","${escape(pub.title)}","${escape(pub.date)}","${escape(item.textCorrected || item.textGemini)}"`;
      
      return BOM + header + row;
  };

  // Function to generate simple HTML content for Word export
  const generateWordContent = (item: OCRFile): string => {
      const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const title = escapeHtml(item.metadata?.public_doc?.title || item.file.name);
      
      let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
          body { font-family: 'Malgun Gothic', 'Batang', serif; line-height: 1.6; }
          h1 { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f3f4f6; border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 100px; }
          td { border: 1px solid #000; padding: 5px; }
          .summary-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; margin-bottom: 20px; color: #1e3a8a; }
          .content-body { white-space: pre-wrap; text-align: justify; }
          .bold { font-weight: bold; }
      </style>
      </head><body>`;
      
      html += `<h1>${title}</h1>`;
      
      const pub = item.metadata?.public_doc || {};
      const meta = item.metadata || {};

      // Metadata Table
      html += `<table><tbody>`;
      html += `<tr><th>문서번호</th><td>${escapeHtml(pub.doc_number || "-")}</td><th>일자</th><td>${escapeHtml(pub.date || "-")}</td></tr>`;
      html += `<tr><th>수신</th><td>${escapeHtml(pub.receiver || "-")}</td><th>발신</th><td>${escapeHtml(pub.sender || "-")}</td></tr>`;
      html += `<tr><th>장소</th><td colspan="3">${escapeHtml(meta.location || "-")}</td></tr>`;
      html += `</tbody></table>`;

      // Summary
      if (item.summary) {
          html += `<div class="summary-box"><b>[요약]</b><br/>${escapeHtml(item.summary)}</div>`;
      }

      // Main Text Content
      const content = item.textCorrected || item.textGemini || "";
      // Simple Markdown Bold parsing
      const formattedContent = escapeHtml(content)
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replace(/\n/g, "<br/>");

      html += `<h3>[본문 내용]</h3><div class="content-body">${formattedContent}</div>`;
      
      // Keywords
      if (item.keywords && item.keywords.length > 0) {
          html += `<p style="margin-top:20px; color: #666;"><b>Keywords:</b> ${item.keywords.map(k => "#" + escapeHtml(k)).join(" ")}</p>`;
      }

      html += `</body></html>`;
      return html;
  };

  const handleDownloadWord = () => {
      const selectedItem = items.find(i => i.id === selectedId);
      if (!selectedItem || !selectedItem.status.includes('done')) {
          alert("완료된 항목을 선택해주세요.");
          return;
      }

      const htmlContent = generateWordContent(selectedItem);
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create filename same as image but with .doc
      const originalName = selectedItem.file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const fileName = `${baseName}.doc`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
      const selectedItem = items.find(i => i.id === selectedId);
      if (!selectedItem || !selectedItem.status.includes('done')) {
          alert("완료된 항목을 선택해주세요.");
          return;
      }

      const mdContent = generateMarkdownContent(selectedItem);
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const originalName = selectedItem.file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const fileName = `${baseName}.md`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const text = ev.target?.result as string;
              const json = JSON.parse(text);
              setJsonViewerData(json);
              setJsonFileName(file.name);
              setIsJsonViewerOpen(true);
          } catch (err) {
              alert("유효한 JSON 파일이 아닙니다.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleOpenViewer = () => {
    setIsJsonViewerOpen(true);
  };

  const filteredItems = items.filter(item => filter === 'all' || item.status === filter);
  const selectedItem = items.find(i => i.id === selectedId);

  // Calculate finished items count for header
  const finishedCount = items.filter(i => i.status === 'done').length;

  if (currentView === 'landing') {
      return (
        <LandingPage 
            onEnter={() => setCurrentView('workspace')} 
            onSettings={() => {
                setPreviousView('landing');
                setCurrentView('settings');
            }}
        />
      );
  }

  return (
    <div className="flex flex-col h-full bg-surface-subtle/50 transition-colors duration-300 backdrop-blur-sm">
      {/* Hide main header if viewing settings from landing page */}
      {!(currentView === 'settings' && previousView === 'landing') && (
          <Header 
            onSettingsClick={() => {
                setPreviousView('workspace');
                setCurrentView('settings');
            }}
            onLogoClick={() => setCurrentView('landing')}
            onClear={clearAll}
            onExport={exportCSV}
            onStartProcess={startBatchProcess}
            onStopProcess={handleStopProcess}
            onImportJSON={handleOpenViewer} 
            onDownloadWord={handleDownloadWord} 
            onDownloadMarkdown={handleDownloadMarkdown}
            isProcessing={isProcessing}
            hasItems={items.length > 0}
            hasFinishedItems={items.some(i => i.status === 'done')}
            filter={filter}
            setFilter={setFilter}
            currentView={currentView}
            
            onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
            onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}

            progressStats={progressStats}
            elapsedTime={elapsedTime}
            totalDuration={totalDuration}
            finishedCount={finishedCount}
            
            apiUsage={{ used: apiUsage, limit: DAILY_QUOTA_LIMIT }}
          />
      )}
      
      {/* Hidden file input for shortcut support */}
      <input 
        id="hidden-app-file-input"
        type="file" 
        multiple
        accept="image/*,video/*,audio/*"
        style={{ display: 'none' }}
        onChange={(e) => processFiles(e.target.files)}
        ref={mainFileInputRef}
      />

      <input 
        type="file" 
        ref={jsonInputRef} 
        accept=".json,application/json" 
        style={{ display: 'none' }} 
        onChange={handleJsonUpload}
      />

      <JsonViewerModal 
        isOpen={isJsonViewerOpen}
        onClose={() => { setIsJsonViewerOpen(false); setJsonViewerData(null); setJsonFileName(''); }}
        data={jsonViewerData}
        fileName={jsonFileName}
        onUploadClick={() => jsonInputRef.current?.click()}
      />
      
      <ImageEditorModal
        isOpen={!!editingFileId}
        onClose={() => { setEditingFileId(null); setEditorImageUrl(''); }}
        imageUrl={editorImageUrl}
        onSave={handleSaveEditedImage}
      />
      
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        {currentView === 'workspace' ? (
            <>
                <LeftSidebar 
                    items={filteredItems}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); setLeftSidebarOpen(false); }}
                    onUpload={processFiles}
                    onDelete={deleteFiles}
                    isOpen={leftSidebarOpen}
                    onClose={() => setLeftSidebarOpen(false)}
                />
                <MainWorkspace 
                    currentItem={selectedItem} 
                    onGenerate={generateAIContent}
                    onModeChange={updateAnalysisMode}
                    onStudioGenerate={generateStudioContent}
                    onEditImage={handleOpenImageEditor}
                    currentOcrEngine={ocrEngine}
                />
                <RightSidebar 
                    item={selectedItem} 
                    isOpen={rightSidebarOpen}
                    onClose={() => setRightSidebarOpen(false)}
                />
            </>
        ) : (
            <div className="w-full h-full">
                <SettingsPage 
                    currentKey={apiKey}
                    currentModel={model}
                    currentAutoConfig={autoConfig}
                    currentOcrEngine={ocrEngine}
                    currentPaddleUrl={paddleUrl}
                    currentInstructions={customInstructions}
                    currentImageOcrEnabled={imageOcrEnabled}
                    currentTheme={theme}
                    onSave={handleSaveSettings}
                    onBack={() => setCurrentView(previousView)}
                />
            </div>
        )}
      </div>
    </div>
  );
};
export default App;