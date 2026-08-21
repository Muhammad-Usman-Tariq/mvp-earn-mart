'use client';

import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onUploadSuccess: (data: { url: string; filename: string; hash: string }) => void;
  helperText?: string;
}

export default function FileUpload({
  label,
  accept = 'image/*',
  onUploadSuccess,
  helperText = 'Upload screenshot or document (PNG, JPG, WEBP)',
}: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedUrl(data.url);
      setFilename(data.filename);
      onUploadSuccess({ url: data.url, filename: data.filename, hash: data.hash });
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="input-label">
        {label}
      </label>

      {uploadedUrl ? (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileCheck className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs font-bold text-text-primary truncate max-w-[200px]">{filename}</p>
              <p className="text-[10px] text-text-muted">Upload successful</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadedUrl(null);
              setFilename(null);
            }}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className="p-6 rounded-xl bg-surface-3 border border-dashed border-surface-border hover:border-brand-500/50 flex flex-col items-center justify-center text-center transition-colors">
            {loading ? (
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-text-muted mb-2" />
            )}
            <span className="text-xs font-semibold text-text-primary">
              {loading ? 'Uploading...' : 'Click or drop file to upload'}
            </span>
            <span className="text-[10px] text-text-muted mt-1">{helperText}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error mt-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
