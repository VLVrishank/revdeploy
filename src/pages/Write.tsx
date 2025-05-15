import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Quote, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

const Write = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none',
      },
    },
  });

  const handleSave = async (publish: boolean = false) => {
    if (!user || !profile || !editor) return;
    setError(null);

    const action = publish ? setPublishing : setSaving;
    action(true);

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([
          {
            title,
            content: editor.getJSON(),
            author_id: profile.id, // Use profile.id instead of user.id
            published: publish,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (publish) {
        navigate(`/article/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      setError('Failed to save article. Please try again.');
    } finally {
      action(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full font-serif text-4xl font-bold text-stone-900 bg-transparent border-none outline-none placeholder-stone-300"
        />

        <div className="border-y border-stone-200 py-2 flex gap-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-stone-100 ${
              editor?.isActive('bold') ? 'bg-stone-100' : ''
            }`}
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-stone-100 ${
              editor?.isActive('italic') ? 'bg-stone-100' : ''
            }`}
          >
            <Italic className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-stone-100 ${
              editor?.isActive('blockquote') ? 'bg-stone-100' : ''
            }`}
          >
            <Quote className="w-5 h-5" />
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-stone-100"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        <EditorContent editor={editor} className="min-h-[500px]" />

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || publishing}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || publishing}
            className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Write;