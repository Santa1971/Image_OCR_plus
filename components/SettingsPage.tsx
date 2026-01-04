import React, { useState, useEffect, useRef } from 'react';
import { AutoConfig, OCREngine, SystemInstructions, PromptTemplate, AppTheme } from '../types';
import { PromptBuilderModal } from './PromptBuilderModal';

interface SettingsPageProps {
  currentKey: string;
  currentModel: string;
  currentAutoConfig: AutoConfig;
  currentOcrEngine?: OCREngine;
  currentPaddleUrl?: string;
  currentInstructions?: SystemInstructions;
  currentImageOcrEnabled?: boolean;
  currentTheme?: AppTheme;
  onSave: (key: string, model: string, autoConfig: AutoConfig, ocrEngine: OCREngine, paddleUrl: string, instructions: SystemInstructions, imageOcrEnabled: boolean, theme: AppTheme) => void;
  onBack: () => void;
}

const DEFAULT_INSTRUCTIONS: SystemInstructions = {
    ocr: "[역할]\n전문 데이터 입력 담당자\n\n[작업]\n이미지 내 텍스트를 보이는 그대로 정확하게 추출하십시오. 오타나 깨진 글자는 문맥을 파악하여 보정하고, 문단과 표 형식을 유지하세요.\n\n[출력 형식]\nJSON 형식 (extractedText, correctedText 포함)",
    image: "[역할]\n시각 예술 비평가 및 마케팅 카피라이터\n\n[작업]\n이미지의 구도, 조명, 색감, 피사체의 표정과 분위기를 상세히 묘사하고, 시각장애인을 위한 대체 텍스트(Alt Text) 수준으로 정보를 제공하세요.",
    audio: "[역할]\n전문 속기사 및 회의록 작성자\n\n[작업]\n오디오 내용을 빠짐없이 전사(Full Verbatim)하고, 화자를 구분하여 대화 흐름을 정리하세요. 핵심 안건과 결정 사항을 요약하세요.",
    video: "[역할]\n영상 콘텐츠 분석가\n\n[작업]\n영상의 타임라인별 주요 사건을 정리하고, 시각적 흐름과 내레이션을 통합하여 분석하세요. 유튜브 업로드용 제목과 설명도 제안하세요."
};

const PRESETS: Record<keyof SystemInstructions, { label: string, text: string }[]> = {
    ocr: [
        { 
            label: "공문서 정밀 분석", 
            text: "[역할]\n행정 문서 처리 전문가\n\n[작업]\n공문서의 수신, 발신, 문서번호, 날짜, 본문 내용을 구조화하여 추출하세요.\n\n[문맥]\n이 데이터는 회사의 전자결재 시스템에 자동 등록됩니다.\n\n[제약 사항]\n없는 내용을 지어내지 말고, 직인이나 서명 유무도 확인하세요." 
        },
        { 
            label: "영수증/재무 데이터", 
            text: "[역할]\n회계 감사관\n\n[작업]\n영수증의 상호명, 사업자번호, 거래일시, 품목별 단가 및 총액을 추출하세요.\n\n[출력 형식]\nJSON 형식으로 금액은 숫자형(Number)으로 변환하여 제공하세요." 
        },
        { 
            label: "손글씨 메모 복원", 
            text: "[역할]\n고문서 복원 전문가\n\n[작업]\n흘림체나 악필로 작성된 손글씨 메모를 해독하여 디지털 텍스트로 변환하세요.\n\n[제약 사항]\n판독이 불가능한 글자는 [판독불가]로 표기하고, 문맥상 가장 적절한 단어를 추론하여 괄호 안에 병기하세요." 
        }
    ],
    image: [
        { 
            label: "인스타그램 감성 분석", 
            text: "[역할]\n소셜 미디어 인플루언서\n\n[작업]\n이 사진의 분위기와 감성을 분석하고, 인스타그램에 올릴 때 반응이 좋을 만한 감성적인 캡션과 해시태그 15개를 생성하세요." 
        },
        { 
            label: "상품 상세 페이지용", 
            text: "[역할]\n이커머스 MD\n\n[작업]\n상품 이미지의 재질, 디자인 특징, 사용 용도, 장점을 분석하여 쇼핑몰 상세 페이지에 들어갈 소구 포인트(Selling Point)를 작성하세요." 
        },
        { 
            label: "뉴스 보도용 팩트", 
            text: "[역할]\n사진기자\n\n[작업]\n사진 속 상황을 육하원칙(누가, 언제, 어디서, 무엇을, 어떻게, 왜)에 입각하여 객관적인 사실 위주로 설명하세요. 주관적인 감정 표현은 배제하세요." 
        }
    ],
    audio: [
        { 
            label: "회의록 (Action Item 중심)", 
            text: "[역할]\n프로젝트 매니저\n\n[작업]\n회의 내용을 요약하고, 누가 언제까지 무엇을 해야 하는지 'Action Item'을 명확히 추출하여 표 형식으로 정리하세요." 
        },
        { 
            label: "강의 요약 및 노트", 
            text: "[역할]\n우등생\n\n[작업]\n강의 내용을 핵심 개념 위주로 요약하고, 복습하기 좋은 구조화된 필기 노트(Bullet points) 형식으로 정리하세요." 
        },
        { 
            label: "고객 상담 분석", 
            text: "[역할]\nCS 품질 관리자\n\n[작업]\n고객의 불만 사항과 요구 사항을 정확히 파악하고, 상담원의 응대 태도와 해결 과정을 분석하여 개선점을 제안하세요." 
        }
    ],
    video: [
        { 
            label: "유튜브 챕터/타임스탬프", 
            text: "[역할]\n유튜브 채널 관리자\n\n[작업]\n영상의 내용을 분석하여 시청자가 보기 편하도록 주요 주제가 바뀌는 지점마다 타임스탬프와 소제목(챕터)을 생성하세요." 
        },
        { 
            label: "숏폼(Shorts) 기획", 
            text: "[역할]\n바이럴 마케터\n\n[작업]\n이 긴 영상에서 가장 도파민을 자극하거나 화제가 될 만한 1분 미만의 하이라이트 구간을 3군데 선정하고, 숏폼 제목을 지어주세요." 
        }
    ]
};

const THEMES: { id: AppTheme, name: string, color: string, bg: string }[] = [
    { id: 'default', name: 'Dark Indigo', color: '#4f46e5', bg: '#1e293b' },
    { id: 'midnight', name: 'Midnight', color: '#8b5cf6', bg: '#020617' },
    { id: 'nature', name: 'Nature', color: '#059669', bg: '#14532d' },
    { id: 'ocean', name: 'Ocean', color: '#0284c7', bg: '#0c4a6e' },
    { id: 'sunset', name: 'Sunset', color: '#f43f5e', bg: '#881337' },
];

type SettingsTab = 'general' | 'automation' | 'instructions' | 'data';

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    currentKey, 
    currentModel, 
    currentAutoConfig, 
    currentOcrEngine = 'tesseract', 
    currentPaddleUrl = 'http://localhost:8000/ocr',
    currentInstructions,
    currentImageOcrEnabled = true,
    currentTheme = 'default',
    onSave, 
    onBack 
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');
  const [isDirty, setIsDirty] = useState(false);

  const [key, setKey] = useState(currentKey);
  const [model, setModel] = useState(currentModel);
  const [autoConfig, setAutoConfig] = useState<AutoConfig>(currentAutoConfig);
  const [ocrEngine, setOcrEngine] = useState<OCREngine>(currentOcrEngine);
  const [paddleUrl, setPaddleUrl] = useState(currentPaddleUrl);
  const [theme, setTheme] = useState<AppTheme>(currentTheme);
  
  const [instructions, setInstructions] = useState<SystemInstructions>(currentInstructions || DEFAULT_INSTRUCTIONS);
  const [activeInstructionTab, setActiveInstructionTab] = useState<keyof SystemInstructions>('ocr');
  const [imageOcrEnabled, setImageOcrEnabled] = useState(currentImageOcrEnabled);

  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [cloudTemplates, setCloudTemplates] = useState<PromptTemplate[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setIsDirty(false);
    const gsUrl = localStorage.getItem('google_sheet_url');
    if (gsUrl) setGoogleSheetUrl(gsUrl);
  }, []);

  const markDirty = () => setIsDirty(true);

  // --- Cloud Sync ---
  const fetchCloudTemplates = async () => {
      if (!googleSheetUrl) {
          alert("URL을 입력해주세요.");
          return;
      }
      setIsCloudLoading(true);
      try {
          const response = await fetch(`${googleSheetUrl}?action=read&t=${Date.now()}`);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data)) {
              setCloudTemplates(result.data.reverse());
              setMessage({ text: `${result.data.length}개의 템플릿을 가져왔습니다.`, type: 'success' });
          } else {
              throw new Error(result.message || "데이터 형식이 올바르지 않습니다.");
          }
      } catch (e: any) {
          console.error("Failed to fetch templates:", e);
          setMessage({ text: `가져오기 실패: ${e.message}`, type: 'error' });
      } finally {
          setIsCloudLoading(false);
      }
  };

  const handleSaveToCloud = async (contentToSave: string, labelToSave?: string) => {
      if (!googleSheetUrl) {
          alert("먼저 Google Sheets 설정을 완료해주세요.");
          return;
      }
      const label = labelToSave || prompt("템플릿 이름을 입력하세요:");
      if (!label) return;

      try {
          const payload = {
              action: 'create',
              category: activeInstructionTab,
              label: label,
              content: contentToSave
          };
          const response = await fetch(googleSheetUrl, {
              method: 'POST',
              body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (result.status === 'success') {
             setMessage({ text: '구글 시트에 저장되었습니다.', type: 'success' });
             fetchCloudTemplates();
          } else {
             throw new Error(result.message);
          }
      } catch (e: any) {
          alert("저장 실패: " + e.message);
      }
  };

  const handleDeleteFromCloud = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("정말 이 템플릿을 삭제하시겠습니까?")) return;
      try {
          const payload = { action: 'delete', id: id };
          const response = await fetch(googleSheetUrl, {
              method: 'POST',
              body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (result.status === 'success') fetchCloudTemplates();
          else throw new Error(result.message);
      } catch (e: any) {
          alert("삭제 실패: " + e.message);
      }
  };

  // --- CSV Parser (Full Text State Machine) ---
  const parseCSV = (text: string) => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (inQuotes) {
              if (char === '"' && nextChar === '"') {
                  currentVal += '"';
                  i++; // Skip the second quote
              } else if (char === '"') {
                  inQuotes = false;
              } else {
                  currentVal += char;
              }
          } else {
              if (char === '"') {
                  inQuotes = true;
              } else if (char === ',') {
                  currentRow.push(currentVal);
                  currentVal = '';
              } else if (char === '\r' || char === '\n') {
                  if (char === '\r' && nextChar === '\n') {
                      i++; // Handle CRLF
                  }
                  currentRow.push(currentVal);
                  if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                      rows.push(currentRow);
                  }
                  currentRow = [];
                  currentVal = '';
              } else {
                  currentVal += char;
              }
          }
      }
      
      // Push last row if exists
      if (currentVal || currentRow.length > 0) {
          currentRow.push(currentVal);
          rows.push(currentRow);
      }
      return rows;
  };

  const handleDownloadSampleCSV = () => {
      // 3-column format for simple user creation
      const header = "category,label,content\n";
      const sampleRow = `"ocr","영수증 처리","[역할] 회계 담당자\n[작업] 영수증의 날짜, 금액, 상호명을 추출하세요."\n"image","SNS 마케팅","[역할] 마케터\n[작업] 인스타그램 감성으로 작성하세요."`;
      
      const bom = "\uFEFF";
      const blob = new Blob([bom + header + sampleRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_sample.csv`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
      if (cloudTemplates.length === 0) {
          alert("내보낼 템플릿 데이터가 없습니다.");
          return;
      }
      // Export in simple format (category, label, content)
      const header = "category,label,content\n";
      const rows = cloudTemplates.map(t => {
          const escapedContent = (t.content || '').replace(/"/g, '""');
          return `"${t.category}","${t.label}","${escapedContent}"`;
      }).join("\n");

      const bom = "\uFEFF";
      const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_ocr_templates_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      
      reader.onload = async (ev) => {
          try {
              const buffer = ev.target?.result as ArrayBuffer;
              const decoder = new TextDecoder('utf-8', { fatal: true });
              let text;
              
              try {
                  text = decoder.decode(buffer);
              } catch (e) {
                  // Fallback for Korean Windows encoded CSVs (EUC-KR)
                  console.warn("UTF-8 decoding failed, trying EUC-KR");
                  const legacyDecoder = new TextDecoder('euc-kr');
                  text = legacyDecoder.decode(buffer);
              }

              if (!text) throw new Error("File content is empty");

              // Robust parsing handling multi-line strings
              const rawRows = parseCSV(text);
              const newTemplates: PromptTemplate[] = [];
              
              // Start from index 1 to skip header (assuming index 0 is header)
              for (let i = 1; i < rawRows.length; i++) {
                  const cols = rawRows[i];
                  if (!cols || cols.length < 3) continue;
                  
                  // Support both 3-column (simple) and 5-column (full) formats
                  let categoryRaw = "";
                  let label = "";
                  let content = "";
                  
                  if (cols.length === 3) {
                      categoryRaw = cols[0];
                      label = cols[1];
                      content = cols[2];
                  } else if (cols.length >= 4) {
                      // Assume id, category, label, content format (exported format)
                      categoryRaw = cols[1];
                      label = cols[2];
                      content = cols[3];
                  }

                  // Normalize Category
                  let categoryNormalized = categoryRaw.trim().toLowerCase();
                  if (categoryNormalized === 'txt' || categoryNormalized === 'text') categoryNormalized = 'ocr';
                  if (categoryNormalized === 'img' || categoryNormalized === 'photo') categoryNormalized = 'image';
                  if (categoryNormalized === 'sound') categoryNormalized = 'audio';
                  if (categoryNormalized === 'vid' || categoryNormalized === 'movie') categoryNormalized = 'video';

                  if (['ocr', 'image', 'audio', 'video'].includes(categoryNormalized)) {
                      newTemplates.push({
                          id: Math.random().toString(36).substr(2, 9),
                          category: categoryNormalized as keyof SystemInstructions,
                          label: label,
                          content: content,
                          created_at: new Date().toISOString()
                      });
                  }
              }

              if (newTemplates.length > 0) {
                  setCloudTemplates(prev => [...prev, ...newTemplates]);
                  setMessage({ text: `${newTemplates.length}개의 템플릿을 불러왔습니다.`, type: 'success' });
                  markDirty();
              } else {
                  alert("유효한 데이터가 없습니다. CSV 형식을 확인해주세요.");
              }
          } catch (err) {
              console.error(err);
              alert("파일을 읽는 중 오류가 발생했습니다. 인코딩 또는 형식을 확인하세요.");
          }
      };
      
      reader.readAsArrayBuffer(file);
      e.target.value = '';
  };

  const handleSave = () => {
    if (!isDirty) return;

    const trimmedKey = key.trim();
    if (!trimmedKey) {
        if (confirm("API 키를 삭제하시겠습니까? 이렇게 하면 AI 기능을 비활성화하지만 Tesseract OCR은 계속 사용할 수 있습니다.")) {
            onSave('', model, autoConfig, ocrEngine, paddleUrl, instructions, imageOcrEnabled, theme);
            setMessage({ text: 'API 키가 삭제되었습니다.', type: 'success' });
            setIsDirty(false);
        }
        return;
    }

    if (!trimmedKey.startsWith('AIza')) {
        setMessage({ text: '경고: 올바르지 않은 API 키 형식일 수 있습니다.', type: 'error' });
    }

    localStorage.setItem('google_sheet_url', googleSheetUrl.trim());

    onSave(trimmedKey, model, autoConfig, ocrEngine, paddleUrl, instructions, imageOcrEnabled, theme);
    setMessage({ text: '설정이 안전하게 저장되었습니다.', type: 'success' });
    setIsDirty(false);
    
    setTimeout(() => setMessage(null), 1500);
  };

  const handleAutoToggle = (field: keyof AutoConfig) => {
      setAutoConfig(prev => ({ ...prev, [field]: !prev[field] }));
      markDirty();
  };

  const handleSaveLocationChange = (val: 'default' | 'custom') => {
      setAutoConfig(prev => ({ ...prev, saveLocation: val }));
      markDirty();
  };

  const models = [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (속도/정확도 최적 - 추천)' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (최신 모델)' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (복잡한 추론용)' },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro (실험적 기능)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ];

  const instructionTabs: { id: keyof SystemInstructions, label: string, icon: string }[] = [
      { id: 'ocr', label: 'OCR 추출', icon: 'document_scanner' },
      { id: 'image', label: '이미지 분석', icon: 'image' },
      { id: 'audio', label: '오디오', icon: 'graphic_eq' },
      { id: 'video', label: '동영상', icon: 'movie' },
  ];

  const currentCategoryTemplates = cloudTemplates.filter(t => t.category === activeInstructionTab);

  const renderTabContent = () => {
      switch(activeSettingsTab) {
          case 'general':
              return (
                <div className="flex flex-col gap-8 animate-fade-in">
                    {/* API Key */}
                    <section className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <label className="text-base font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">key</span>
                                Google Gemini API 키
                            </label>
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline"
                            >
                                키 발급받기
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                        </div>
                        <div className="relative">
                            <input 
                                type={isVisible ? "text" : "password"}
                                value={key}
                                onChange={(e) => { setKey(e.target.value); markDirty(); }}
                                placeholder="AIza... (입력하지 않으면 AI 기능은 비활성화됩니다)"
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-surface-hover/50 focus:bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm text-text-main shadow-inner"
                            />
                            <button 
                                onClick={() => setIsVisible(!isVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary rounded-full hover:bg-black/5 transition-colors"
                                title={isVisible ? "숨기기" : "보기"}
                            >
                                <span className="material-symbols-outlined text-xl block">
                                    {isVisible ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </section>
                    
                    {/* Model & Theme */}
                    <section className="flex flex-col gap-4 border-t border-border pt-6">
                        <label className="text-base font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">tune</span>
                            모델 및 테마 설정
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-bold text-text-secondary mb-2 block">사용 모델</label>
                                <div className="relative">
                                    <select
                                        value={model}
                                        onChange={(e) => { setModel(e.target.value); markDirty(); }}
                                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-surface-hover/50 focus:bg-surface focus:border-primary outline-none transition-all text-sm appearance-none cursor-pointer shadow-sm text-text-main"
                                    >
                                        {models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-text-secondary mb-2 block">앱 테마</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {THEMES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => { setTheme(t.id); markDirty(); }}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-10 ${theme === t.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-surface-hover'}`}
                                            title={t.name}
                                        >
                                            <div className="flex w-4 h-4 rounded-full overflow-hidden border border-black/10">
                                                <div className="w-1/2 h-full" style={{ backgroundColor: t.bg }}></div>
                                                <div className="w-1/2 h-full" style={{ backgroundColor: t.color }}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
              );

          case 'automation':
              return (
                <div className="flex flex-col gap-6 animate-fade-in">
                     <label className="text-base font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_mode</span>
                        자동 생성 설정
                    </label>
                    <p className="text-sm text-text-secondary -mt-4">분석 완료 시 자동으로 수행할 작업을 선택하세요.</p>

                    {/* File Save Location */}
                    <div className="bg-surface-subtle p-4 rounded-xl border border-border shadow-sm">
                        <h4 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">folder_open</span> 파일 저장 위치
                        </h4>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                <input 
                                    type="radio" 
                                    name="saveLocation"
                                    value="default"
                                    checked={!autoConfig.saveLocation || autoConfig.saveLocation === 'default'} 
                                    onChange={() => handleSaveLocationChange('default')} 
                                    className="form-radio text-primary border-gray-300 focus:ring-primary" 
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main">브라우저 기본 다운로드 폴더</span>
                                    <span className="text-[10px] text-text-muted">설정된 기본 경로로 저장됩니다.</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                <input 
                                    type="radio" 
                                    name="saveLocation"
                                    value="custom"
                                    checked={autoConfig.saveLocation === 'custom'} 
                                    onChange={() => handleSaveLocationChange('custom')} 
                                    className="form-radio text-primary border-gray-300 focus:ring-primary" 
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main">폴더 직접 지정 (지원 브라우저 전용)</span>
                                    <span className="text-[10px] text-text-muted">분석 시작 시 저장할 폴더를 선택합니다. (Chrome, Edge 등)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="bg-primary-light/30 p-4 rounded-xl border border-primary/20">
                        <h4 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">save_as</span> 파일 자동 저장
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={autoConfig.word} 
                                        onChange={() => handleAutoToggle('word')} 
                                        className="form-checkbox text-primary rounded border-gray-300 w-5 h-5 focus:ring-primary" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main flex items-center gap-1">Word(.doc)</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={autoConfig.markdown} 
                                        onChange={() => handleAutoToggle('markdown')} 
                                        className="form-checkbox text-primary rounded border-gray-300 w-5 h-5 focus:ring-primary" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main flex items-center gap-1">Markdown(.md)</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={autoConfig.csv} 
                                        onChange={() => handleAutoToggle('csv')} 
                                        className="form-checkbox text-primary rounded border-gray-300 w-5 h-5 focus:ring-primary" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main flex items-center gap-1">CSV(.csv)</span>
                                </div>
                            </label>
                        </div>
                        <span className="text-[10px] text-text-muted mt-3 block">분석 완료 시 파일명과 동일한 이름으로 선택한 형식의 파일을 자동 다운로드합니다.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image Options */}
                        <div className="bg-surface-subtle p-4 rounded-xl border border-border shadow-sm">
                            <h4 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">image</span> 이미지 파일
                            </h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.sns} onChange={() => handleAutoToggle('sns')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">SNS 홍보글 자동 생성</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.alt} onChange={() => handleAutoToggle('alt')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">대체 텍스트</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.json} onChange={() => handleAutoToggle('json')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">JSON 자동 변환</span>
                                </label>
                            </div>
                        </div>

                        {/* Video/Audio Options */}
                        <div className="bg-surface-subtle p-4 rounded-xl border border-border shadow-sm">
                            <h4 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">movie</span> 영상 / <span className="material-symbols-outlined text-sm">graphic_eq</span> 오디오
                            </h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.youtube} onChange={() => handleAutoToggle('youtube')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">유튜브 제목/설명 (영상)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.timeline} onChange={() => handleAutoToggle('timeline')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">타임라인 정리 (영상)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.meeting} onChange={() => handleAutoToggle('meeting')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">회의록 작성 (오디오)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface rounded-lg transition-colors">
                                    <input type="checkbox" checked={autoConfig.todo} onChange={() => handleAutoToggle('todo')} className="form-checkbox text-primary rounded border-border focus:ring-primary/20" />
                                    <span className="text-sm font-medium text-text-main">할 일 목록 추출 (오디오)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
              );

          case 'instructions':
              return (
                <div className="flex flex-col gap-4 animate-fade-in">
                     <div className="flex justify-between items-center">
                        <label className="text-base font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">tune</span>
                            AI 맞춤 지침 (System Instruction)
                        </label>
                     </div>
                     <p className="text-xs text-text-secondary">
                        각 미디어 유형별로 AI가 분석할 때 중점적으로 볼 내용을 지시하세요.
                     </p>

                     <div className="flex border-b border-border gap-1 mt-2">
                        {instructionTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveInstructionTab(tab.id)}
                                className={`px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-all ${activeInstructionTab === tab.id ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-main hover:bg-surface-hover'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                     </div>

                     <div className="bg-surface-subtle/50 p-4 rounded-b-xl border border-t-0 border-border shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-text-secondary">현재 지침:</span>
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => setIsBuilderOpen(true)}
                                    className="text-[10px] bg-primary text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:bg-primary-hover shadow-md shadow-primary/20 hover:-translate-y-0.5"
                                 >
                                     <span className="material-symbols-outlined text-[12px]">auto_fix</span>
                                     프롬프트 빌더
                                 </button>
                                 {googleSheetUrl && (
                                     <button 
                                        onClick={() => handleSaveToCloud(instructions[activeInstructionTab])}
                                        className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-md hover:-translate-y-0.5"
                                     >
                                         <span className="material-symbols-outlined text-[12px]">cloud_upload</span>
                                         시트에 저장
                                     </button>
                                 )}
                             </div>
                        </div>

                        <textarea 
                            value={instructions[activeInstructionTab]}
                            onChange={(e) => { setInstructions(prev => ({ ...prev, [activeInstructionTab]: e.target.value })); markDirty(); }}
                            placeholder={`AI에게 ${instructionTabs.find(t=>t.id === activeInstructionTab)?.label} 분석 시 지킬 규칙을 입력하세요.`}
                            className="w-full h-40 p-4 rounded-xl border border-border bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm resize-none mb-4 font-mono leading-relaxed shadow-sm text-text-main"
                        />
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-text-muted uppercase block mb-2">기본 프리셋</span>
                                <div className="flex flex-wrap gap-2">
                                    {PRESETS[activeInstructionTab].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setInstructions(prev => ({ ...prev, [activeInstructionTab]: preset.text })); markDirty(); }}
                                            className="px-3 py-1.5 bg-surface border border-border hover:border-primary hover:text-primary rounded-lg text-xs font-medium text-text-secondary transition-all shadow-sm active:scale-95"
                                            title={preset.text}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { setInstructions(prev => ({ ...prev, [activeInstructionTab]: DEFAULT_INSTRUCTIONS[activeInstructionTab] })); markDirty(); }}
                                        className="px-3 py-1.5 bg-surface-subtle border border-border hover:bg-surface-hover rounded-lg text-xs text-text-muted transition-all"
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-green-700 uppercase flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">table_chart</span> 저장된 템플릿 ({currentCategoryTemplates.length})
                                        </span>
                                        {isCloudLoading && <span className="material-symbols-outlined text-[12px] animate-spin text-text-muted">refresh</span>}
                                    </div>
                                </div>
                                
                                {currentCategoryTemplates.length === 0 ? (
                                    <div className="text-[10px] text-text-muted italic bg-surface p-3 rounded-lg border border-border border-dashed text-center">
                                        저장된 템플릿이 없습니다. '프롬프트 빌더'로 생성하거나, 하단의 CSV 가져오기를 사용해보세요.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {currentCategoryTemplates.map((tpl) => (
                                            <div key={tpl.id} className="group relative flex items-center justify-between bg-green-50/50 border border-green-100 hover:border-green-300 rounded-lg p-2 transition-all">
                                                <div className="flex flex-col min-w-0 flex-1 mr-2">
                                                    <span className="text-xs font-bold text-green-800 truncate" title={tpl.label}>{tpl.label}</span>
                                                    <span className="text-[9px] text-green-600 truncate opacity-70 font-mono" title={tpl.content}>{tpl.content.slice(0, 30)}...</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setInstructions(prev => ({ ...prev, [activeInstructionTab]: tpl.content })); markDirty(); }}
                                                        className="p-1 text-green-700 hover:bg-green-200 rounded"
                                                        title="적용"
                                                    >
                                                        <span className="material-symbols-outlined text-sm block">check</span>
                                                    </button>
                                                    {googleSheetUrl && (
                                                        <button 
                                                            onClick={(e) => handleDeleteFromCloud(tpl.id, e)}
                                                            className="p-1 text-error hover:bg-red-100 rounded"
                                                            title="삭제"
                                                        >
                                                            <span className="material-symbols-outlined text-sm block">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
              );

          case 'data':
              return (
                  <div className="flex flex-col gap-8 animate-fade-in">
                     <section className="flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                            <label className="text-base font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-600">table_chart</span>
                                템플릿 연동 (Google Sheets / CSV)
                            </label>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-text-secondary mb-1 block">Google Apps Script Web App URL</label>
                             <div className="flex gap-2">
                                 <input 
                                     type="text" 
                                     value={googleSheetUrl}
                                     onChange={(e) => { setGoogleSheetUrl(e.target.value); markDirty(); }}
                                     placeholder="https://script.google.com/macros/s/.../exec"
                                     className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface-subtle focus:bg-surface focus:border-green-500 text-xs transition-all text-text-main"
                                 />
                                 <button 
                                    onClick={fetchCloudTemplates}
                                    disabled={isCloudLoading || !googleSheetUrl}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     {isCloudLoading ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm">download</span>}
                                     가져오기
                                 </button>
                             </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-subtle p-3 rounded-xl border border-border">
                            <div className="flex flex-col mr-auto">
                                <span className="text-xs font-bold text-text-main">백업 및 복원 (CSV)</span>
                                <span className="text-[10px] text-text-muted">구글 시트 없이도 템플릿을 파일로 관리할 수 있습니다.</span>
                            </div>
                            
                            <button 
                                onClick={handleDownloadSampleCSV}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all text-text-secondary hover:text-primary"
                                title="CSV 작성 양식 다운로드"
                            >
                                <span className="material-symbols-outlined text-sm">help</span>
                                샘플
                            </button>

                            <div className="h-4 w-px bg-border hidden sm:block"></div>

                            <button 
                                onClick={() => csvInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all text-text-main hover:text-primary shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                가져오기
                            </button>
                            <input type="file" ref={csvInputRef} accept=".csv" hidden onChange={handleImportCSV} />

                            <button 
                                onClick={handleExportCSV}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all text-text-main hover:text-primary shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                내보내기
                            </button>
                         </div>
                    </section>

                    <div className="flex flex-col justify-center border-t border-border pt-6">
                        <label className="text-sm font-bold text-text-secondary mb-2 block">이미지 처리 방식</label>
                        <label className="flex items-center gap-3 cursor-pointer bg-surface-subtle p-2.5 rounded-xl border border-border hover:bg-surface-hover transition-colors shadow-sm">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={imageOcrEnabled} 
                                    onChange={(e) => { setImageOcrEnabled(e.target.checked); markDirty(); }} 
                                    className="form-checkbox text-primary rounded border-gray-300 w-5 h-5 focus:ring-primary" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-text-main">OCR(텍스트 추출) 수행</span>
                                <span className="text-[10px] text-text-muted">해제 시 텍스트 위치 분석을 생략하고 이미지 내용 묘사에 집중합니다.</span>
                            </div>
                        </label>
                    </div>

                    {imageOcrEnabled && (
                        <section className="flex flex-col gap-4 animate-fade-in">
                            <label className="text-base font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">view_in_ar</span>
                                보조 OCR 엔진 선택 (이미지 전용)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div 
                                    onClick={() => { setOcrEngine('tesseract'); markDirty(); }}
                                    className={`cursor-pointer p-4 rounded-xl border flex flex-col gap-2 transition-all ${ocrEngine === 'tesseract' ? 'bg-primary-light/50 border-primary shadow-sm' : 'bg-surface-subtle border-border hover:bg-surface-hover'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ocrEngine === 'tesseract' ? 'border-primary' : 'border-text-muted'}`}>
                                            {ocrEngine === 'tesseract' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                        </div>
                                        <span className="font-bold text-sm text-text-main">Tesseract OCR</span>
                                    </div>
                                    <p className="text-xs text-text-secondary pl-6">웹 브라우저 내에서 직접 실행됩니다. 설정이 필요 없으며 무료입니다.</p>
                                </div>

                                <div 
                                    onClick={() => { setOcrEngine('paddle'); markDirty(); }}
                                    className={`cursor-pointer p-4 rounded-xl border flex flex-col gap-2 transition-all ${ocrEngine === 'paddle' ? 'bg-primary-light/50 border-primary shadow-sm' : 'bg-surface-subtle border-border hover:bg-surface-hover'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ocrEngine === 'paddle' ? 'border-primary' : 'border-text-muted'}`}>
                                            {ocrEngine === 'paddle' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                        </div>
                                        <span className="font-bold text-sm text-text-main">PaddleOCR (API 연동)</span>
                                    </div>
                                    <p className="text-xs text-text-secondary pl-6">별도의 PaddleOCR 서버가 필요합니다. 성능이 더 우수합니다.</p>
                                </div>
                            </div>
                            {ocrEngine === 'paddle' && (
                                <div className="pl-2 animate-fade-in">
                                    <label className="text-xs font-bold text-text-secondary mb-1.5 block">PaddleOCR API 서버 주소</label>
                                    <input 
                                        type="text"
                                        value={paddleUrl}
                                        onChange={(e) => { setPaddleUrl(e.target.value); markDirty(); }}
                                        placeholder="http://localhost:8000/ocr"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-mono text-xs text-text-main"
                                    />
                                </div>
                            )}
                        </section>
                    )}
                  </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-16 h-full bg-surface-subtle overflow-y-auto animate-fade-in custom-scrollbar">
      <PromptBuilderModal 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        category={activeInstructionTab}
        onApply={(prompt) => { setInstructions(prev => ({...prev, [activeInstructionTab]: prompt})); markDirty(); }}
      />
      
      <div className="w-full max-w-4xl px-6 pb-20">
        <div className="bg-surface rounded-2xl shadow-lux border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border bg-surface-subtle/50 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
            <div>
                <h2 className="text-2xl font-bold text-text-main">환경 설정</h2>
                <p className="text-text-secondary text-sm mt-1">AI 모델, 맞춤 지침, 템플릿 및 테마를 설정합니다.</p>
            </div>
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors">닫기</button>
          </div>

          <div className="px-8 pt-6 pb-2 bg-surface">
              <div className="flex gap-2 p-1 bg-surface-subtle border border-border rounded-xl">
                  {[{ id: 'general', label: '일반/테마', icon: 'settings' }, { id: 'automation', label: '자동화', icon: 'auto_mode' }, { id: 'instructions', label: '맞춤 지침', icon: 'tune' }, { id: 'data', label: '데이터/연동', icon: 'database' }].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id as SettingsTab)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeSettingsTab === tab.id ? 'bg-surface shadow-sm text-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}`}
                      >
                          <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          <div className="p-8">
            {renderTabContent()}
            <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
                <div className="h-6">
                    {message && (
                        <div className={`flex items-center gap-2 text-sm font-medium animate-fade-in ${message.type === 'success' ? 'text-success' : 'text-error'}`}>
                            <span className="material-symbols-outlined text-lg">{message.type === 'success' ? 'check_circle' : 'warning'}</span>
                            {message.text}
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { if(confirm("모든 설정을 초기화하시겠습니까?")) { setKey(''); setModel('gemini-2.0-flash'); setAutoConfig({ sns: false, alt: false, json: false, youtube: false, timeline: false, meeting: false, todo: false, word: false, markdown: false, csv: false, saveLocation: 'default' }); setOcrEngine('tesseract'); setPaddleUrl(''); setInstructions(DEFAULT_INSTRUCTIONS); setImageOcrEnabled(true); setTheme('default'); markDirty(); }}}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-light/50 border border-transparent hover:border-error-light transition-all"
                    >
                        초기화
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 shadow-md ${isDirty ? 'bg-primary hover:bg-primary-hover shadow-primary/20 active:scale-95' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        {isDirty ? '설정 저장' : '저장됨'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};