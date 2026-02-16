import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Link, Image, Quote, Type } from 'lucide-react';

export const RichEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Masukkan URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Masukkan URL gambar:');
    if (url) exec('insertImage', url);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-slate-50">
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('formatBlock', 'h2')} title="Heading">
          <Heading1 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('formatBlock', 'h3')} title="Subheading">
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('formatBlock', 'p')} title="Normal">
          <Type className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-300 mx-0.5 self-center" />
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('underline')} title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-300 mx-0.5 self-center" />
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('insertUnorderedList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('insertOrderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec('formatBlock', 'blockquote')} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-300 mx-0.5 self-center" />
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={insertLink} title="Link">
          <Link className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={insertImage} title="Image">
          <Image className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-300 mx-0.5 self-center" />
        <input type="color" className="w-7 h-7 rounded cursor-pointer border-0" title="Text Color"
          onChange={(e) => exec('foreColor', e.target.value)} />
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[120px] p-3 text-sm text-gray-700 leading-relaxed focus:outline-none prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight: '120px' }}
      />
    </div>
  );
};
