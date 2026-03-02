"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function WysiwygEditor({ value, onChange, placeholder = "Write content...", className = "", minHeight = "200px" }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => execCmd("bold")} className="p-2 hover:bg-gray-200 rounded" title="Bold"><Bold className="h-4 w-4" /></button>
        <button type="button" onClick={() => execCmd("italic")} className="p-2 hover:bg-gray-200 rounded" title="Italic"><Italic className="h-4 w-4" /></button>
        <button type="button" onClick={() => execCmd("insertUnorderedList")} className="p-2 hover:bg-gray-200 rounded" title="Bullet list"><List className="h-4 w-4" /></button>
        <button type="button" onClick={() => execCmd("insertOrderedList")} className="p-2 hover:bg-gray-200 rounded" title="Numbered list"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" onClick={insertLink} className="p-2 hover:bg-gray-200 rounded" title="Insert link"><LinkIcon className="h-4 w-4" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 outline-none focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
