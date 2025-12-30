

export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';
export type MediaType = 'image' | 'video' | 'audio';
export type AnalysisMode = 'all' | 'text' | 'image'; 
export type OCREngine = 'tesseract' | 'paddle';
export type AppTheme = 'default' | 'midnight' | 'nature' | 'ocean' | 'sunset';

export interface PublicDocMetadata {
  doc_number?: string;
  sender?: string;
  receiver?: string;
  department?: string;
  title?: string;
  date?: string;
}

export interface FileMetadata {
  description?: string;
  location?: string;
  objects?: string[];
  colors?: string[];
  duration?: string;
  accuracy?: string;
  confidence?: number;
  public_doc?: PublicDocMetadata;
  // For detailed image analysis when OCR is off
  labels?: string[];
  visual_analysis?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface OCRBlock {
  text: string;
  confidence?: number; 
  bbox: {
    y0: number; 
    x0: number; 
    y1: number; 
    x1: number; 
  };
}

export interface AutoConfig {
    sns: boolean;
    alt: boolean;
    json: boolean;
    youtube: boolean;
    timeline: boolean;
    meeting: boolean;
    todo: boolean;
    word: boolean;
    markdown: boolean;
    csv: boolean;
    saveLocation?: 'default' | 'custom';
}

export interface SystemInstructions {
    ocr: string;
    image: string;
    audio: string;
    video: string;
}

export interface PromptTemplate {
    id: string;
    category: keyof SystemInstructions;
    label: string;
    content: string;
    created_at?: string;
}

export interface OCRFile {
  id: string;
  file: File;
  mediaType: MediaType;
  path: string;
  previewUrl: string;
  status: ProcessStatus;
  analysisMode: AnalysisMode;
  
  // OCR & Text Results
  textGemini: string;
  textCorrected: string;
  textTesseract: string;
  textPaddle: string;
  fontStyle: string;     
  
  // OCR Data for Overlay
  ocrData?: OCRBlock[];
  
  // AI Generated Image
  generatedImageUrl?: string; 
  
  // Analysis Results
  summary: string;
  keywords: string[];
  metadata: FileMetadata;
  
  chatHistory: ChatMessage[];
  studioResults?: Record<string, string>;

  errorMsg?: string;
}

export interface AnalysisResult {
  extractedText: string;
  correctedText: string;
  summary: string;
  keywords: string[];
  metadata?: FileMetadata;
}