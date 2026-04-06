import React, { useRef, useState } from 'react';
import { parseRCLootCouncilCSV } from '../../utils/csvParser';
import type { LootEntry } from '../../types';

interface CSVImportProps {
  onImport: (entries: Omit<LootEntry, 'id' | 'created_at'>[]) => Promise<string | null>;
}

type Mode = 'idle' | 'paste' | 'preview';

export function CSVImport({ onImport }: CSVImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<Omit<LootEntry, 'id' | 'created_at'>[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = useState(false);

  function processText(text: string) {
    const { entries, errors } = parseRCLootCouncilCSV(text);
    setParsed(entries);
    setWarnings(errors);
    setStatus(null);
    setMode('preview');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processText(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;
    processText(pasteText.trim());
  }

  async function handleImport() {
    if (!parsed || parsed.length === 0) return;
    setImporting(true);
    const err = await onImport(parsed);
    if (err) {
      setStatus({ type: 'error', message: err });
    } else {
      setStatus({ type: 'success', message: `Imported ${parsed.length} entries successfully.` });
      reset();
    }
    setImporting(false);
  }

  function reset() {
    setParsed(null);
    setWarnings([]);
    setPasteText('');
    setMode('idle');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <span>📥</span> Import RCLootCouncil CSV
      </h3>

      {mode === 'idle' && (
        <div className="flex gap-3">
          {/* File upload */}
          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors group">
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📂</span>
            <span className="text-sm text-gray-400 font-medium">Upload file</span>
            <span className="text-xs text-gray-600 mt-0.5">.csv</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {/* Paste */}
          <button
            onClick={() => setMode('paste')}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors group"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📋</span>
            <span className="text-sm text-gray-400 font-medium">Paste CSV</span>
            <span className="text-xs text-gray-600 mt-0.5">from RCLootCouncil</span>
          </button>
        </div>
      )}

      {mode === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Paste RCLootCouncil CSV here…\n\nplayer,date,time,id,item,itemID,…"}
            rows={8}
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-yellow-500 resize-y"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={reset}
              className="text-xs px-3 py-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pasteText.trim()}
              className="text-xs px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Parse
            </button>
          </div>
        </form>
      )}

      {mode === 'preview' && parsed && (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{parsed.length} entries found</p>
              {warnings.length > 0 && (
                <p className="text-xs text-yellow-400 mt-0.5">{warnings.length} row(s) skipped</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="text-xs px-3 py-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || parsed.length === 0}
                className="text-xs px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${parsed.length} Entries`}
              </button>
            </div>
          </div>

          {warnings.length > 0 && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-400">
                View {warnings.length} warnings
              </summary>
              <ul className="mt-2 space-y-1 pl-2 border-l border-gray-800">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {status && (
        <div
          className={`text-xs px-3 py-2 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
