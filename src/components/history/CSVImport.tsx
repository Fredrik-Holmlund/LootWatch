import React, { useRef, useState } from 'react';
import { parseRCLootCouncilCSV } from '../../utils/csvParser';
import type { LootEntry } from '../../types';

interface CSVImportProps {
  onImport: (entries: Omit<LootEntry, 'id' | 'created_at'>[]) => Promise<string | null>;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ count: number; warnings: string[] } | null>(null);
  const [parsed, setParsed] = useState<Omit<LootEntry, 'id' | 'created_at'>[] | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { entries, errors } = parseRCLootCouncilCSV(text);
      setParsed(entries);
      setPreview({ count: entries.length, warnings: errors });
      setStatus(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed || parsed.length === 0) return;
    setImporting(true);
    const err = await onImport(parsed);
    if (err) {
      setStatus({ type: 'error', message: err });
    } else {
      setStatus({ type: 'success', message: `Imported ${parsed.length} entries successfully.` });
      setParsed(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
    setImporting(false);
  }

  function handleCancel() {
    setParsed(null);
    setPreview(null);
    setStatus(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span>📥</span> Import RCLootCouncil CSV
      </h3>

      {!preview ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-8 cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors group">
          <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📂</span>
          <span className="text-sm text-gray-400 font-medium">Click to select CSV file</span>
          <span className="text-xs text-gray-600 mt-1">RCLootCouncil export format</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {preview.count} loot entries found
              </p>
              {preview.warnings.length > 0 && (
                <p className="text-xs text-yellow-400 mt-0.5">
                  {preview.warnings.length} row(s) skipped
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || preview.count === 0}
                className="text-xs px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${preview.count} Entries`}
              </button>
            </div>
          </div>

          {preview.warnings.length > 0 && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-400">
                View {preview.warnings.length} warnings
              </summary>
              <ul className="mt-2 space-y-1 pl-2 border-l border-gray-800">
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {status && (
        <div
          className={`mt-3 text-xs px-3 py-2 rounded-lg ${
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
