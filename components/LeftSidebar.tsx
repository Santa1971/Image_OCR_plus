import React, { useRef, useState, useEffect } from 'react';
import { OCRFile, AnalysisMode } from '../types';

interface LeftSidebarProps {
  items: OCRFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpload: (files: FileList | null) => void;
  onDelete: (ids: string[]) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onStartProcess?: () => void;
  isProcessing?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
    items, selectedId, onSelect, onUpload, onDelete, 
    isOpen = false, onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Update checked items when items list changes (e.g. deletion)
  useEffect(() => {
      const newSet = new Set<string>();
      // Only keep IDs that are still present in the items list
      checkedItems.forEach(id => {
          if (items.find(i => i.id === id)) newSet.add(id);
      });
      // Update state only if count changed to avoid infinite loop or unnecessary renders
      if (newSet.size !== checkedItems.size) {
          setCheckedItems(newSet);
      }
  }, [items, checkedItems]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('정말 이 파일을 목록에서 삭제하시겠습니까?')) {
        const newSet = new Set(checkedItems);
        newSet.delete(id);
        setCheckedItems(newSet);
        onDelete([id]);
    }
  };

  const handleBulkDelete = () => {
    if (checkedItems.size === 0) return;
    if (window.confirm(`선택한 ${checkedItems.size}개의 파일을 정말 삭제하시겠습니까?`)) {
        onDelete(Array.from(checkedItems));
        setCheckedItems(new Set()); 
    }
  };

  const toggleCheck = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSet = new Set(checkedItems);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setCheckedItems(newSet);
  };

  const toggleAll = () => {
      if (checkedItems.size === items.length && items.length > 0) {
          setCheckedItems(new Set());
      } else {
          setCheckedItems(new Set(items.map(i => i.id)));
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          onUpload(e.target.files);
      }
      e.target.value = '';
  };

  const getMediaTypeIcon = (type: string) => {
      switch(type) {
          case 'video': return 'movie';
          case 'audio': return 'graphic_eq';
          default: return 'image';
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
                fixed top-0 bottom-0 left-0 w-72 bg-surface border-r border-border flex flex-col shrink-0 transition-transform duration-300 z-50 shadow-2xl
                md:relative md:translate-x-0 md:shadow-[5px_0_20px_rgba(0,0,0,0.02)] md:z-20 md:h-full
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="md:hidden px-4 py-3 border-b border-border flex justify-between items-center bg-surface-subtle">
                    <h3 className="font-bold text-text-main">파일 목록</h3>
                    <button onClick={onClose} className="text-text-secondary p-1">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Upload Section */}
                <div className="p-4 border-b border-border flex-shrink-0 bg-surface-subtle/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add_to_photos</span>
                            새 작업 추가
                        </h3>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2.5 bg-surface border border-border hover:bg-surface-hover text-text-main rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            파일 추가
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*,audio/*" multiple hidden />
                    </div>
                </div>

                {/* File List Section */}
                <div className="flex flex-col flex-1 overflow-y-auto bg-surface custom-scrollbar">
                    <div className="p-2 flex-shrink-0">
                        {/* List Header with Bulk Actions */}
                        <div className="px-3 py-2 flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div 
                                    onClick={toggleAll}
                                    className={`size-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                                        items.length > 0 && checkedItems.size === items.length 
                                        ? 'bg-primary border-primary text-white' 
                                        : 'bg-surface border-border text-transparent hover:border-primary/50'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                                </div>
                                <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                                    목록 <span className="ml-1 px-1.5 py-0.5 bg-surface-canvas rounded-full text-text-secondary">{items.length}</span>
                                </h3>
                            </div>

                            {checkedItems.size > 0 && (
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1 text-[10px] font-bold text-error hover:bg-error-light/50 px-2 py-1 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xs">delete</span>
                                    <span>선택 삭제 ({checkedItems.size})</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            {items.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-text-muted opacity-60">
                                    <span className="material-symbols-outlined text-4xl mb-2">post_add</span>
                                    <p className="text-xs italic">상단의 버튼을 눌러<br/>작업을 추가하세요</p>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const isChecked = checkedItems.has(item.id);
                                    return (
                                        <div 
                                            key={item.id}
                                            onClick={() => onSelect(item.id)}
                                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all cursor-pointer border
                                            ${item.id === selectedId 
                                                ? 'bg-primary-light/30 border-primary-light ring-1 ring-primary/20 shadow-sm' 
                                                : 'hover:bg-surface-hover border-transparent hover:border-border'}`}
                                        >
                                            {/* Checkbox */}
                                            <div 
                                                onClick={(e) => toggleCheck(e, item.id)}
                                                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 size-5 rounded-full border flex items-center justify-center transition-all shadow-sm
                                                    ${isChecked 
                                                        ? 'bg-primary border-primary text-white opacity-100 scale-100' 
                                                        : 'bg-surface border-border text-transparent opacity-0 group-hover:opacity-100 hover:border-primary'}`}
                                            >
                                                <span className="material-symbols-outlined text-xs font-bold">check</span>
                                            </div>

                                            {/* Media Icon / Thumbnail */}
                                            <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border shadow-sm relative overflow-hidden ml-1
                                            ${isChecked ? 'opacity-40' : 'opacity-100'}
                                            ${item.status === 'done' ? 'bg-surface border-success/20 text-success' : 
                                            item.status === 'processing' ? 'bg-surface border-primary/20 text-primary' : 
                                            item.status === 'error' ? 'bg-error-light border-error/20 text-error' : 'bg-surface-canvas border-border text-text-muted'}`}
                                            >
                                                {item.mediaType === 'image' && item.previewUrl ? (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <img src={item.previewUrl} className="max-w-full max-h-full object-contain" alt="" />
                                                    </div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-lg">{getMediaTypeIcon(item.mediaType)}</span>
                                                )}
                                                
                                                {item.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* File Info */}
                                            <div className={`flex flex-col items-start min-w-0 flex-1 gap-0.5 transition-opacity ${isChecked ? 'opacity-50' : 'opacity-100'}`}>
                                                <div className="flex items-center gap-1 w-full text-text-muted" title={item.path || "Root"}>
                                                    <span className="material-symbols-outlined text-[10px] opacity-70">
                                                        {item.analysisMode === 'text' ? 'document_scanner' : 'folder'}
                                                    </span>
                                                    <span className="text-[10px] truncate w-full font-medium opacity-80">
                                                        {item.analysisMode === 'text' ? 'OCR 모드' : item.path || "/"}
                                                    </span>
                                                </div>
                                                <span 
                                                    className={`text-xs truncate w-full text-left leading-tight ${item.id === selectedId ? 'font-bold text-primary-text' : 'font-medium text-text-main'}`}
                                                    title={item.file.name}
                                                >
                                                    {item.file.name}
                                                </span>
                                            </div>

                                            {/* Delete Button */}
                                            {!isChecked && (
                                                <button 
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    className={`flex items-center justify-center size-7 rounded-lg transition-all z-10 shrink-0
                                                        ${item.id === selectedId 
                                                            ? 'text-text-secondary hover:text-error hover:bg-surface hover:shadow-sm opacity-100' 
                                                            : 'text-text-muted hover:text-error hover:bg-error-light opacity-0 group-hover:opacity-100'}`}
                                                    title="삭제"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </>
  );
};