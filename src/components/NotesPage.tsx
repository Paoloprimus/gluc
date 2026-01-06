"use client";

import { useState, useEffect, useCallback } from "react";
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
  archiveSingleNote,
  getArchivedNotes
} from "@/lib/supabase";
import type { DailyNote, ArchivedNote } from "@/types";

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
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [expiringAction, setExpiringAction] = useState<{ noteId: string } | null>(null);

  // Load notes function
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserNotes(userId);
      const normalizedNotes = data
        .map(note => ({
          ...note,
          items: Array.isArray(note.items) ? note.items : [],
        }))
        // Filter out empty notes (except today's note which can be empty while editing)
        .filter(note => note.items.length > 0 || isToday(note.date));
      setNotes(normalizedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
    setLoading(false);
  }, [userId]);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const loadArchivedNotes = async () => {
    const data = await getArchivedNotes(userId);
    setArchivedNotes(data);
  };

  // Create today's note if it doesn't exist
  const handleNewNote = async () => {
    setSaving(true);
    try {
      const todayNote = await getOrCreateTodayNote(userId);
      if (todayNote) {
        await loadNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
    setSaving(false);
  };

  // Check if today's note exists
  const hasTodayNote = notes.some(n => isToday(n.date));

  // Add item to a specific note
  const handleAddItem = async (noteId: string) => {
    const text = newItemText[noteId];
    if (!text?.trim()) return;
    
    setSaving(true);
    try {
      const newItem = await addNoteItem(noteId, text.trim());
      
      if (newItem) {
        setNotes(notes.map(n => 
          n.id === noteId 
            ? { ...n, items: [...n.items, newItem] }
            : n
        ));
        setNewItemText({ ...newItemText, [noteId]: '' });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
    setSaving(false);
  };

  // Remove item
  const handleRemoveItem = async (noteId: string, itemId: string) => {
    try {
      const success = await removeNoteItem(noteId, itemId);
      
      if (success) {
        const note = notes.find(n => n.id === noteId);
        const remainingItems = note?.items.filter(item => item.id !== itemId) || [];
        
        // If this was the last item and it's not today's note, remove the note entirely
        if (remainingItems.length === 0 && note && !isToday(note.date)) {
          await archiveSingleNote(noteId, userId);
          setNotes(notes.filter(n => n.id !== noteId));
        } else {
          setNotes(notes.map(n => 
            n.id === noteId 
              ? { ...n, items: remainingItems }
              : n
          ));
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Handle expiring note action
  const handleExpiringNote = async (note: DailyNote, action: 'edit' | 'archive') => {
    if (action === 'archive') {
      // Archive this specific note
      await archiveSingleNote(note.id, userId);
      await loadNotes();
    } else {
      const todayNote = notes.find(n => isToday(n.date));
      
      if (todayNote) {
        const mergedItems = [
          ...todayNote.items,
          ...note.items.map(item => ({
            ...item,
            source_date: note.date,
            edited_at: new Date().toISOString(),
          })),
        ];
        
        await updateNote(todayNote.id, { items: mergedItems });
        await archiveOldNotes(userId);
        await loadNotes();
      } else {
        await updateNote(note.id, { date: getTodayString() });
        await loadNotes();
      }
    }
    setExpiringAction(null);
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
              {t('back')}
            </button>
          )}
        </div>
        
        {!showArchive && !hasTodayNote && (
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

      {showArchive ? (
        /* Archived notes */
        <div className="space-y-6">
          {archivedNotes.length === 0 ? (
            <div className="text-center py-16">
              <Archive size={32} className="mx-auto text-[var(--foreground-muted)] mb-4" />
              <p className="text-[var(--foreground-muted)]">{t('emptyArchive')}</p>
            </div>
          ) : (
            archivedNotes.map(note => (
              <div key={note.id} className="opacity-60">
                <p className="font-bold text-lg mb-2">{formatNoteDate(note.original_date)}</p>
                <div className="space-y-1 pl-2">
                  {note.items?.map((item, i) => (
                    <p key={i} className="text-sm text-[var(--foreground-muted)] break-words whitespace-pre-wrap">
                      • {item.text}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* All notes expanded */
        <div className="space-y-8">
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
                <div key={note.id} className="space-y-2">
                  {/* Date header */}
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{formatNoteDate(note.date)}</p>
                    {expiring && (
                      <button
                        onClick={() => setExpiringAction({ noteId: note.id })}
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                      >
                        (ex)
                      </button>
                    )}
                    {today && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                        {t('today')}
                      </span>
                    )}
                  </div>
                  
                  {/* Items */}
                  <div className="space-y-1 pl-2">
                    {note.items.map(item => (
                      <div key={item.id} className="flex items-start gap-2 group">
                        <span className={`flex-shrink-0 ${item.source_date ? "text-amber-500" : "text-[var(--foreground-muted)]"}`}>•</span>
                        <p className={`flex-1 text-sm break-words whitespace-pre-wrap ${item.source_date ? "text-amber-500/80" : ""}`}>
                          {item.text}
                        </p>
                        {/* Only show remove button for today's note */}
                        {today && (
                          <button
                            onClick={() => handleRemoveItem(note.id, item.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add new item input - only for today's note */}
                    {today && (
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 text-[var(--foreground-muted)]">•</span>
                        <textarea
                          value={newItemText[note.id] || ''}
                          onChange={(e) => setNewItemText({ ...newItemText, [note.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddItem(note.id);
                            }
                          }}
                          placeholder="..."
                          rows={1}
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]/50 resize-none overflow-hidden break-words"
                          style={{ minHeight: '1.5em' }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
