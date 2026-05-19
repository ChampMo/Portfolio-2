'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface Props {
  imageUrl: string;
  isUploading: boolean;
  onFileDrop: (file: File) => void;
  className?: string;
  placeholder?: string;
}

export default function DragDropImageUpload({
  imageUrl,
  isUploading,
  onFileDrop,
  className = 'h-40',
  placeholder = 'CLICK OR DRAG IMAGE HERE',
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onFileDrop(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
    e.target.value = '';
  };

  return (
    <div
      className={`border-2 border-dashed rounded-sm flex flex-col items-center justify-center cursor-pointer relative group overflow-hidden transition-all ${
        isDragOver
          ? 'border-fuchsia-400 bg-fuchsia-950/20'
          : 'border-sky-300/20 dark:border-fuchsia-500/30 bg-sky-950/10 dark:bg-fuchsia-950/10 hover:border-fuchsia-400 hover:bg-sky-950/30 dark:hover:bg-fuchsia-950/30'
      } ${className}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {isUploading ? (
        <Loader2 size={24} className="text-fuchsia-500 animate-spin" />
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt="uploaded" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-all" />
          {isDragOver && <div className="absolute inset-0 bg-fuchsia-950/50 z-10" />}
          <div className="relative z-20 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center gap-1">
            <UploadCloud size={24} className="text-white" />
            <span className="text-[10px] font-mono text-white/70">{isDragOver ? 'DROP TO REPLACE' : 'CLICK TO REPLACE'}</span>
          </div>
        </>
      ) : (
        <>
          <UploadCloud size={24} className={`mb-2 transition-colors ${isDragOver ? 'text-fuchsia-400' : 'text-fuchsia-400/50'}`} />
          <span className="text-[10px] font-mono text-sky-300/50">{isDragOver ? 'DROP TO UPLOAD' : placeholder}</span>
        </>
      )}
    </div>
  );
}
