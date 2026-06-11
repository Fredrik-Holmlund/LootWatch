import { useRef } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

type WrapFormat = { prefix: string; suffix: string; placeholder: string };
type LineFormat = { prefix: string; placeholder: string };

function insertWrap(
  textarea: HTMLTextAreaElement,
  onChange: (v: string) => void,
  { prefix, suffix, placeholder }: WrapFormat
) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const selected = value.slice(s, e) || placeholder;
  const next = value.slice(0, s) + prefix + selected + suffix + value.slice(e);
  onChange(next);
  setTimeout(() => {
    const cur = s + prefix.length;
    textarea.focus();
    textarea.setSelectionRange(cur, cur + selected.length);
  }, 0);
}

function insertLine(
  textarea: HTMLTextAreaElement,
  onChange: (v: string) => void,
  { prefix, placeholder }: LineFormat
) {
  const { selectionStart: s, value } = textarea;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const lineEnd = value.indexOf('\n', s);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end) || placeholder;
  const already = line.startsWith(prefix);
  const newLine = already ? line.slice(prefix.length) : prefix + (line || placeholder);
  const next = value.slice(0, lineStart) + newLine + value.slice(end);
  onChange(next);
  setTimeout(() => {
    textarea.focus();
    const cur = lineStart + newLine.length;
    textarea.setSelectionRange(cur, cur);
  }, 0);
}

const BTN = 'px-2 py-1 rounded text-xs text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:bg-[var(--color-lw-border)] transition-colors select-none';

export function MarkdownEditor({ value, onChange, rows = 5, placeholder }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (fmt: WrapFormat) => ref.current && insertWrap(ref.current, onChange, fmt);
  const line = (fmt: LineFormat) => ref.current && insertLine(ref.current, onChange, fmt);

  return (
    <div className="rounded-lg border border-[var(--color-lw-border)] focus-within:border-[var(--color-lw-fel-400)]/60 transition-colors overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]">
        <button type="button" className={BTN} title="Bold" onClick={() => wrap({ prefix: '**', suffix: '**', placeholder: 'bold text' })}>
          <strong>B</strong>
        </button>
        <button type="button" className={BTN} title="Italic" onClick={() => wrap({ prefix: '*', suffix: '*', placeholder: 'italic text' })}>
          <em>I</em>
        </button>
        <button type="button" className={`${BTN} line-through`} title="Strikethrough" onClick={() => wrap({ prefix: '~~', suffix: '~~', placeholder: 'text' })}>
          S
        </button>

        <div className="w-px h-4 bg-[var(--color-lw-border)] mx-1"/>

        <button type="button" className={BTN} title="Bullet list" onClick={() => line({ prefix: '- ', placeholder: 'list item' })}>
          ≡
        </button>
        <button type="button" className={BTN} title="Numbered list" onClick={() => line({ prefix: '1. ', placeholder: 'list item' })}>
          1.
        </button>

        <div className="w-px h-4 bg-[var(--color-lw-border)] mx-1"/>

        <button type="button" className={BTN} title="Heading" onClick={() => line({ prefix: '## ', placeholder: 'Heading' })}>
          H
        </button>
        <button type="button" className={`${BTN} font-mono`} title="Code" onClick={() => wrap({ prefix: '`', suffix: '`', placeholder: 'code' })}>
          {'</>'}
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-lw-base)] px-3 py-2.5 text-sm text-[var(--color-lw-text)] placeholder:text-[var(--color-lw-text-muted)] focus:outline-none resize-none font-mono"
      />
    </div>
  );
}
