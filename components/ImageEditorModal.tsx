import React, { useRef, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (blob: Blob) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageUrl, onSave }) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageUrl) return null;

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
        cropper.getCroppedCanvas().toBlob((blob) => {
            if (blob) {
                onSave(blob);
                onClose();
            }
        }, 'image/png');
    }
  };

  const handleRotate = (degree: number) => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
          cropper.rotate(degree);
          setRotation(prev => prev + degree);
      }
  };

  const handleReset = () => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
          cropper.reset();
          setRotation(0);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">crop_rotate</span>
                이미지 편집
            </h3>
            <button 
                onClick={onClose}
                className="text-text-secondary hover:text-error transition-colors p-1 rounded-full hover:bg-error-light"
            >
                <span className="material-symbols-outlined text-xl block">close</span>
            </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-black/90 relative overflow-hidden flex items-center justify-center p-4">
            <Cropper
                src={imageUrl}
                style={{ height: "100%", width: "100%", maxHeight: "60vh" }}
                initialAspectRatio={NaN}
                guides={true}
                viewMode={1}
                dragMode="move"
                background={false}
                responsive={true}
                autoCropArea={1}
                checkOrientation={false} 
                ref={cropperRef}
            />
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 bg-surface-subtle border-t border-border flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
                <button onClick={() => handleRotate(-90)} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-all text-text-secondary" title="왼쪽으로 90도 회전">
                    <span className="material-symbols-outlined">rotate_left</span>
                    <span className="text-[10px] font-bold">반시계</span>
                </button>
                <button onClick={() => handleRotate(90)} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-all text-text-secondary" title="오른쪽으로 90도 회전">
                    <span className="material-symbols-outlined">rotate_right</span>
                    <span className="text-[10px] font-bold">시계</span>
                </button>
                <div className="w-px h-8 bg-border mx-2"></div>
                <button onClick={handleReset} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-all text-text-secondary" title="초기화">
                    <span className="material-symbols-outlined">restart_alt</span>
                    <span className="text-[10px] font-bold">리셋</span>
                </button>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-white border border-transparent hover:border-border transition-all"
                >
                    취소
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">save</span>
                    저장 및 적용
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
