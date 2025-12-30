"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Grid, List, ChevronLeft, MoreVertical, Trash2, Edit2, X } from "lucide-react";
import type { Collection, NunqLink, NewCollection, ViewMode, SortOrder } from "@/types";
import { 
  getUserCollections, 
  createCollection, 
  deleteCollection, 
  getCollectionItems,
  addToCollection 
} from "@/lib/supabase";

// Color options for collections
const COLORS = [
  "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", 
  "#10B981", "#06B6D4", "#3B82F6", "#6366F1"
];

// Popular emojis for collections
const EMOJIS = [
  "📚", "🎬", "🍝", "💪", "🎨", "🎵", "💡", "✨",
  "🛒", "📸", "🎮", "✈️", "💻", "📱", "🏠", "❤️"
];

interface CollectionsPageProps {
  userId: string;
  onSelectItem: (link: NunqLink) => void;
}

export function CollectionsPage({ userId, onSelectItem }: CollectionsPageProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionItems, setCollectionItems] = useState<NunqLink[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Load collections
  useEffect(() => {
    loadCollections();
  }, [userId]);

  // Load collection items when selected
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionItems();
    }
  }, [selectedCollection, sortOrder]);

  const loadCollections = async () => {
    setIsLoading(true);
    const data = await getUserCollections(userId);
    setCollections(data);
    setIsLoading(false);
  };

  const loadCollectionItems = async () => {
    if (!selectedCollection) return;
    const items = await getCollectionItems(selectedCollection.id, sortOrder);
    setCollectionItems(items);
  };

  const handleCreateCollection = async (newCol: NewCollection) => {
    const created = await createCollection(userId, newCol);
    if (created) {
      setCollections(prev => [created, ...prev]);
      setShowNewModal(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (confirm("Eliminare questa raccolta? I contenuti non verranno eliminati.")) {
      const success = await deleteCollection(id);
      if (success) {
        setCollections(prev => prev.filter(c => c.id !== id));
        if (selectedCollection?.id === id) {
          setSelectedCollection(null);
        }
      }
    }
  };

  const handleRandomPick = () => {
    if (collectionItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * collectionItems.length);
      onSelectItem(collectionItems[randomIndex]);
    }
  };

  // Collection Grid View
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">📚 Raccolte</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]"
            >
              {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 gap-4" 
            : "space-y-3"
          }>
            {/* New Collection Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewModal(true)}
              className={`${viewMode === "grid" 
                ? "aspect-square flex flex-col items-center justify-center gap-2" 
                : "flex items-center gap-3 p-4"
              } rounded-2xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent-purple)] transition-colors`}
            >
              <Plus size={24} className="text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">Nuova</span>
            </motion.button>

            {/* Collections */}
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                viewMode={viewMode}
                index={index}
                onClick={() => setSelectedCollection(collection)}
                onDelete={() => handleDeleteCollection(collection.id)}
              />
            ))}
          </div>
        )}

        {collections.length === 0 && !isLoading && (
          <div className="text-center py-8 text-[var(--foreground-muted)]">
            <p className="text-4xl mb-2">📁</p>
            <p>Nessuna raccolta ancora</p>
            <p className="text-sm">Crea la tua prima raccolta!</p>
          </div>
        )}

        {/* New Collection Modal */}
        <NewCollectionModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateCollection}
        />
      </div>
    );
  }

  // Collection Detail View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedCollection(null)}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft size={20} />
          <span className="text-2xl">{selectedCollection.emoji}</span>
          <span className="font-bold">{selectedCollection.name}</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]"
          >
            {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}
          </button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'newest', label: 'Recenti' },
          { value: 'oldest', label: 'Meno recenti' },
          { value: 'alpha', label: 'A-Z' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortOrder(option.value as SortOrder)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortOrder === option.value
                ? "bg-[var(--accent-purple)] text-white"
                : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
            }`}
          >
            {option.label}
          </button>
        ))}
        
        <button
          onClick={handleRandomPick}
          disabled={collectionItems.length === 0}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--card-bg)] text-[var(--foreground-muted)] hover:text-[var(--accent-purple)] disabled:opacity-50"
        >
          🎲 Random
        </button>
      </div>

      {/* Items */}
      {collectionItems.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          <p className="text-4xl mb-2">📭</p>
          <p>Nessun contenuto in questa raccolta</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {collectionItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectItem(item)}
              className="aspect-square rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-purple)] transition-colors relative group"
            >
              {/* Thumbnail */}
              {item.thumbnail_type === "emoji" ? (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[var(--accent-purple)]/10 to-[var(--accent-pink)]/10">
                  {item.custom_thumbnail || "📎"}
                </div>
              ) : (item.custom_thumbnail || item.thumbnail) ? (
                <img 
                  src={item.custom_thumbnail || item.thumbnail!} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-purple)]/10 to-[var(--accent-pink)]/10">
                  <span className="text-2xl">🔗</span>
                </div>
              )}
              
              {/* Title overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {collectionItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectItem(item)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-purple)] transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--background-secondary)] flex-shrink-0">
                {item.thumbnail_type === "emoji" ? (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {item.custom_thumbnail || "📎"}
                  </div>
                ) : (item.custom_thumbnail || item.thumbnail) ? (
                  <img 
                    src={item.custom_thumbnail || item.thumbnail!} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg">🔗</span>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-[var(--foreground-muted)] line-clamp-1">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-[var(--foreground-muted)]">
        {collectionItems.length} elementi
      </p>
    </div>
  );
}

// Collection Card Component
function CollectionCard({ 
  collection, 
  viewMode, 
  index, 
  onClick, 
  onDelete 
}: { 
  collection: Collection; 
  viewMode: ViewMode; 
  index: number; 
  onClick: () => void; 
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  if (viewMode === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
        style={{ backgroundColor: `${collection.color}20` }}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl mb-2">{collection.emoji}</span>
          <span className="font-semibold text-sm">{collection.name}</span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {collection.item_count || 0}
          </span>
        </div>
        
        {/* Menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical size={14} className="text-white" />
        </button>
        
        {/* Dropdown menu */}
        {showMenu && (
          <div 
            className="absolute top-8 right-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-10 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full"
            >
              <Trash2 size={14} />
              Elimina
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-purple)] transition-colors"
      onClick={onClick}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${collection.color}20` }}
      >
        {collection.emoji}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{collection.name}</p>
        <p className="text-sm text-[var(--foreground-muted)]">{collection.item_count || 0} elementi</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

// New Collection Modal
function NewCollectionModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (collection: NewCollection) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate({ name: name.trim(), emoji, color });
      setName("");
      setEmoji("📚");
      setColor(COLORS[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Nuova Raccolta</h3>
              <button onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Preview */}
            <div 
              className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: `${color}20` }}
            >
              <span className="text-5xl">{emoji}</span>
            </div>

            {/* Name input */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome raccolta..."
              className="w-full p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--card-border)] mb-4 outline-none focus:border-[var(--accent-purple)]"
              autoFocus
            />

            {/* Emoji picker */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Emoji</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                      emoji === e ? "bg-[var(--accent-purple)]/20 ring-2 ring-[var(--accent-purple)]" : "bg-[var(--background-secondary)]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Colore</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${
                      color === c ? "ring-2 ring-offset-2 ring-[var(--accent-purple)]" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Create button */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold disabled:opacity-50"
            >
              Crea Raccolta
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

