import React, { useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSave: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentKey, onSave }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (inputRef.current) {
      onSave(inputRef.current.value);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-floating w-full max-w-md overflow-hidden animate-[slideIn_0.3s_ease]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-subtle/50">
          <h3 className="text-lg font-bold text-text-main">설정</h3>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-surface-hover"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-secondary">Google AI Studio API Key</label>
            <input 
              type="password" 
              ref={inputRef}
              defaultValue={currentKey}
              placeholder="API 키를 입력하세요"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-text-muted mt-1">
              * 키는 브라우저에만 저장되며 Google API 외의 서버로는 전송되지 않습니다.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-subtle border-t border-border flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-white border border-transparent hover:border-border hover:shadow-sm transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};