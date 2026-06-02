import { useRef, useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import {
  previewBookYaml,
  confirmBookYaml,
  importPreview,
  importCommit,
  type BookPreviewResponse,
  type BookResponse,
  type ImportPreviewResponse,
  type CharacterConflictDto,
  type CharacterResolutionDto,
} from '../api/books';

interface Props {
  pathId: string;
  moduleId: string;
  nextOrderIndex: number;
  existingBook?: BookResponse;
  onClose: () => void;
  onImported: (b: BookResponse) => void;
}

const fieldClass =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

// ── Create-mode: legacy /upload/preview → /upload/confirm ─────────────────────

function CreateImportFlow({
  pathId,
  moduleId,
  nextOrderIndex,
  onClose,
  onImported,
}: {
  pathId: string;
  moduleId: string;
  nextOrderIndex: number;
  onClose: () => void;
  onImported: (b: BookResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BookPreviewResponse | null>(null);
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError(null);
    setLoading(true);
    try {
      const result = await previewBookYaml(pathId, moduleId, f);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmBookYaml(pathId, moduleId, file, orderIndex, required);
      onImported(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer',
          file
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20'
            : 'border-[#E2DFFF] dark:border-[#2d2b47] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20',
        )}
      >
        {file ? (
          <>
            <FileText className="w-6 h-6 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-300">{file.name}</span>
            <span className="text-xs text-violet-400">Click to replace</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-violet-300 dark:text-violet-600" />
            <span className="text-sm text-violet-400 dark:text-violet-500">Click to select a YAML file</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept=".yaml,.yml" className="hidden" onChange={handleFileChange} />

      {loading && <p className="text-xs text-violet-400 dark:text-violet-500 mt-4 text-center">Parsing YAML…</p>}

      {preview && (
        <div className="mt-4 rounded-xl bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] p-4 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">YAML parsed successfully</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1A1839] dark:text-white">{preview.title}</p>
            {preview.author && <p className="text-xs text-violet-500 dark:text-violet-400">by {preview.author}</p>}
            {preview.description && <p className="text-xs text-violet-400 dark:text-violet-500 line-clamp-2">{preview.description}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {preview.language && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">{preview.language}</span>}
            {preview.level && <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">{preview.level}</span>}
            {preview.sceneCount != null && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{preview.sceneCount} scenes</span>}
            {preview.nodeCount != null && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">{preview.nodeCount} nodes</span>}
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Order</label>
            <input type="number" min={0} value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} className={fieldClass} />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1A1839] dark:text-violet-200">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              Required
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <div className="flex gap-3 mt-5">
        <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">Cancel</button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!preview || confirming}
          className={clsx('lumio-btn-primary flex-1 text-sm py-2.5', (!preview || confirming) && 'opacity-60')}
        >
          {confirming ? 'Importing…' : 'Import book'}
        </button>
      </div>
    </>
  );
}

// ── Re-import mode: /{id}/import/preview → conflict resolution → /{id}/import/commit ─

type ConflictResolution = 'KEEP_EXISTING' | 'USE_INCOMING';

function ConflictCard({
  conflict,
  resolution,
  onChange,
}: {
  conflict: CharacterConflictDto;
  resolution: ConflictResolution;
  onChange: (r: ConflictResolution) => void;
}) {
  const isConflict = conflict.status === 'CONFLICT';

  return (
    <div className={clsx(
      'rounded-xl border p-3 space-y-2',
      isConflict
        ? 'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/20'
        : 'border-[#E2DFFF] dark:border-[#2d2b47] bg-[#F5F3FF] dark:bg-[#0f0e1a]',
    )}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-[#1A1839] dark:text-white">{conflict.incoming.name}</span>
          <span className="ml-2 font-mono text-xs text-violet-400 dark:text-violet-500">{conflict.incoming.slug}</span>
        </div>
        <span className={clsx(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          conflict.status === 'NEW' && 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
          conflict.status === 'IDENTICAL' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
          conflict.status === 'CONFLICT' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
        )}>
          {conflict.status === 'NEW' ? 'New' : conflict.status === 'IDENTICAL' ? 'Identical' : 'Conflict'}
        </span>
      </div>

      {isConflict && conflict.diff && (
        <div className="space-y-1.5">
          {Object.entries(conflict.diff).map(([field, { existing: ex, incoming: inc }]) => (
            <div key={field} className="text-xs space-y-0.5">
              <p className="font-medium text-amber-700 dark:text-amber-400 capitalize">{field}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={clsx('rounded-lg px-2 py-1', resolution === 'KEEP_EXISTING' ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-400' : 'bg-white dark:bg-[#1a1833]')}>
                  <p className="text-violet-400 dark:text-violet-600 text-[10px] mb-0.5">Existing</p>
                  <p className="text-[#1A1839] dark:text-violet-200 line-clamp-2">{ex ?? '—'}</p>
                </div>
                <div className={clsx('rounded-lg px-2 py-1', resolution === 'USE_INCOMING' ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-400' : 'bg-white dark:bg-[#1a1833]')}>
                  <p className="text-violet-400 dark:text-violet-600 text-[10px] mb-0.5">Incoming</p>
                  <p className="text-[#1A1839] dark:text-violet-200 line-clamp-2">{inc ?? '—'}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onChange('KEEP_EXISTING')}
              className={clsx(
                'flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer',
                resolution === 'KEEP_EXISTING'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-[#E2DFFF] dark:border-[#2d2b47] text-violet-500 dark:text-violet-400 hover:border-violet-400',
              )}
            >
              Keep existing
            </button>
            <button
              type="button"
              onClick={() => onChange('USE_INCOMING')}
              className={clsx(
                'flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer',
                resolution === 'USE_INCOMING'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-[#E2DFFF] dark:border-[#2d2b47] text-violet-500 dark:text-violet-400 hover:border-violet-400',
              )}
            >
              Use incoming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReimportFlow({
  pathId,
  moduleId,
  existingBook,
  onClose,
  onImported,
}: {
  pathId: string;
  moduleId: string;
  existingBook: BookResponse;
  onClose: () => void;
  onImported: (b: BookResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResponse | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewResult(null);
    setError(null);
    setLoading(true);
    try {
      const content = await f.text();
      setFileContent(content);
      const result = await importPreview(pathId, moduleId, existingBook.id, f);
      const defaultResolutions: Record<string, ConflictResolution> = {};
      for (const c of result.characterConflicts) {
        if (c.status === 'CONFLICT' && c.characterId) {
          defaultResolutions[c.characterId] = 'KEEP_EXISTING';
        }
      }
      setResolutions(defaultResolutions);
      setPreviewResult(result);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!fileContent || !previewResult) return;
    const unresolvedConflicts = previewResult.characterConflicts
      .filter((c) => c.status === 'CONFLICT' && c.characterId && !resolutions[c.characterId]);
    if (unresolvedConflicts.length > 0) {
      setError('Please resolve all character conflicts before committing.');
      return;
    }
    setCommitting(true);
    setError(null);
    try {
      const characterResolutions: CharacterResolutionDto[] = Object.entries(resolutions).map(([characterId, resolution]) => ({
        characterId,
        resolution,
      }));
      const result = await importCommit(pathId, moduleId, existingBook.id, {
        yaml: fileContent,
        characterResolutions,
      });
      onImported(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commit failed');
    } finally {
      setCommitting(false);
    }
  }

  const conflicts = previewResult?.characterConflicts.filter((c) => c.status === 'CONFLICT') ?? [];
  const newChars = previewResult?.characterConflicts.filter((c) => c.status === 'NEW') ?? [];
  const identicalChars = previewResult?.characterConflicts.filter((c) => c.status === 'IDENTICAL') ?? [];

  if (step === 'select') {
    return (
      <>
        <div className="mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/60">
          <p className="text-xs text-violet-600 dark:text-violet-300">
            Re-importing YAML into <span className="font-semibold">{existingBook.title}</span>. Existing content will be replaced.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer',
            file
              ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20'
              : 'border-[#E2DFFF] dark:border-[#2d2b47] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20',
          )}
        >
          {file ? (
            <>
              <FileText className="w-6 h-6 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-300">{file.name}</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-violet-300 dark:text-violet-600" />
              <span className="text-sm text-violet-400 dark:text-violet-500">Click to select a YAML file</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept=".yaml,.yml" className="hidden" onChange={handleFileChange} />

        {loading && <p className="text-xs text-violet-400 dark:text-violet-500 mt-4 text-center">Analysing YAML…</p>}
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">Cancel</button>
        </div>
      </>
    );
  }

  // Review step
  return (
    <>
      {/* Summary */}
      <div className="space-y-2 mb-4">
        {previewResult!.structuralErrors.length > 0 && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 p-3 space-y-1">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Structural errors (import blocked)</p>
            {previewResult!.structuralErrors.map((e, i) => (
              <p key={i} className="text-xs text-red-500 flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{e}
              </p>
            ))}
          </div>
        )}
        {previewResult!.warnings.length > 0 && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 p-3 space-y-1">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Warnings</p>
            {previewResult!.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{w}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            {previewResult!.scenesCount} scenes
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            {previewResult!.nodesCount} nodes
          </span>
          {newChars.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              {newChars.length} new character{newChars.length > 1 ? 's' : ''}
            </span>
          )}
          {conflicts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </span>
          )}
          {identicalChars.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {identicalChars.length} unchanged
            </span>
          )}
        </div>
      </div>

      {/* Conflicts & new characters */}
      {previewResult!.characterConflicts.length > 0 && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">Characters</p>
          {previewResult!.characterConflicts.map((c, i) => (
            <ConflictCard
              key={i}
              conflict={c}
              resolution={c.characterId ? (resolutions[c.characterId] ?? 'KEEP_EXISTING') : 'USE_INCOMING'}
              onChange={(r) => {
                if (c.characterId) setResolutions((prev) => ({ ...prev, [c.characterId!]: r }));
              }}
            />
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={() => setStep('select')} className="lumio-btn-ghost text-sm py-2.5 px-4">
          Back
        </button>
        <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">Cancel</button>
        <button
          type="button"
          onClick={handleCommit}
          disabled={committing || previewResult!.structuralErrors.length > 0}
          className={clsx(
            'lumio-btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-1.5',
            (committing || previewResult!.structuralErrors.length > 0) && 'opacity-60',
          )}
        >
          {committing ? 'Importing…' : (
            <>Commit <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>
    </>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function BookImportModal({ pathId, moduleId, nextOrderIndex, existingBook, onClose, onImported }: Props) {
  const title = existingBook ? 'Re-import YAML' : 'Import Book from YAML';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative lumio-card p-6 w-full max-w-lg mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1A1839] dark:text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {existingBook ? (
          <ReimportFlow
            pathId={pathId}
            moduleId={moduleId}
            existingBook={existingBook}
            onClose={onClose}
            onImported={onImported}
          />
        ) : (
          <CreateImportFlow
            pathId={pathId}
            moduleId={moduleId}
            nextOrderIndex={nextOrderIndex}
            onClose={onClose}
            onImported={onImported}
          />
        )}
      </div>
    </div>
  );
}
