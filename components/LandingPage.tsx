import React, { useState, useEffect } from 'react';

interface LandingPageProps {
    onEnter: () => void;
    onSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onSettings }) => {
    const [mounted, setMounted] = useState(false);
    const [activeModal, setActiveModal] = useState<'features' | 'cases' | 'guide' | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const renderModalContent = () => {
        switch (activeModal) {
            case 'features':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-colors">
                                <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                                    <span className="material-symbols-outlined text-2xl">document_scanner</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">초정밀 OCR & 데이터 추출</h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    단순한 텍스트 인식을 넘어, 문서의 구조(표, 서식)를 완벽하게 이해합니다. 손글씨, 영수증, 복잡한 공문서까지 정확하게 디지털 데이터로 변환하세요.
                                </p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-colors">
                                <div className="size-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                                    <span className="material-symbols-outlined text-2xl">view_in_ar</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">멀티모달(Multi-modal) 분석</h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    이미지뿐만 아니라 오디오의 음성, 비디오의 흐름까지 AI가 분석합니다. 회의 녹음 파일에서 안건을 추출하거나, 영상에서 하이라이트를 찾아냅니다.
                                </p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-pink-500/50 transition-colors">
                                <div className="size-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 text-pink-400">
                                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">AI 창작 스튜디오</h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    분석된 데이터를 바탕으로 블로그 포스팅, SNS 홍보글, 이메일 초안 등 2차 저작물을 즉시 생성합니다. 당신의 업무 시간을 획기적으로 단축시킵니다.
                                </p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                <div className="size-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
                                    <span className="material-symbols-outlined text-2xl">lock</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">강력한 보안 및 프라이버시</h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    모든 데이터 처리는 사용자의 브라우저와 Google의 안전한 API 간에 직접 이루어집니다. 별도의 중계 서버에 데이터를 저장하지 않아 안심할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'cases':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/10">
                                <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-blue-400">work</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-white mb-1">직장인 & 실무자</h4>
                                    <p className="text-sm text-text-secondary">"수십 장의 종이 서류를 일일이 타이핑할 필요가 없어졌습니다. 회의 녹음 파일만 올리면 AI가 회의록을 작성해주니 업무 효율이 200% 올랐어요."</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/10">
                                <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-purple-400">movie_filter</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-white mb-1">콘텐츠 크리에이터</h4>
                                    <p className="text-sm text-text-secondary">"촬영한 영상 원본을 올리면 AI가 알아서 숏폼 제목과 설명글을 뽑아줍니다. 인스타그램 해시태그까지 추천해주니 마케팅이 정말 쉬워졌어요."</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/10">
                                <div className="size-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-orange-400">school</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-white mb-1">학생 & 연구원</h4>
                                    <p className="text-sm text-text-secondary">"전공 서적 사진을 찍으면 텍스트로 변환해주고 핵심 요약까지 해줍니다. 논문 PDF나 강의 녹음 자료 정리에도 필수 앱이 되었습니다."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'guide':
                return (
                    <div className="space-y-8 animate-fade-in py-4">
                        <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-transparent opacity-30"></div>
                            
                            <div className="relative flex gap-6 items-start mb-8">
                                <div className="size-12 rounded-full bg-surface border border-primary/30 text-primary font-bold text-xl flex items-center justify-center shrink-0 shadow-glow z-10">1</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">파일 업로드</h4>
                                    <p className="text-sm text-text-secondary">홈 화면의 드롭존에 이미지, 오디오, 비디오 파일을 드래그하거나 선택하여 업로드합니다. 여러 파일을 한 번에 올릴 수도 있습니다.</p>
                                </div>
                            </div>
                            
                            <div className="relative flex gap-6 items-start mb-8">
                                <div className="size-12 rounded-full bg-surface border border-white/20 text-white font-bold text-xl flex items-center justify-center shrink-0 z-10">2</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">환경 설정 (선택)</h4>
                                    <p className="text-sm text-text-secondary">우측 상단의 '설정' 버튼을 눌러 AI 모델(Gemini)을 선택하거나, 분석 목적에 맞는 맞춤 지침(System Prompt)을 설정할 수 있습니다.</p>
                                </div>
                            </div>

                            <div className="relative flex gap-6 items-start mb-8">
                                <div className="size-12 rounded-full bg-surface border border-white/20 text-white font-bold text-xl flex items-center justify-center shrink-0 z-10">3</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">분석 및 생성</h4>
                                    <p className="text-sm text-text-secondary">'분석 시작' 버튼을 누르면 AI가 파일을 처리합니다. 이미지 OCR, 오디오 STT, 비디오 분석이 자동으로 진행됩니다.</p>
                                </div>
                            </div>

                            <div className="relative flex gap-6 items-start">
                                <div className="size-12 rounded-full bg-surface border border-white/20 text-white font-bold text-xl flex items-center justify-center shrink-0 z-10">4</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">결과 확인 및 다운로드</h4>
                                    <p className="text-sm text-text-secondary">분석 결과를 뷰어에서 확인하고, Word, Markdown, JSON 등 원하는 형식으로 다운로드하여 업무에 활용하세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getModalTitle = () => {
        switch(activeModal) {
            case 'features': return '주요 기능 소개';
            case 'cases': return '다양한 활용 사례';
            case 'guide': return '이용 가이드';
            default: return '';
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar relative">
            {/* Modal Overlay */}
            {activeModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
                    onClick={() => setActiveModal(null)}
                >
                    <div 
                        className="bg-[#0f172a] border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                {activeModal === 'features' && <span className="material-symbols-outlined text-primary">stars</span>}
                                {activeModal === 'cases' && <span className="material-symbols-outlined text-purple-400">lightbulb</span>}
                                {activeModal === 'guide' && <span className="material-symbols-outlined text-emerald-400">menu_book</span>}
                                {getModalTitle()}
                            </h3>
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {renderModalContent()}
                        </div>
                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-white/10 bg-white/5 flex justify-end">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-all"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto z-10 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-2xl">document_scanner</span>
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">AI OCR 프로</span>
                </div>

                {/* Center Navigation Links */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                    <button 
                        onClick={() => setActiveModal('features')}
                        className="px-5 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                        기능 소개
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button 
                        onClick={() => setActiveModal('cases')}
                        className="px-5 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                        활용 사례
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button 
                        onClick={() => setActiveModal('guide')}
                        className="px-5 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                        이용 안내
                    </button>
                </div>

                <button 
                    onClick={onEnter}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-sm shadow-sm transition-all border border-white/10 hover:-translate-y-0.5 backdrop-blur-md"
                >
                    시작하기
                </button>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative z-10">
                <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg mb-6 backdrop-blur-md">
                        <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                            ✨ Gemini 2.0 AI 엔진 탑재
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
                        데이터의 가치를 <br/>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-primary to-purple-400 animate-pulse-slow">
                            가장 아름답게 발견하다
                        </span>
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        단순한 텍스트 추출을 넘어, AI가 이미지, 오디오, 비디오의 맥락을 이해하고<br className="hidden md:block"/> 
                        당신이 필요한 형태로 재창조합니다. 어둠 속에서도 빛나는 통찰력을 경험하세요.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            onClick={onEnter}
                            className="group relative px-8 py-4 bg-primary hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-glow overflow-hidden transition-all hover:scale-105 hover:shadow-primary/50"
                        >
                            <span className="relative flex items-center gap-2">
                                입장하기
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </span>
                        </button>
                        <button 
                            onClick={onSettings}
                            className="flex items-center gap-2 px-8 py-4 bg-surface-subtle hover:bg-surface text-text-main rounded-2xl font-bold text-lg shadow-glass border border-border transition-all hover:border-primary/50 group"
                        >
                            <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">settings</span>
                            환경설정
                        </button>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl w-full transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <div onClick={() => setActiveModal('features')} className="glass-card p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 group hover:border-primary/30 cursor-pointer">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl text-blue-400 group-hover:text-white transition-colors">view_in_ar</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">멀티모달 분석</h3>
                        <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-main transition-colors">이미지, 오디오, 비디오 등 다양한 형태의 비정형 데이터를 한 곳에서 분석하고 처리합니다.</p>
                    </div>
                    <div onClick={() => setActiveModal('features')} className="glass-card p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 group hover:border-purple-500/30 cursor-pointer">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl text-purple-400 group-hover:text-white transition-colors">auto_awesome</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">AI 창작 스튜디오</h3>
                        <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-main transition-colors">추출된 데이터를 바탕으로 블로그 글, 회의록, SNS 콘텐츠 등 2차 저작물을 자동 생성합니다.</p>
                    </div>
                    <div onClick={() => setActiveModal('features')} className="glass-card p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 group hover:border-emerald-500/30 cursor-pointer">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl text-emerald-400 group-hover:text-white transition-colors">table_view</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">정형 데이터 변환</h3>
                        <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-main transition-colors">복잡한 문서를 구조화된 JSON, CSV, Markdown 형식으로 변환하여 업무에 즉시 활용하세요.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full text-center py-8 text-text-muted text-xs z-10 relative">
                <p>&copy; 2024 AI OCR 프로. 모든 권리 보유.</p>
            </footer>
        </div>
    );
};