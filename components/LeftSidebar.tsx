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
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
    items, selectedId, onSelect, onUpload, onDelete, 
    isOpen = false, onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
      const newSet = new Set<string>();
      checkedItems.forEach(id => {
          if (items.find(i => i.id === id)) newSet.add(id);
      });
      if (newSet.size !== checkedItems.size) {
          setCheckedItems(newSet);
      }
  }, [items, checkedItems]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('정말 삭제하시겠습니까?')) {
        onDelete([id]);
    }
  };

  const handleBulkDelete = () => {
    if (checkedItems.size === 0) return;
    if (window.confirm(`${checkedItems.size}개 파일을 삭제하시겠습니까?`)) {
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
        <div 
            className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        ></div>

        <aside 
            className={`
                fixed top-0 bottom-0 left-0 w-72 bg-surface-subtle border-r border-surface-border flex flex-col shrink-0 transition-transform duration-300 z-50
                md:relative md:translate-x-0 md:z-20 md:h-full
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            {/* Sidebar Header / Upload */}
            <div className="p-4 flex flex-col gap-3 border-b border-surface-border bg-surface-subtle">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-card transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    파일 업로드
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*,audio/*" multiple hidden />
            </div>

            {/* List Header */}
            <div className="px-4 py-2 flex items-center justify-between text-xs font-semibold text-text-secondary border-b border-surface-border bg-surface-subtle/50">
                <div className="flex items-center gap-2">
                    <div 
                        onClick={toggleAll}
                        className={`size-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            items.length > 0 && checkedItems.size === items.length 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white border-surface-border hover:border-primary'
                        }`}
                    >
                        {items.length > 0 && checkedItems.size === items.length && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                    </div>
                    <span>라이브러리 ({items.length})</span>
                </div>
                {checkedItems.size > 0 && (
                    <button onClick={handleBulkDelete} className="text-error hover:text-red-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                )}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="flex flex-col gap-1">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                            <p className="text-xs">파일이 없습니다</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isChecked = checkedItems.has(item.id);
                            return (
                                <div 
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border
                                    ${item.id === selectedId 
                                        ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10' 
                                        : 'bg-transparent border-transparent hover:bg-surface-hover hover:border-surface-border'}`}
                                >
                                    {/* Checkbox (Hover or Checked) */}
                                    <div 
                                        onClick={(e) => toggleCheck(e, item.id)}
                                        className={`absolute left-3 z-10 size-4 rounded border flex items-center justify-center transition-all bg-white
                                            ${isChecked 
                                                ? 'border-primary bg-primary text-white opacity-100' 
                                                : 'border-surface-border text-transparent opacity-0 group-hover:opacity-100 hover:border-primary'}`}
                                    >
                                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                                    </div>

                                    {/* Icon / Thumbnail */}
                                    <div className={`size-9 rounded-md flex items-center justify-center shrink-0 border overflow-hidden transition-opacity
                                        ${isChecked ? 'opacity-20' : 'opacity-100'}
                                        ${item.status === 'error' ? 'border-error/30 bg-error/5 text-error' : 'border-surface-border bg-surface text-text-secondary'}`}
                                    >
                                        {item.mediaType === 'image' && item.previewUrl ? (
                                            <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">{getMediaTypeIcon(item.mediaType)}</span>
                                        )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className={`flex flex-col min-w-0 flex-1 gap-0.5 ${isChecked ? 'opacity-50' : ''}`}>
                                        <span className={`text-sm truncate leading-tight ${item.id === selectedId ? 'font-semibold text-text-main' : 'font-medium text-text-secondary'}`}>
                                            {item.file.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-medium uppercase ${
                                                item.status === 'done' ? 'text-success' : 
                                                item.status === 'processing' ? 'text-primary' : 
                                                item.status === 'error' ? 'text-error' : 'text-text-muted'
                                            }`}>
                                                {item.status === 'done' ? '완료' : item.status === 'processing' ? '분석 중' : item.status === 'error' ? '오류' : '대기'}
                                            </span>
                                            {item.id === selectedId && item.status === 'processing' && (
                                                <span className="material-symbols-outlined text-[10px] animate-spin text-primary">progress_activity</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </aside>
    </>
  );
};