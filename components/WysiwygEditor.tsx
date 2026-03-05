"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Quote, Code2 } from "lucide-react";

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
    const url = prompt("Enter URL (https://...)");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter public image URL (must be shared)");
    if (url) {
      execCmd("insertImage", url);
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => execCmd("bold")} className="p-2 hover:bg-gray-200 rounded" title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCmd("italic")} className="p-2 hover:bg-gray-200 rounded" title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCmd("insertUnorderedList")} className="p-2 hover:bg-gray-200 rounded" title="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCmd("insertOrderedList")} className="p-2 hover:bg-gray-200 rounded" title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "blockquote")} className="p-2 hover:bg-gray-200 rounded" title="Quote">
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "pre")} className="p-2 hover:bg-gray-200 rounded" title="Code block">
          <Code2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertLink} className="p-2 hover:bg-gray-200 rounded" title="Insert link">
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertImage} className="p-2 hover:bg-gray-200 rounded" title="Insert image from URL">
          <ImageIcon className="h-4 w-4" />
        </button>
        <span className="ml-auto text-xs text-gray-500">
          Images must use a shared/public URL (no file uploads).
        </span>
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
