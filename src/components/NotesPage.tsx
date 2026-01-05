"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Loader2, Archive, Edit3, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getUserNotes, 
  getOrCreateTodayNote, 
  addNoteItem, 
  removeNoteItem,
  updateNote,
  archiveOldNotes,
  getArchivedNotes
} from "@/lib/supabase";
import type { DailyNote, NoteItem, ArchivedNote } from "@/types";

interface NotesPageProps {
  userId: string;
}

// Format date as "4gen26"
const formatNoteDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
};

// Check if a note is older than 7 days
const isExpiring = (dateStr: string): boolean => {
  const noteDate = new Date(dateStr);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return noteDate < sevenDaysAgo;
};

// Check if a note is today's note
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

// Get today's date string
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export function NotesPage({ userId }: NotesPageProps) {
  const t = useTranslations('notes');
  
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<ArchivedNote[]>([]);
  const [activeNote, setActiveNote] = useState<DailyNote | null>(null);
  const [newItemText, setNewItemText] = useState({ se: '', cosa: '', chi: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [expiringAction, setExpiringAction] = useState<{ noteId: string; action: 'edit' | 'archive' } | null>(null);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [userId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getUserNotes(userId);
      // Ensure arrays are properly initialized
      const normalizedNotes = data.map(note => ({
        ...note,
        se: Array.isArray(note.se) ? note.se : [],
        cosa: Array.isArray(note.cosa) ? note.cosa : [],
        chi: Array.isArray(note.chi) ? note.chi : [],
      }));
      setNotes(normalizedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
    setLoading(false);
  };

  const loadArchivedNotes = async () => {
    const data = await getArchivedNotes(userId);
    setArchivedNotes(data);
  };

  // Open today's note when + is pressed
  const handleNewNote = async () => {
    setSaving(true);
    try {
      const todayNote = await getOrCreateTodayNote(userId);
      if (todayNote) {
        const normalized = {
          ...todayNote,
          se: Array.isArray(todayNote.se) ? todayNote.se : [],
          cosa: Array.isArray(todayNote.cosa) ? todayNote.cosa : [],
          chi: Array.isArray(todayNote.chi) ? todayNote.chi : [],
        };
        setActiveNote(normalized);
        await loadNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
    setSaving(false);
  };

  // Add item to a field
  const handleAddItem = async (field: 'se' | 'cosa' | 'chi') => {
    if (!activeNote || !newItemText[field].trim()) return;
    
    setSaving(true);
    try {
      const newItem = await addNoteItem(activeNote.id, field, newItemText[field].trim());
      
      if (newItem) {
        const updatedNote = {
          ...activeNote,
          [field]: [...activeNote[field], newItem],
        };
        setActiveNote(updatedNote);
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
        setNewItemText({ ...newItemText, [field]: '' });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
    setSaving(false);
  };

  // Remove item from a field
  const handleRemoveItem = async (field: 'se' | 'cosa' | 'chi', itemId: string) => {
    if (!activeNote) return;
    
    try {
      const success = await removeNoteItem(activeNote.id, field, itemId);
      
      if (success) {
        const updatedNote = {
          ...activeNote,
          [field]: activeNote[field].filter(item => item.id !== itemId),
        };
        setActiveNote(updatedNote);
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Handle expiring note action
  const handleExpiringNote = async (note: DailyNote, action: 'edit' | 'archive') => {
    if (action === 'archive') {
      // Archive the note (auto-archive function handles this)
      await archiveOldNotes(userId);
      await loadNotes();
    } else {
      // Edit: merge into today's note or convert to today's note
      const todayNote = notes.find(n => isToday(n.date));
      
      if (todayNote) {
        // Merge: add old note content to today's note with source_date marker
        const mergeItems = (items: NoteItem[], sourceDate: string): NoteItem[] => {
          return items.map(item => ({
            ...item,
            source_date: sourceDate,
            edited_at: new Date().toISOString(),
          }));
        };
        
        const mergedNote = {
          ...todayNote,
          se: [...todayNote.se, ...mergeItems(note.se, note.date)],
          cosa: [...todayNote.cosa, ...mergeItems(note.cosa, note.date)],
          chi: [...todayNote.chi, ...mergeItems(note.chi, note.date)],
        };
        
        await updateNote(todayNote.id, {
          se: mergedNote.se,
          cosa: mergedNote.cosa,
          chi: mergedNote.chi,
        });
        
        // Delete the old note by archiving it
        await archiveOldNotes(userId);
        await loadNotes();
        
        // Open the merged note
        setActiveNote(mergedNote);
      } else {
        // No today's note: convert old note to today's note
        await updateNote(note.id, { date: getTodayString() });
        await loadNotes();
        
        // Open the converted note
        const updated = { ...note, date: getTodayString() };
        setActiveNote(updated);
      }
    }
    setExpiringAction(null);
  };

  // Open note with expiring check
  const handleOpenNote = (note: DailyNote) => {
    if (isExpiring(note.date) && !isToday(note.date)) {
      setExpiringAction({ noteId: note.id, action: 'edit' });
    } else {
      setActiveNote(note);
    }
  };

  // Render a field section
  const renderField = (field: 'se' | 'cosa' | 'chi', label: string) => (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[var(--accent-primary)]">{label}</p>
      
      {/* Existing items */}
      {activeNote && activeNote[field].map(item => (
        <div key={item.id} className="flex items-start gap-2 group">
          <span className={item.source_date ? "text-amber-500" : "text-[var(--foreground-muted)]"}>•</span>
          <p className={`flex-1 text-sm ${item.source_date ? "text-amber-500/80" : ""}`}>
            {item.text}
          </p>
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

  // Count total items in a note
  const countItems = (note: DailyNote | ArchivedNote): number => {
    if ('content' in note) {
      // ArchivedNote
      return (note.content.se?.length || 0) + (note.content.cosa?.length || 0) + (note.content.chi?.length || 0);
    }
    return (note.se?.length || 0) + (note.cosa?.length || 0) + (note.chi?.length || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          {!showArchive && (
            <button
              onClick={() => { setShowArchive(true); loadArchivedNotes(); }}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1"
            >
              <Archive size={14} />
              {t('archive')}
            </button>
          )}
          {showArchive && (
            <button
              onClick={() => setShowArchive(false)}
              className="text-sm text-[var(--accent-primary)]"
            >
              ← {t('back')}
            </button>
          )}
        </div>
        
        {!activeNote && !showArchive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewNote}
            disabled={saving}
            className="p-2 rounded-xl bg-[var(--accent-primary)] text-black disabled:opacity-50"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          </motion.button>
        )}
      </div>

      {/* Expiring note action modal */}
      <AnimatePresence>
        {expiringAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setExpiringAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--background)] rounded-2xl p-6 max-w-sm w-full space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold">{t('expiringNote')}</h3>
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {t('expiringDescription')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const note = notes.find(n => n.id === expiringAction.noteId);
                    if (note) handleExpiringNote(note, 'edit');
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--accent-primary)] text-black font-medium flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  {t('editNote')}
                </button>
                <button
                  onClick={() => {
                    const note = notes.find(n => n.id === expiringAction.noteId);
                    if (note) handleExpiringNote(note, 'archive');
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium flex items-center justify-center gap-2"
                >
                  <Archive size={16} />
                  {t('archiveNote')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active note editor */}
      {activeNote ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground-muted)]">
              {formatNoteDate(activeNote.date)}
            </h2>
            <button
              onClick={() => setActiveNote(null)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              {t('close')}
            </button>
          </div>
          
          <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-6">
            {renderField('se', 'Se')}
            {renderField('cosa', 'Cosa')}
            {renderField('chi', 'Chi')}
          </div>
        </motion.div>
      ) : showArchive ? (
        /* Archived notes list */
        <div className="space-y-3">
          {archivedNotes.length === 0 ? (
            <div className="text-center py-16">
              <Archive size={32} className="mx-auto text-[var(--foreground-muted)] mb-4" />
              <p className="text-[var(--foreground-muted)]">{t('emptyArchive')}</p>
            </div>
          ) : (
            archivedNotes.map(note => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] opacity-60"
              >
                <p className="font-bold mb-2">{formatNoteDate(note.original_date)}</p>
                <div className="text-sm text-[var(--foreground-muted)] space-y-1">
                  {note.content.se?.length > 0 && (
                    <p>Se: {note.content.se.map(i => i.text).join(' • ')}</p>
                  )}
                  {note.content.cosa?.length > 0 && (
                    <p>Cosa: {note.content.cosa.map(i => i.text).join(' • ')}</p>
                  )}
                  {note.content.chi?.length > 0 && (
                    <p>Chi: {note.content.chi.map(i => i.text).join(' • ')}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Notes list */
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--foreground-muted)]">{t('empty')}</p>
              <p className="text-sm text-[var(--foreground-muted)] mt-2">{t('tapPlus')}</p>
            </div>
          ) : (
            notes.map(note => {
              const expiring = isExpiring(note.date) && !isToday(note.date);
              const today = isToday(note.date);
              
              return (
                <motion.button
                  key={note.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleOpenNote(note)}
                  className={`w-full p-4 rounded-xl bg-[var(--card-bg)] border text-left ${
                    today 
                      ? 'border-[var(--accent-primary)]' 
                      : expiring 
                        ? 'border-amber-500/50' 
                        : 'border-[var(--card-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">{formatNoteDate(note.date)}</p>
                    {expiring && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                        (ex)
                      </span>
                    )}
                    {today && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                        {t('today')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    {countItems(note)} {t('items')}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
