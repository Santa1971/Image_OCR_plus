import React, { useState, useEffect } from 'react';
import { SystemInstructions } from '../types';

interface PromptBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: keyof SystemInstructions;
  onApply: (prompt: string) => void;
}

export const PromptBuilderModal: React.FC<PromptBuilderModalProps> = ({ isOpen, onClose, category, onApply }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    task: '',
    context: '',
    format: '',
    constraints: ''
  });

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        // Set default role based on category
        let defaultRole = "전문가";
        if (category === 'ocr') defaultRole = "숙련된 데이터 입력 전문가 및 문서 분석가";
        if (category === 'image') defaultRole = "시각 예술 비평가 및 마케팅 카피라이터";
        if (category === 'audio') defaultRole = "전문 속기사 및 회의록 작성자";
        if (category === 'video') defaultRole = "영상 편집자 및 콘텐츠 기획자";

        setFormData({
            role: defaultRole,
            task: '',
            context: '',
            format: '',
            constraints: ''
        });
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const generatedPrompt = `[역할]
${formData.role}

[작업]
${formData.task}

[문맥]
${formData.context}

[출력 형식]
${formData.format}

[제약 사항]
${formData.constraints}

위 지침을 바탕으로 미디어를 분석하고 결과를 생성하세요.`;

  const handleApply = () => {
      onApply(generatedPrompt);
      onClose();
  };

  const renderStep = () => {
      switch(step) {
          case 1:
              return (
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-text-main mb-1">1. AI의 역할 (Persona)</label>
                          <p className="text-xs text-text-muted mb-2">AI가 어떤 전문가처럼 행동해야 하나요?</p>
                          <input 
                              type="text" 
                              className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                              value={formData.role}
                              onChange={e => setFormData({...formData, role: e.target.value})}
                              placeholder="예: 20년 경력의 법률 문서 분석가"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-text-main mb-1">2. 수행할 작업 (Task)</label>
                          <p className="text-xs text-text-muted mb-2">구체적으로 어떤 작업을 수행해야 하나요?</p>
                          <textarea 
                              className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm h-24 resize-none"
                              value={formData.task}
                              onChange={e => setFormData({...formData, task: e.target.value})}
                              placeholder={`예: ${category === 'ocr' ? '흐릿한 영수증 이미지에서 상호명, 날짜, 금액을 정확히 추출하세요.' : '이미지의 미적 요소를 분석하고 인스타그램용 감성 글귀를 작성하세요.'}`}
                          />
                      </div>
                  </div>
              );
          case 2:
              return (
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-text-main mb-1">3. 문맥 및 배경 (Context)</label>
                          <p className="text-xs text-text-muted mb-2">이 분석 결과는 어디에 사용되나요?</p>
                          <textarea 
                              className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm h-20 resize-none"
                              value={formData.context}
                              onChange={e => setFormData({...formData, context: e.target.value})}
                              placeholder="예: 회사의 경비 지출 증빙 자료로 사용될 예정입니다. 정확도가 매우 중요합니다."
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-text-main mb-1">4. 출력 형식 (Format)</label>
                          <p className="text-xs text-text-muted mb-2">결과물은 어떤 형태여야 하나요?</p>
                          <input 
                              type="text" 
                              className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                              value={formData.format}
                              onChange={e => setFormData({...formData, format: e.target.value})}
                              placeholder="예: JSON 형식, 마크다운 표, 글머리 기호 목록"
                          />
                      </div>
                  </div>
              );
          case 3:
              return (
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-text-main mb-1">5. 제약 사항 (Constraints)</label>
                          <p className="text-xs text-text-muted mb-2">AI가 절대 하지 말아야 할 것이나 꼭 지켜야 할 규칙은?</p>
                          <textarea 
                              className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm h-24 resize-none"
                              value={formData.constraints}
                              onChange={e => setFormData({...formData, constraints: e.target.value})}
                              placeholder="예: 추측성 내용은 포함하지 마세요. 없는 글자를 만들어내지 마세요. 반드시 한국어로 작성하세요."
                          />
                      </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-floating w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_fix</span>
                프롬프트 빌더 ({category.toUpperCase()})
            </h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-main p-1 rounded-full hover:bg-surface-hover">
                <span className="material-symbols-outlined text-xl block">close</span>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                ))}
            </div>

            {renderStep()}

            {/* Preview Box */}
            <div className="mt-6 p-4 bg-surface-subtle border border-border rounded-xl">
                <h4 className="text-xs font-bold text-text-muted uppercase mb-2">프롬프트 미리보기</h4>
                <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed h-32 overflow-y-auto custom-scrollbar">
                    {generatedPrompt}
                </pre>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-subtle flex justify-between">
            <button 
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                disabled={step === 1}
                className="px-4 py-2 text-sm font-bold text-text-secondary hover:bg-white rounded-lg transition-all disabled:opacity-50"
            >
                이전
            </button>
            
            {step < 3 ? (
                <button 
                    onClick={() => setStep(prev => Math.min(3, prev + 1))}
                    className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all shadow-md shadow-primary/20"
                >
                    다음
                </button>
            ) : (
                <button 
                    onClick={handleApply}
                    className="px-5 py-2 text-sm font-bold text-white bg-success hover:bg-success-text rounded-lg transition-all shadow-md shadow-success/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">check</span>
                    적용하기
                </button>
            )}
        </div>
      </div>
    </div>
  );
};