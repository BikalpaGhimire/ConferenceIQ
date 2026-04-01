import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Check } from 'lucide-react';

export function NotesEditor({ name }) {
  const { state, dispatch } = useApp();
  const [text, setText] = useState(state.notes[name] || '');
  const [saved, setSaved] = useState(false);

  const noteFromState = state.notes[name] || '';
  useEffect(() => {
    setText(noteFromState);
  }, [name, noteFromState]);

  const handleSave = () => {
    dispatch({ type: 'SET_NOTE', payload: { name, text } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Auto-save on blur
  const handleBlur = () => {
    if (text !== (state.notes[name] || '')) {
      handleSave();
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add personal notes about this person... (e.g., what you talked about, follow-up plans)"
        className="w-full bg-navy rounded-lg p-3 text-sm text-gray-300 placeholder-muted/50 outline-none border border-border focus:border-amber/30 min-h-[100px] resize-y transition-colors"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-amber/10 text-amber hover:bg-amber/20"
        >
          {saved ? (
            <>
              <Check className="w-3 h-3" />
              Saved
            </>
          ) : (
            'Save Notes'
          )}
        </button>
      </div>
    </div>
  );
}
