"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";

interface NoteItem {
  id: string;
  text: string;
  created_at: string;
  edited_at: string;
}

interface DailyNote {
  id: string;
  date: string;
  se: NoteItem[];
  cosa: NoteItem[];
  chi: NoteItem[];
}

interface NotesPageProps {
  userId: string;
}

// Format date as "4gen26"
const formatNoteDate = (date: Date): string => {
  const day = date.getDate();
  const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
};

// Get today's date string
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export function NotesPage({ userId }: NotesPageProps) {
  const t = useTranslations('notes');
  
  // For now, use local state (will connect to Supabase later)
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [activeNote, setActiveNote] = useState<DailyNote | null>(null);
  const [newItemText, setNewItemText] = useState({ se: '', cosa: '', chi: '' });

  // Create or get today's note
  const getOrCreateTodayNote = (): DailyNote => {
    const today = getTodayString();
    const existing = notes.find(n => n.date === today);
    if (existing) return existing;
    
    const newNote: DailyNote = {
      id: crypto.randomUUID(),
      date: today,
      se: [],
      cosa: [],
      chi: [],
    };
    setNotes([newNote, ...notes]);
    return newNote;
  };

  // Open today's note when + is pressed
  const handleNewNote = () => {
    const todayNote = getOrCreateTodayNote();
    setActiveNote(todayNote);
  };

  // Add item to a field
  const handleAddItem = (field: 'se' | 'cosa' | 'chi') => {
    if (!activeNote || !newItemText[field].trim()) return;
    
    const newItem: NoteItem = {
      id: crypto.randomUUID(),
      text: newItemText[field].trim(),
      created_at: new Date().toISOString(),
      edited_at: new Date().toISOString(),
    };
    
    const updatedNote = {
      ...activeNote,
      [field]: [...activeNote[field], newItem],
    };
    
    setActiveNote(updatedNote);
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    setNewItemText({ ...newItemText, [field]: '' });
  };

  // Remove item from a field
  const handleRemoveItem = (field: 'se' | 'cosa' | 'chi', itemId: string) => {
    if (!activeNote) return;
    
    const updatedNote = {
      ...activeNote,
      [field]: activeNote[field].filter(item => item.id !== itemId),
    };
    
    setActiveNote(updatedNote);
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  // Render a field section
  const renderField = (field: 'se' | 'cosa' | 'chi', label: string) => (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[var(--accent-primary)]">{label}</p>
      
      {/* Existing items */}
      {activeNote && activeNote[field].map(item => (
        <div key={item.id} className="flex items-start gap-2 group">
          <span className="text-[var(--foreground-muted)]">•</span>
          <p className="flex-1 text-sm">{item.text}</p>
          <button
            onClick={() => handleRemoveItem(field, item.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      
      {/* Add new item */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--foreground-muted)]">•</span>
        <input
          type="text"
          value={newItemText[field]}
          onChange={(e) => setNewItemText({ ...newItemText, [field]: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(field)}
          placeholder="..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]/50"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        
        {!activeNote && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewNote}
            className="p-2 rounded-xl bg-[var(--accent-primary)] text-black"
          >
            <Plus size={20} />
          </motion.button>
        )}
      </div>

      {activeNote ? (
        /* Active note editor */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Note header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground-muted)]">
              {formatNoteDate(new Date(activeNote.date))}
            </h2>
            <button
              onClick={() => setActiveNote(null)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              {t('close')}
            </button>
          </div>
          
          {/* Note content */}
          <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-6">
            {renderField('se', 'Se')}
            {renderField('cosa', 'Cosa')}
            {renderField('chi', 'Chi')}
          </div>
        </motion.div>
      ) : (
        /* Notes list */
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--foreground-muted)]">{t('empty')}</p>
              <p className="text-sm text-[var(--foreground-muted)] mt-2">{t('tapPlus')}</p>
            </div>
          ) : (
            notes.map(note => (
              <motion.button
                key={note.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setActiveNote(note)}
                className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-left"
              >
                <p className="font-bold mb-2">{formatNoteDate(new Date(note.date))}</p>
                <div className="text-sm text-[var(--foreground-muted)] space-y-1">
                  {note.se.length > 0 && <p>Se: {note.se.length} •</p>}
                  {note.cosa.length > 0 && <p>Cosa: {note.cosa.length} •</p>}
                  {note.chi.length > 0 && <p>Chi: {note.chi.length} •</p>}
                </div>
              </motion.button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

