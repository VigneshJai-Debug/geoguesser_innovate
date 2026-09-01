import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '../api/client';
import { TimerBadge } from './TimerBadge';

interface Event1Props {
  timeRemainingMs: number;
  onComplete: () => void;
  onExpire: () => void;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'TIMED_OUT';
}

export const Event1ForgottenHill: React.FC<Event1Props> = ({
  timeRemainingMs,
  onComplete,
  onExpire,
  status
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a screenshot to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Upload to Vercel Blob
      const formData = new FormData();
      formData.append('screenshot', selectedFile);

      // fetch wrapper sets content-type to application/json by default. 
      // We must override it for FormData, but fetch requires it to be omitted to set boundary.
      // We'll manually do a fetch for the upload to avoid the client.ts header override
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/events/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload screenshot.');
      }

      // 2. Complete the event
      await apiFetch('/api/events/complete', {
        method: 'POST',
        body: JSON.stringify({
          eventNumber: 1,
          submissionBlobUrl: data.url,
        }),
      });

      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit event.');
    } finally {
      setIsUploading(false);
    }
  };

  if (status !== 'ACTIVE') {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in text-center">
        <div className="neu-card p-8 rounded-3xl flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">SUBMISSION RECEIVED</h2>
          <p className="text-slate-300">
            Your completion screenshot has been submitted and your event submission has been recorded.
          </p>
          <p className="text-slate-400 mt-2 text-sm italic">
            Manual verification may be carried out by the organizing team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 animate-fade-in flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-widest text-rose-400 uppercase px-3.5 py-1.5 rounded-full neu-pressed inline-flex items-center gap-1.5 border border-rose-500/20">
            EVENT 1 · FORGOTTEN HILL
          </span>
        </div>
        <TimerBadge initialTimeRemainingMs={timeRemainingMs} onExpire={onExpire} />
      </div>

      <div className="w-full neu-card p-6 sm:p-8 rounded-3xl mb-6 flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
          FORGOTTEN HILL: SURGERY
        </h2>
        
        <p className="text-slate-200 mb-6 font-medium leading-relaxed max-w-lg">
          Complete the game externally. Once finished, upload a screenshot showing successful completion.
          Your submission will be manually verified by the organizing team.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="neu-inset w-full p-8 rounded-2xl flex flex-col items-center justify-center gap-3 border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer group"
          >
            {selectedFile ? (
              <>
                <ImageIcon className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold text-sm truncate max-w-[250px]">
                  {selectedFile.name}
                </span>
                <span className="text-slate-400 text-xs">Click to change file</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-rose-400 group-hover:scale-110 transition-all" />
                <span className="text-slate-300 font-bold text-sm">Select Screenshot</span>
              </>
            )}
          </button>

          {errorMessage && (
            <div className="text-sm font-bold text-rose-400 mt-2 bg-rose-950/40 p-3 rounded-xl border border-rose-500/20">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className={`neu-btn w-full py-4 mt-4 rounded-2xl text-sm font-black tracking-wider uppercase text-white flex items-center justify-center gap-2 transition-all duration-200 ${
              !selectedFile || isUploading
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'hover:text-rose-400 hover:border-rose-500/40 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                UPLOADING...
              </>
            ) : (
              <>
                SUBMIT FOR VERIFICATION
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
