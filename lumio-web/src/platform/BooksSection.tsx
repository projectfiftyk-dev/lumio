import { useEffect, useState } from 'react';
import { Plus, Upload, Pencil, Trash2, Eye, EyeOff, BookOpen, Loader, Clock, Globe, Lock, Wand2 } from 'lucide-react';
import clsx from 'clsx';
import {
  getBooks,
  deleteBook,
  patchBookStatus,
  type BookResponse,
} from '../api/books';
import BookModal from './BookModal';
import BookImportModal from './BookImportModal';
import ScriptEditorModal from './ScriptEditorModal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  moduleId: string;
  isEditMode: boolean;
}

function BookCard({
  book,
  isEditMode,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  book: BookResponse;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="lumio-card overflow-hidden w-full max-w-sm">
      {book.coverImageUrl && (
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-40 object-cover"
        />
      )}

      <div className="p-4 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-[#1A1839] dark:text-white text-sm leading-snug flex-1">{book.title}</h4>
          {book.required && (
            <Lock className="w-3.5 h-3.5 text-violet-400 dark:text-violet-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {book.author && (
          <p className="text-xs text-violet-500 dark:text-violet-400">by {book.author}</p>
        )}

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          {book.language && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <Globe className="w-2.5 h-2.5" />
              {book.language}
            </span>
          )}
          {book.level && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              {book.level}
            </span>
          )}
          {book.durationMinutes != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Clock className="w-2.5 h-2.5" />
              {book.durationMinutes} min
            </span>
          )}
        </div>

        {book.description && (
          <p className="text-xs text-violet-400 dark:text-violet-500 line-clamp-2">{book.description}</p>
        )}

        {/* Edit mode actions */}
        {isEditMode && (
          <div className="flex items-center justify-between pt-1 border-t border-[#E2DFFF] dark:border-[#2d2b47]">
            <span
              className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                book.status === 'published'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
              )}
            >
              {book.status}
            </span>
            <div className="flex gap-0.5">
              <button
                title={book.status === 'published' ? 'Set to Draft' : 'Publish'}
                onClick={onToggleStatus}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
              >
                {book.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BooksSection({ moduleId, isEditMode }: Props) {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<BookResponse | null>(null);
  const [deleting, setDeleting] = useState<BookResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    load();
  }, [moduleId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await getBooks(moduleId);
      setBooks(all.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }

  const visible = isEditMode ? books : books.filter((b) => b.status === 'published');

  function handleSaved(b: BookResponse) {
    setBooks((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = b;
        return next.sort((a, b) => a.orderIndex - b.orderIndex);
      }
      return [...prev, b].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    setShowCreate(false);
    setShowImport(false);
    setShowEditor(false);
    setEditing(null);
  }

  async function toggleStatus(book: BookResponse) {
    const next = book.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await patchBookStatus(moduleId, book.id, next);
      setBooks((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)).sort((a, b) => a.orderIndex - b.orderIndex),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Status update failed');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteBook(moduleId, deleting.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  const nextOrderIndex = books.length > 0 ? Math.max(...books.map((b) => b.orderIndex)) + 1 : 0;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {loading && <Loader className="w-5 h-5 text-violet-400 animate-spin" />}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4">
          <BookOpen className="w-8 h-8 text-violet-200 dark:text-violet-800" />
          <p className="text-xs text-violet-300 dark:text-violet-700">
            {isEditMode ? 'No books yet. Add or import one.' : 'No published books yet.'}
          </p>
        </div>
      )}

      {!loading &&
        visible.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            isEditMode={isEditMode}
            onEdit={() => setEditing(book)}
            onDelete={() => setDeleting(book)}
            onToggleStatus={() => toggleStatus(book)}
          />
        ))}

      {isEditMode && (
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Book
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import YAML
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Write Script
          </button>
        </div>
      )}

      {showCreate && (
        <BookModal
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
      {showImport && (
        <BookImportModal
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowImport(false)}
          onImported={handleSaved}
        />
      )}
      {editing && (
        <BookModal
          moduleId={moduleId}
          existing={editing}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {showEditor && (
        <ScriptEditorModal
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowEditor(false)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete book"
          message={`"${deleting.title}" will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
