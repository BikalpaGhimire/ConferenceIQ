import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseJsonFromResponse } from '../utils/parseJson';
import { Avatar } from './ui/Avatar';
import { X, Loader2, ClipboardPaste, Search, Users } from 'lucide-react';

export function PasteModal({ onClose }) {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedNames, setExtractedNames] = useState(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: 'Extract all person names from the provided text. Return ONLY a JSON array of objects with "name" and "context" (role, affiliation, or any identifying info found near their name). No markdown fences, no explanation.',
          messages: [
            {
              role: 'user',
              content: `Extract all person names from this text:\n\n${text}\n\nReturn: [{"name": "", "context": ""}]`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const responseText = data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('') || '';

      const names = parseJsonFromResponse(responseText);

      if (!names || !Array.isArray(names) || names.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No names found in the pasted text.' });
        onClose();
        return;
      }

      // Show extracted names so user can pick
      setExtractedNames(names);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOne = (name) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: name });
    onClose();
    // Small delay so dispatch processes before parent re-renders
    setTimeout(() => {
      document.getElementById('search-form')?.requestSubmit();
    }, 50);
  };

  const handleProfileAll = () => {
    const formatted = extractedNames.map((n) => ({
      name: n.name,
      affiliation: n.context || '',
      talk_title: '',
      session_title: 'Extracted from pasted text',
      session_time: '',
    }));

    dispatch({
      type: 'SET_EXTRACTED_NAMES',
      payload: { names: formatted, source: 'Pasted text' },
    });
    dispatch({ type: 'SET_VIEW', payload: 'schedule' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in border border-border max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-white">
            {extractedNames ? 'Names Found' : 'Paste Text'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!extractedNames ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste any text containing names (emails, bios, speaker lists, abstracts, etc.)..."
              className="w-full bg-navy rounded-xl p-4 text-sm text-white placeholder-muted/50 outline-none border border-border focus:border-amber/30 min-h-[200px] resize-y"
              autoFocus
            />
            <button
              onClick={handleExtract}
              disabled={loading || !text.trim()}
              className="w-full mt-4 py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting names...
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-4 h-4" />
                  Extract Names
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted mb-3">
              Found {extractedNames.length} name{extractedNames.length !== 1 ? 's' : ''}. Tap one to search, or profile all.
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {extractedNames.map((person, i) => (
                <button
                  key={person.name + i}
                  onClick={() => handleSelectOne(person.name)}
                  className="w-full flex items-center gap-3 p-3 bg-navy rounded-xl hover:bg-navy-light transition-colors text-left group"
                >
                  <Avatar name={person.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{person.name}</p>
                    {person.context && (
                      <p className="text-xs text-muted truncate">{person.context}</p>
                    )}
                  </div>
                  <Search className="w-4 h-4 text-muted group-hover:text-amber transition-colors shrink-0" />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setExtractedNames(null)}
                className="flex-1 py-2.5 bg-navy border border-border rounded-xl text-sm text-muted hover:text-white transition-colors"
              >
                Back
              </button>
              {extractedNames.length > 1 && (
                <button
                  onClick={handleProfileAll}
                  className="flex-1 py-2.5 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Profile All ({extractedNames.length})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
