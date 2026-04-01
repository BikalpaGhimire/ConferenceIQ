import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { extractScheduleNames } from '../services/api';
import { X, Upload, Loader2, FileText, Image } from 'lucide-react';

export function FileUploader({ onClose }) {
  const { dispatch } = useApp();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  const handleFile = async (file) => {
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Unsupported file type. Please upload a PDF, PNG, or JPG.',
      });
      return;
    }

    setUploading(true);

    try {
      const base64 = await fileToBase64(file);
      const result = await extractScheduleNames(base64, file.type);

      if (!result || !result.sessions || result.sessions.length === 0) {
        dispatch({
          type: 'SET_ERROR',
          payload: "Couldn't extract names from this file. Try a cleaner PDF, or paste the text directly.",
        });
        setUploading(false);
        onClose();
        return;
      }

      // Flatten sessions into a name list
      const names = [];
      (result.sessions || []).forEach((session) => {
        (session.speakers || []).forEach((speaker) => {
          if (speaker.name) {
            names.push({
              name: speaker.name,
              affiliation: speaker.affiliation || '',
              talk_title: speaker.talk_title || '',
              session_title: session.title || '',
              session_time: session.time || '',
            });
          }
        });
      });

      if (names.length === 0) {
        dispatch({
          type: 'SET_ERROR',
          payload: "Found sessions but no speaker names. Try pasting the text directly.",
        });
        setUploading(false);
        onClose();
        return;
      }

      dispatch({
        type: 'SET_EXTRACTED_NAMES',
        payload: { names, source: file.name },
      });
      dispatch({ type: 'SET_VIEW', payload: 'schedule' });
      onClose();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-white">Upload Schedule</h3>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-amber bg-amber/5'
              : 'border-border hover:border-amber/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber animate-spin" />
              <p className="text-sm text-muted">Extracting names from schedule...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-sm text-white mb-1">Drop your schedule here</p>
              <p className="text-xs text-muted mb-4">PDF, PNG, or JPG</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber/10 text-amber rounded-lg text-sm font-medium hover:bg-amber/20 transition-colors"
              >
                Choose File
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="mt-4 flex items-center gap-3 text-xs text-muted">
          <FileText className="w-4 h-4 shrink-0" />
          <span>Supports conference programs, agendas, and speaker lists</span>
        </div>
      </div>
    </div>
  );
}
