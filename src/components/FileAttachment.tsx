// src/components/FileAttachment.tsx
"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Paperclip, X, File, Image as ImageIcon } from "lucide-react";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface FileAttachmentProps {
  onFilesAttached: (files: AttachedFile[]) => void;
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
}

export function FileAttachment({ onFilesAttached, attachedFiles, onRemoveFile }: FileAttachmentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const processedFiles: AttachedFile[] = [];

    for (const file of fileArray) {
      const id = generateId();
      const isImage = file.type.startsWith('image/');
      
      const attachedFile: AttachedFile = {
        id,
        file,
        type: isImage ? 'image' : 'document'
      };

      // 画像の場合はプレビューを生成
      if (isImage) {
        try {
          const preview = await createImagePreview(file);
          attachedFile.preview = preview;
        } catch (error) {
          console.error('Failed to create image preview:', error);
        }
      }

      processedFiles.push(attachedFile);
    }

    onFilesAttached([...attachedFiles, ...processedFiles]);
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* ファイル選択ボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => imageInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-3 py-1 ring-1 ring-neutral-200 hover:bg-neutral-100"
          type="button"
        >
          <Camera className="h-4 w-4" aria-hidden />
          <span>写真</span>
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-3 py-1 ring-1 ring-neutral-200 hover:bg-neutral-100"
          type="button"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          <span>ファイル</span>
        </button>
      </div>

      {/* ドロップエリア */}
      {dragOver && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center text-blue-600"
        >
          ファイルをここにドロップしてください
        </div>
      )}

      {!dragOver && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="min-h-0"
        />
      )}

      {/* 添付ファイル一覧 */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {attachedFiles.map((attachedFile) => (
            <div
              key={attachedFile.id}
              className="flex items-center gap-2 rounded-lg border bg-gray-50 p-2"
            >
              {/* ファイルアイコンまたはプレビュー */}
              <div className="flex-shrink-0">
                {attachedFile.type === 'image' && attachedFile.preview ? (
                  <Image
                    src={attachedFile.preview}
                    alt={attachedFile.file.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : attachedFile.type === 'image' ? (
                  <ImageIcon className="h-10 w-10 rounded bg-gray-200 p-2 text-gray-500" />
                ) : (
                  <File className="h-10 w-10 rounded bg-gray-200 p-2 text-gray-500" />
                )}
              </div>

              {/* ファイル情報 */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {attachedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachedFile.file.size)}
                </p>
              </div>

              {/* 削除ボタン */}
              <button
                onClick={() => onRemoveFile(attachedFile.id)}
                className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 隠しファイル入力 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}