import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface HelpModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const mdComponents = {
  p:      ({children}: any) => <p className="mb-2 last:mb-0">{children}</p>,
  br:     () => <br />,
  strong: ({children}: any) => <strong className="font-semibold text-[var(--color-lw-gold-300)]">{children}</strong>,
  em:     ({children}: any) => <em className="italic text-[var(--color-lw-text-sub)]">{children}</em>,
  ul:     ({children}: any) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
  ol:     ({children}: any) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
  li:     ({children}: any) => <li className="text-[var(--color-lw-text-sub)]">{children}</li>,
  h2:     ({children}: any) => <h2 className="font-bold text-[var(--color-lw-text)] text-base mb-2 mt-4 first:mt-0 pb-1 border-b border-[var(--color-lw-border)]">{children}</h2>,
  h3:     ({children}: any) => <h3 className="font-semibold text-[var(--color-lw-text)] mb-1 mt-3 first:mt-0">{children}</h3>,
  code:   ({children}: any) => <code className="font-mono text-[var(--color-lw-fel-400)] bg-[var(--color-lw-base)] px-1.5 py-0.5 rounded text-xs">{children}</code>,
  hr:     () => <hr className="border-[var(--color-lw-border)] my-3"/>,
};

export function HelpModal({ title, content, onClose }: HelpModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--color-lw-card)] border border-[var(--color-lw-border)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-lw-border)]">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[var(--color-lw-fel-500)]/20 border border-[var(--color-lw-fel-400)]/30 flex items-center justify-center text-[var(--color-lw-fel-400)] text-xs font-bold">?</span>
            <h3 className="text-sm font-semibold text-[var(--color-lw-text)]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] transition-colors p-1 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 text-sm text-[var(--color-lw-text)] leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
