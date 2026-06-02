import { useEffect, useState } from 'react';
import { X, Plus, Trash2, ChevronRight, MessageSquare, ListChecks, PenLine, AlertCircle, Loader, Users, Merge, Ungroup } from 'lucide-react';
import clsx from 'clsx';
import * as yaml from 'js-yaml';
import { confirmBookYaml, uploadBookYaml, type BookResponse } from '../api/books';
import { getCharacters, createCharacter, type CharacterResponse } from '../api/characters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DialogueNode {
  id: string;
  type: 'dialogue';
  character: string;
  text: string;
  next: string;
}

interface ChoiceOption {
  label: string;
  next: string;
}

interface ChoiceNode {
  id: string;
  type: 'choice';
  prompt: string;
  options: ChoiceOption[];
}

interface FreeTextNode {
  id: string;
  type: 'free_text';
  prompt: string;
  goal: string;
  on_success: string;
}

type ScriptNode = DialogueNode | ChoiceNode | FreeTextNode;

interface Scene {
  id: string;
  start: boolean;
  nodes: ScriptNode[];
}

interface Metadata {
  title: string;
  author: string;
  language: string;
  description: string;
}

interface Props {
  pathId: string;
  moduleId: string;
  nextOrderIndex: number;
  existing?: BookResponse;
  onClose: () => void;
  onSaved: (b: BookResponse) => void;
}

// Pending character queued locally, flushed on save
export interface PendingChar {
  slug: string;
  name: string;
  description: string;
  personality: string;
}

// ─── YAML serializer ──────────────────────────────────────────────────────────

function escapeYaml(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function serializeToYaml(metadata: Metadata, scenes: Scene[]): string {
  const lines: string[] = [];
  lines.push('metadata:');
  lines.push(`  title: "${escapeYaml(metadata.title)}"`);
  if (metadata.author) lines.push(`  author: "${escapeYaml(metadata.author)}"`);
  if (metadata.language) lines.push(`  language: ${metadata.language}`);
  if (metadata.description) lines.push(`  description: "${escapeYaml(metadata.description)}"`);
  lines.push('');
  lines.push('scenes:');
  for (const scene of scenes) {
    lines.push(`  - id: ${scene.id}`);
    lines.push(`    start: ${scene.start}`);
    if (scene.nodes.length > 0) {
      lines.push('    nodes:');
      for (const node of scene.nodes) {
        lines.push(`      - id: ${node.id}`);
        lines.push(`        type: ${node.type}`);
        if (node.type === 'dialogue') {
          if (node.character) lines.push(`        character: ${node.character}`);
          lines.push(`        text: "${escapeYaml(node.text)}"`);
          if (node.next) lines.push(`        next: ${node.next}`);
        } else if (node.type === 'choice') {
          if (node.prompt) lines.push(`        prompt: "${escapeYaml(node.prompt)}"`);
          if (node.options.length > 0) {
            lines.push('        options:');
            for (const opt of node.options) {
              lines.push(`          - label: "${escapeYaml(opt.label)}"`);
              if (opt.next) lines.push(`            next: ${opt.next}`);
            }
          }
        } else if (node.type === 'free_text') {
          if (node.prompt) lines.push(`        prompt: "${escapeYaml(node.prompt)}"`);
          if (node.goal) lines.push(`        goal: "${escapeYaml(node.goal)}"`);
          if (node.on_success) lines.push(`        on_success: ${node.on_success}`);
        }
      }
    }
  }
  return lines.join('\n');
}

// ─── YAML parser ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYamlToState(content: string): { metadata: Metadata; scenes: Scene[] } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = yaml.load(content) as any;
    if (!doc) return null;

    const meta = doc.metadata ?? {};
    const metadata: Metadata = {
      title: String(meta.title ?? ''),
      author: String(meta.author ?? ''),
      language: String(meta.language ?? ''),
      description: String(meta.description ?? ''),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawScenes: any[] = Array.isArray(doc.scenes) ? doc.scenes : [];
    const scenes: Scene[] = rawScenes.map((s) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawNodes: any[] = Array.isArray(s.nodes) ? s.nodes : [];
      const nodes: ScriptNode[] = rawNodes
        .map((n): ScriptNode | null => {
          const id = String(n.id ?? uid('n'));
          if (n.type === 'dialogue') {
            return { id, type: 'dialogue', character: String(n.character ?? ''), text: String(n.text ?? ''), next: String(n.next ?? '') };
          } else if (n.type === 'choice') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const options = Array.isArray(n.options) ? n.options.map((o: any) => ({ label: String(o.label ?? ''), next: String(o.next ?? '') })) : [];
            return { id, type: 'choice', prompt: String(n.prompt ?? ''), options };
          } else if (n.type === 'free_text') {
            return { id, type: 'free_text', prompt: String(n.prompt ?? ''), goal: String(n.goal ?? ''), on_success: String(n.on_success ?? '') };
          }
          return null;
        })
        .filter((n): n is ScriptNode => n !== null);

      return {
        id: String(s.id ?? uid('scene')),
        start: Boolean(s.start),
        nodes,
      };
    });

    if (scenes.length === 0) scenes.push(newScene(true));
    if (!scenes.some((s) => s.start)) scenes[0] = { ...scenes[0], start: true };

    return { metadata, scenes };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 0;
function uid(prefix: string) {
  return `${prefix}_${++_counter}`;
}

function newDialogue(): DialogueNode {
  return { id: uid('n'), type: 'dialogue', character: 'narrator', text: '', next: '' };
}
function newChoice(): ChoiceNode {
  return { id: uid('n'), type: 'choice', prompt: '', options: [{ label: '', next: '' }] };
}
function newFreeText(): FreeTextNode {
  return { id: uid('n'), type: 'free_text', prompt: '', goal: '', on_success: '' };
}
function newScene(isFirst = false): Scene {
  return { id: uid('scene'), start: isFirst, nodes: [] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const fieldClass =
  'w-full rounded-lg px-3 py-2 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 transition-colors';

const NODE_ICONS: Record<string, React.ReactNode> = {
  dialogue: <MessageSquare className="w-3.5 h-3.5" />,
  choice: <ListChecks className="w-3.5 h-3.5" />,
  free_text: <PenLine className="w-3.5 h-3.5" />,
};

const SLUG_RE_GLOBAL = /^[a-z0-9_]+$/;

// nodeBreaks: Record<nodeId, false> means "merge with previous node (same row)"
// default (no entry / true) means "start a new row"
function groupNodesByRow(nodes: ScriptNode[], breaks: Record<string, boolean>): ScriptNode[][] {
  const rows: ScriptNode[][] = [];
  let current: ScriptNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (i === 0 || breaks[node.id] !== false) {
      if (current.length) rows.push(current);
      current = [node];
    } else {
      current.push(node);
    }
  }
  if (current.length) rows.push(current);
  return rows;
}

function nodePreview(node: ScriptNode): string {
  if (node.type === 'dialogue') return node.text ? node.text.slice(0, 40) : '(empty)';
  if (node.type === 'choice') return node.prompt ? node.prompt.slice(0, 40) : '(choice)';
  if (node.type === 'free_text') return node.prompt ? node.prompt.slice(0, 40) : '(free text)';
  return node.id;
}

function NextNodeSelect({
  value,
  onChange,
  allScenes,
  currentNodeId,
  onHoverTarget,
}: {
  value: string;
  onChange: (v: string) => void;
  allScenes: Scene[];
  currentNodeId: string;
  onHoverTarget: (id: string | null) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseEnter={() => value && onHoverTarget(value)}
      onMouseLeave={() => onHoverTarget(null)}
      onFocus={() => value && onHoverTarget(value)}
      onBlur={() => onHoverTarget(null)}
      className={`${fieldClass} cursor-pointer text-xs`}
      title="Next node"
    >
      <option value="">(end / no next)</option>
      {allScenes.map((scene) => {
        const others = scene.nodes.filter((n) => n.id !== currentNodeId);
        if (!others.length) return null;
        return (
          <optgroup key={scene.id} label={`Scene: ${scene.id}${scene.start ? ' (start)' : ''}`}>
            {others.map((n) => (
              <option key={n.id} value={n.id}>
                [{n.type}] {n.id} — {nodePreview(n)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

function CharacterSelect({
  value,
  onChange,
  characters,
  pendingChars,
  onAddPendingChar,
}: {
  value: string;
  onChange: (slug: string) => void;
  characters: CharacterResponse[];
  pendingChars: PendingChar[];
  onAddPendingChar: (pc: PendingChar) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPersonality, setNewPersonality] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const knownSlugs = new Set([
    'narrator',
    ...characters.map((c) => c.slug),
    ...pendingChars.map((c) => c.slug),
  ]);

  // If value exists but isn't in any known list, add it as a freeform option
  const isUnknown = value && !knownSlugs.has(value);

  function handleSelectChange(v: string) {
    if (v === '__add_new__') {
      setCreating(true);
    } else {
      onChange(v);
    }
  }

  function confirmCreate() {
    const slug = newSlug.trim();
    const name = newName.trim();
    if (!name || !slug) { setCreateError('Name and slug are required'); return; }
    if (!SLUG_RE_GLOBAL.test(slug)) { setCreateError('Slug: only lowercase letters, numbers, underscores'); return; }
    const conflict = characters.find((c) => c.slug === slug) || pendingChars.find((c) => c.slug === slug);
    if (conflict) { setCreateError(`Slug "${slug}" already exists`); return; }
    onAddPendingChar({ slug, name, description: newDesc.trim(), personality: newPersonality.trim() });
    onChange(slug);
    setCreating(false);
    setNewName(''); setNewSlug(''); setNewDesc(''); setNewPersonality(''); setCreateError(null);
  }

  function cancelCreate() {
    setCreating(false);
    setNewName(''); setNewSlug(''); setNewDesc(''); setNewPersonality(''); setCreateError(null);
  }

  if (creating) {
    return (
      <div className="rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 p-3 space-y-2">
        <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider">New character</p>
        <input
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')); }}
          placeholder="Name *"
          className={fieldClass}
          autoFocus
        />
        <input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="Slug *"
          className={`${fieldClass} font-mono`}
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description"
          className={fieldClass}
        />
        <textarea
          value={newPersonality}
          onChange={(e) => setNewPersonality(e.target.value)}
          placeholder="Personality"
          rows={2}
          className={`${fieldClass} resize-none`}
        />
        {createError && <p className="text-[10px] text-red-500">{createError}</p>}
        <div className="flex gap-1.5">
          <button type="button" onClick={cancelCreate} className="flex-1 text-xs py-1 rounded-lg border border-[#E2DFFF] dark:border-[#2d2b47] text-violet-400 hover:text-violet-600 transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={confirmCreate} className="flex-1 text-xs py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer">
            Create & select
          </button>
        </div>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => handleSelectChange(e.target.value)}
      className={`${fieldClass} cursor-pointer`}
    >
      <option value="narrator">narrator</option>
      {isUnknown && <option value={value}>{value} (unknown)</option>}
      {characters.map((c) => (
        <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
      ))}
      {pendingChars.map((c) => (
        <option key={c.slug} value={c.slug}>{c.name} ({c.slug}) — pending</option>
      ))}
      <option value="__add_new__">＋ Create new character…</option>
    </select>
  );
}

function NodeEditor({
  node,
  onChange,
  onDelete,
  characters,
  pendingChars,
  onAddPendingChar,
  allScenes,
  highlighted,
  onHoverTarget,
  canMerge,
  isMerged,
  onToggleMerge,
}: {
  node: ScriptNode;
  onChange: (n: ScriptNode) => void;
  onDelete: () => void;
  characters: CharacterResponse[];
  pendingChars: PendingChar[];
  onAddPendingChar: (pc: PendingChar) => void;
  allScenes: Scene[];
  highlighted: boolean;
  onHoverTarget: (id: string | null) => void;
  canMerge: boolean;
  isMerged: boolean;
  onToggleMerge: () => void;
}) {
  function changeType(type: ScriptNode['type']) {
    if (type === 'dialogue') onChange(newDialogue());
    else if (type === 'choice') onChange(newChoice());
    else onChange(newFreeText());
  }

  return (
    <div className={clsx('lumio-card p-4 space-y-3 transition-all duration-200', highlighted && 'ring-2 ring-violet-400 dark:ring-violet-500 ring-offset-1')}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-violet-400">{NODE_ICONS[node.type]}</span>
        <span className="text-xs font-mono text-violet-300 dark:text-violet-600 flex-1 truncate">{node.id}</span>
        <select
          value={node.type}
          onChange={(e) => changeType(e.target.value as ScriptNode['type'])}
          className="text-xs rounded-lg px-2 py-1 bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 focus:outline-none cursor-pointer"
        >
          <option value="dialogue">Dialogue</option>
          <option value="choice">Choice</option>
          <option value="free_text">Free text</option>
        </select>
        {canMerge && (
          <button
            type="button"
            title={isMerged ? 'Split to own row' : 'Merge onto previous row'}
            onClick={onToggleMerge}
            className={clsx(
              'p-1 rounded-lg transition-colors cursor-pointer',
              isMerged
                ? 'text-violet-500 bg-violet-100 dark:bg-violet-950/60 hover:text-violet-700'
                : 'text-violet-300 dark:text-violet-700 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/40',
            )}
          >
            {isMerged ? <Ungroup className="w-3.5 h-3.5" /> : <Merge className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-violet-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {node.type === 'dialogue' && (
        <div className="space-y-2">
          <CharacterSelect
            value={node.character}
            onChange={(slug) => onChange({ ...node, character: slug })}
            characters={characters}
            pendingChars={pendingChars}
            onAddPendingChar={onAddPendingChar}
          />
          <textarea
            value={node.text}
            onChange={(e) => onChange({ ...node, text: e.target.value })}
            placeholder="Dialogue text"
            rows={2}
            className={`${fieldClass} resize-none`}
          />
          <div>
            <p className="text-[10px] text-violet-400 dark:text-violet-600 mb-1">Next node</p>
            <NextNodeSelect
              value={node.next}
              onChange={(v) => onChange({ ...node, next: v })}
              allScenes={allScenes}
              currentNodeId={node.id}
              onHoverTarget={onHoverTarget}
            />
          </div>
        </div>
      )}

      {node.type === 'choice' && (
        <div className="space-y-2">
          <input
            value={node.prompt}
            onChange={(e) => onChange({ ...node, prompt: e.target.value })}
            placeholder="Prompt"
            className={fieldClass}
          />
          <div className="space-y-1.5">
            {node.options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={opt.label}
                  onChange={(e) => {
                    const opts = node.options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o));
                    onChange({ ...node, options: opts });
                  }}
                  placeholder="Option label"
                  className={clsx(fieldClass, 'flex-1')}
                />
                <div className="w-48 flex-shrink-0">
                  <NextNodeSelect
                    value={opt.next}
                    onChange={(v) => {
                      const opts = node.options.map((o, j) => (j === i ? { ...o, next: v } : o));
                      onChange({ ...node, options: opts });
                    }}
                    allScenes={allScenes}
                    currentNodeId={node.id}
                    onHoverTarget={onHoverTarget}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...node, options: node.options.filter((_, j) => j !== i) })}
                  className="p-1 text-violet-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ ...node, options: [...node.options, { label: '', next: '' }] })}
              className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add option
            </button>
          </div>
        </div>
      )}

      {node.type === 'free_text' && (
        <div className="space-y-2">
          <input
            value={node.prompt}
            onChange={(e) => onChange({ ...node, prompt: e.target.value })}
            placeholder="Prompt"
            className={fieldClass}
          />
          <input
            value={node.goal}
            onChange={(e) => onChange({ ...node, goal: e.target.value })}
            placeholder="Goal"
            className={fieldClass}
          />
          <div>
            <p className="text-[10px] text-violet-400 dark:text-violet-600 mb-1">On success → next node</p>
            <NextNodeSelect
              value={node.on_success}
              onChange={(v) => onChange({ ...node, on_success: v })}
              allScenes={allScenes}
              currentNodeId={node.id}
              onHoverTarget={onHoverTarget}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScriptEditorModal({ pathId, moduleId, nextOrderIndex, existing, onClose, onSaved }: Props) {
  const [loadingYaml, setLoadingYaml] = useState(!!existing?.yamlUrl);
  const [leftTab, setLeftTab] = useState<'scenes' | 'characters'>('scenes');
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [charsLoading, setCharsLoading] = useState(true);

  // Pending characters — queued locally, flushed on save
  const [pendingChars, setPendingChars] = useState<PendingChar[]>([]);
  const [showAddChar, setShowAddChar] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharSlug, setNewCharSlug] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharPersonality, setNewCharPersonality] = useState('');
  const [addCharError, setAddCharError] = useState<string | null>(null);

  const SLUG_RE = /^[a-z0-9_]+$/;
  const [loadError, setLoadError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<Metadata>({
    title: existing?.title ?? '',
    author: existing?.author ?? '',
    language: existing?.language ?? '',
    description: existing?.description ?? '',
  });
  const [scenes, setScenes] = useState<Scene[]>([newScene(true)]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  // Extra scenes shown alongside the active one (Ctrl+click to add/remove)
  const [extraSelectedIds, setExtraSelectedIds] = useState<Set<string>>(new Set());
  const [orderIndex, setOrderIndex] = useState(existing?.orderIndex ?? nextOrderIndex);
  const [required, setRequired] = useState(existing?.required ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  // nodeBreaks[nodeId] = false → merge with previous node (same row)
  const [nodeBreaks, setNodeBreaks] = useState<Record<string, boolean>>({});
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  function toggleMerge(nodeId: string) {
    setNodeBreaks((prev) => {
      const isMerged = prev[nodeId] === false;
      if (isMerged) {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      }
      return { ...prev, [nodeId]: false };
    });
  }

  // Load YAML from existing book on mount
  useEffect(() => {
    if (!existing?.yamlUrl) return;
    setLoadingYaml(true);
    fetch(existing.yamlUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch YAML: ${r.status}`);
        return r.text();
      })
      .then((content) => {
        const parsed = parseYamlToState(content);
        if (!parsed) throw new Error('Could not parse YAML structure');
        setMetadata(parsed.metadata);
        setScenes(parsed.scenes);
        setActiveSceneIdx(0);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Failed to load YAML');
      })
      .finally(() => setLoadingYaml(false));
  }, []);

  // Load path characters
  useEffect(() => {
    setCharsLoading(true);
    getCharacters(pathId)
      .then((all) => setCharacters(all.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setCharacters([]))
      .finally(() => setCharsLoading(false));
  }, [pathId]);

  // Ordered list of scene indices to display (active + extras, sorted by position)
  const visibleSceneIndices = [
    activeSceneIdx,
    ...scenes.map((s, i) => i).filter((i) => i !== activeSceneIdx && extraSelectedIds.has(scenes[i].id)),
  ].sort((a, b) => a - b);

  function updateScene(idx: number, updated: Scene) {
    setScenes((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }

  function addScene() {
    const s = newScene(false);
    setScenes((prev) => [...prev, s]);
    setActiveSceneIdx(scenes.length);
    setExtraSelectedIds(new Set());
  }

  function deleteScene(idx: number) {
    if (scenes.length === 1) return;
    const deletedId = scenes[idx].id;
    const next = scenes.filter((_, i) => i !== idx);
    if (!next.some((s) => s.start)) next[0] = { ...next[0], start: true };
    setScenes(next);
    setActiveSceneIdx(Math.min(activeSceneIdx === idx ? Math.max(0, idx - 1) : activeSceneIdx > idx ? activeSceneIdx - 1 : activeSceneIdx, next.length - 1));
    setExtraSelectedIds((prev) => { const s = new Set(prev); s.delete(deletedId); return s; });
  }

  function handleSceneClick(idx: number, e: React.MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      const id = scenes[idx].id;
      if (idx === activeSceneIdx) return; // can't deselect primary
      setExtraSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setActiveSceneIdx(idx);
      setExtraSelectedIds(new Set());
    }
  }

  function addNodeToScene(sceneIdx: number, type: ScriptNode['type']) {
    const scene = scenes[sceneIdx];
    const node = type === 'dialogue' ? newDialogue() : type === 'choice' ? newChoice() : newFreeText();
    updateScene(sceneIdx, { ...scene, nodes: [...scene.nodes, node] });
  }

  function updateNodeInScene(sceneIdx: number, nodeIdx: number, updated: ScriptNode) {
    const scene = scenes[sceneIdx];
    const nodes = scene.nodes.map((n, i) => (i === nodeIdx ? updated : n));
    updateScene(sceneIdx, { ...scene, nodes });
  }

  function deleteNodeFromScene(sceneIdx: number, nodeIdx: number) {
    const scene = scenes[sceneIdx];
    const nodes = scene.nodes.filter((_, i) => i !== nodeIdx);
    updateScene(sceneIdx, { ...scene, nodes });
  }

  function autoSlug(name: string) {
    setNewCharSlug(name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  }

  function commitPendingChar() {
    const slug = newCharSlug.trim();
    const name = newCharName.trim();
    if (!name || !slug) { setAddCharError('Name and slug are required'); return; }
    if (!SLUG_RE.test(slug)) { setAddCharError('Slug: only lowercase letters, numbers, underscores'); return; }
    const conflict = characters.find((c) => c.slug === slug) || pendingChars.find((c) => c.slug === slug);
    if (conflict) { setAddCharError(`Slug "${slug}" already exists in this path`); return; }
    setPendingChars((prev) => [...prev, { slug, name, description: newCharDesc.trim(), personality: newCharPersonality.trim() }]);
    setNewCharName(''); setNewCharSlug(''); setNewCharDesc(''); setNewCharPersonality('');
    setAddCharError(null); setShowAddChar(false);
  }

  function removePending(slug: string) {
    setPendingChars((prev) => prev.filter((c) => c.slug !== slug));
  }

  function validate(): string | null {
    if (!metadata.title.trim()) return 'Title is required';
    if (scenes.length === 0) return 'At least one scene is required';
    if (!scenes.some((s) => s.start)) return 'One scene must be marked as start';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      // Flush pending characters first — abort on any conflict
      for (const pc of pendingChars) {
        const conflict = characters.find((c) => c.slug === pc.slug);
        if (conflict) {
          setError(`Character slug "${pc.slug}" already exists. Remove the conflict before saving.`);
          setSaving(false);
          return;
        }
      }
      for (const pc of pendingChars) {
        const created = await createCharacter(pathId, { slug: pc.slug, name: pc.name, description: pc.description || undefined, personality: pc.personality || undefined });
        setCharacters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setPendingChars([]);

      const yamlContent = serializeToYaml(metadata, scenes);
      const fileName = `${metadata.title.replace(/\s+/g, '_')}.yaml`;
      const file = new File([yamlContent], fileName, { type: 'application/x-yaml' });
      const result = existing
        ? await uploadBookYaml(pathId, moduleId, existing.id, file)
        : await confirmBookYaml(pathId, moduleId, file, orderIndex, required);
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const yamlPreview = showYamlPreview ? serializeToYaml(metadata, scenes) : '';

  // Loading screen while fetching YAML
  if (loadingYaml) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0918]">
        <div className="flex flex-col items-center gap-3 text-violet-400">
          <Loader className="w-7 h-7 animate-spin" />
          <p className="text-sm">Loading script…</p>
        </div>
      </div>
    );
  }

  // Hard load error
  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0918]">
        <div className="lumio-card p-6 max-w-sm mx-4 space-y-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-500">{loadError}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">Close</button>
            <button
              onClick={() => { setLoadError(null); setLoadingYaml(false); }}
              className="lumio-btn-primary flex-1 text-sm py-2.5"
            >
              Edit blank
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0a0918]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2DFFF] dark:border-[#2d2b47] flex-shrink-0">
        <div>
          <h2 className="font-bold text-[#1A1839] dark:text-white text-base">Script Editor</h2>
          {existing && (
            <p className="text-xs text-violet-400 dark:text-violet-500 truncate max-w-xs">{existing.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowYamlPreview((v) => !v)}
            className="lumio-btn-ghost text-xs py-1.5 px-3"
          >
            {showYamlPreview ? 'Hide YAML' : 'Preview YAML'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={clsx('lumio-btn-primary text-xs py-1.5 px-4', saving && 'opacity-60')}
          >
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Save & publish'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-5 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — metadata + scenes */}
        <div className="w-64 flex-shrink-0 border-r border-[#E2DFFF] dark:border-[#2d2b47] flex flex-col overflow-hidden">
          {/* Cover image */}
          {existing?.coverImageUrl && (
            <div className="w-full h-24 flex-shrink-0 overflow-hidden">
              <img
                src={existing.coverImageUrl}
                alt={existing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 border-b border-[#E2DFFF] dark:border-[#2d2b47] space-y-2">
            <p className="text-xs font-semibold text-violet-400 dark:text-violet-500 uppercase tracking-wider">Metadata</p>
            <input
              value={metadata.title}
              onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
              placeholder="Title *"
              className={fieldClass}
            />
            <input
              value={metadata.author}
              onChange={(e) => setMetadata((m) => ({ ...m, author: e.target.value }))}
              placeholder="Author"
              className={fieldClass}
            />
            <input
              value={metadata.language}
              onChange={(e) => setMetadata((m) => ({ ...m, language: e.target.value }))}
              placeholder="Language (en)"
              className={fieldClass}
            />
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata((m) => ({ ...m, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className={`${fieldClass} resize-none`}
            />
            {!existing && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    placeholder="Order"
                    className={fieldClass}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-[#1A1839] dark:text-violet-200 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-3.5 h-3.5 accent-violet-600"
                  />
                  Required
                </label>
              </div>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-[#E2DFFF] dark:border-[#2d2b47] flex-shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('scenes')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                leftTab === 'scenes'
                  ? 'text-violet-700 dark:text-violet-300 border-b-2 border-violet-500 -mb-px'
                  : 'text-violet-400 dark:text-violet-600 hover:text-violet-600 dark:hover:text-violet-400',
              )}
            >
              <ChevronRight className="w-3 h-3" />
              Scenes
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('characters')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                leftTab === 'characters'
                  ? 'text-violet-700 dark:text-violet-300 border-b-2 border-violet-500 -mb-px'
                  : 'text-violet-400 dark:text-violet-600 hover:text-violet-600 dark:hover:text-violet-400',
              )}
            >
              <Users className="w-3 h-3" />
              Characters
              {characters.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-full px-1.5 py-0.5 leading-none">
                  {characters.length}
                </span>
              )}
            </button>
          </div>

          {/* Scenes list */}
          {leftTab === 'scenes' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-violet-400 dark:text-violet-500 uppercase tracking-wider">
                  {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
                </p>
                <button
                  type="button"
                  onClick={addScene}
                  className="p-1 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-violet-300 dark:text-violet-700 mb-2">⌘/Ctrl+click to show multiple</p>
              {scenes.map((scene, idx) => {
                const isActive = idx === activeSceneIdx;
                const isExtra = extraSelectedIds.has(scene.id);
                const isSelected = isActive || isExtra;
                return (
                  <div
                    key={scene.id}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors',
                      isActive
                        ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                        : isExtra
                        ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-dashed border-violet-300 dark:border-violet-700'
                        : 'hover:bg-[#F5F3FF] dark:hover:bg-[#0f0e1a] text-[#1A1839] dark:text-violet-200',
                    )}
                    onClick={(e) => handleSceneClick(idx, e)}
                  >
                    <ChevronRight className={clsx('w-3 h-3 flex-shrink-0', isSelected && 'text-violet-500')} />
                    <span className="text-xs font-mono flex-1 truncate">{scene.id}</span>
                    {scene.start && (
                      <span className="text-xs text-emerald-500 font-medium flex-shrink-0">start</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteScene(idx); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-violet-300 hover:text-red-500 rounded transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Characters list */}
          {leftTab === 'characters' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {/* Add character button / inline form */}
              {!showAddChar ? (
                <button
                  type="button"
                  onClick={() => { setShowAddChar(true); setAddCharError(null); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[#E2DFFF] dark:border-[#2d2b47] text-xs text-violet-400 dark:text-violet-600 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add character
                </button>
              ) : (
                <div className="rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">New character</p>
                  <input
                    value={newCharName}
                    onChange={(e) => { setNewCharName(e.target.value); autoSlug(e.target.value); }}
                    placeholder="Name *"
                    className={fieldClass}
                    autoFocus
                  />
                  <input
                    value={newCharSlug}
                    onChange={(e) => setNewCharSlug(e.target.value)}
                    placeholder="Slug *"
                    className={`${fieldClass} font-mono`}
                  />
                  <input
                    value={newCharDesc}
                    onChange={(e) => setNewCharDesc(e.target.value)}
                    placeholder="Description"
                    className={fieldClass}
                  />
                  <textarea
                    value={newCharPersonality}
                    onChange={(e) => setNewCharPersonality(e.target.value)}
                    placeholder="Personality"
                    rows={2}
                    className={`${fieldClass} resize-none`}
                  />
                  {addCharError && (
                    <p className="text-[10px] text-red-500">{addCharError}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setShowAddChar(false); setAddCharError(null); }}
                      className="flex-1 text-xs py-1 rounded-lg border border-[#E2DFFF] dark:border-[#2d2b47] text-violet-400 hover:text-violet-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={commitPendingChar}
                      className="flex-1 text-xs py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Pending (unsaved) characters */}
              {pendingChars.map((pc) => (
                <div
                  key={pc.slug}
                  className="px-3 py-2 rounded-lg border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#1A1839] dark:text-violet-100">{pc.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold text-violet-500 bg-violet-100 dark:bg-violet-900/60 px-1.5 py-0.5 rounded-full">pending</span>
                      <button
                        type="button"
                        onClick={() => removePending(pc.slug)}
                        className="p-0.5 text-violet-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-violet-400 dark:text-violet-500">{pc.slug}</p>
                  {pc.personality && (
                    <p className="text-[10px] text-violet-300 dark:text-violet-600 italic line-clamp-2">"{pc.personality}"</p>
                  )}
                </div>
              ))}

              {/* Divider between pending and saved */}
              {pendingChars.length > 0 && characters.length > 0 && (
                <div className="border-t border-[#E2DFFF] dark:border-[#2d2b47] my-1" />
              )}

              {/* Saved characters */}
              {charsLoading && (
                <div className="flex justify-center py-4">
                  <Loader className="w-4 h-4 text-violet-400 animate-spin" />
                </div>
              )}
              {!charsLoading && characters.length === 0 && pendingChars.length === 0 && (
                <p className="text-xs text-violet-300 dark:text-violet-700 text-center py-4">
                  No characters yet.
                </p>
              )}
              {!charsLoading && characters.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2 rounded-lg bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] space-y-0.5"
                >
                  <p className="text-xs font-semibold text-[#1A1839] dark:text-violet-100">{c.name}</p>
                  <p className="text-[10px] font-mono text-violet-400 dark:text-violet-500">{c.slug}</p>
                  {c.personality && (
                    <p className="text-[10px] text-violet-300 dark:text-violet-600 italic line-clamp-2">"{c.personality}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center — one or more scenes rendered sequentially */}
        <div className="flex-1 overflow-y-auto p-5">
          {showYamlPreview ? (
            <pre className="text-xs text-violet-700 dark:text-violet-300 font-mono bg-[#F5F3FF] dark:bg-[#0f0e1a] p-4 rounded-xl border border-[#E2DFFF] dark:border-[#2d2b47] overflow-auto whitespace-pre-wrap">
              {yamlPreview}
            </pre>
          ) : (
            <div className="space-y-8">
              {visibleSceneIndices.map((sceneIdx, displayIdx) => {
                const scene = scenes[sceneIdx];
                const isActive = sceneIdx === activeSceneIdx;
                return (
                  <div key={scene.id}>
                    {/* Scene separator (for 2nd+ scenes) */}
                    {displayIdx > 0 && (
                      <div className="flex items-center gap-3 mb-6 -mt-2">
                        <div className="flex-1 border-t border-dashed border-[#E2DFFF] dark:border-[#2d2b47]" />
                        <span className="text-[10px] text-violet-300 dark:text-violet-700 uppercase tracking-widest">scene</span>
                        <div className="flex-1 border-t border-dashed border-[#E2DFFF] dark:border-[#2d2b47]" />
                      </div>
                    )}

                    {/* Scene header — click to make active */}
                    <div
                      className={clsx(
                        'flex items-center gap-3 mb-4 px-3 py-2 rounded-xl cursor-pointer transition-colors',
                        isActive
                          ? 'bg-violet-50 dark:bg-violet-950/20'
                          : 'hover:bg-[#F5F3FF] dark:hover:bg-[#0f0e1a]',
                      )}
                      onClick={() => { setActiveSceneIdx(sceneIdx); setExtraSelectedIds(new Set()); }}
                    >
                      <p className="text-sm font-bold text-[#1A1839] dark:text-white font-mono flex-1">{scene.id}</p>
                      {scene.start && (
                        <span className="text-xs text-emerald-500 font-semibold">start</span>
                      )}
                      <label
                        className="flex items-center gap-1.5 text-xs text-[#1A1839] dark:text-violet-200 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={scene.start}
                          onChange={(e) => updateScene(sceneIdx, { ...scene, start: e.target.checked })}
                          className="w-3.5 h-3.5 accent-violet-600"
                        />
                        Start scene
                      </label>
                    </div>

                    {/* Nodes grouped into rows */}
                    <div className="space-y-3">
                      {groupNodesByRow(scene.nodes, nodeBreaks).map((rowNodes, rowIdx) => (
                        <div key={rowIdx} className={clsx(rowNodes.length > 1 ? 'flex gap-3 items-start' : '')}>
                          {rowNodes.map((node) => {
                            const nodeIdx = scene.nodes.indexOf(node);
                            return (
                              <div key={node.id} className={clsx(rowNodes.length > 1 && 'flex-1 min-w-0')}>
                                <NodeEditor
                                  node={node}
                                  onChange={(updated) => updateNodeInScene(sceneIdx, nodeIdx, updated)}
                                  onDelete={() => deleteNodeFromScene(sceneIdx, nodeIdx)}
                                  characters={characters}
                                  pendingChars={pendingChars}
                                  onAddPendingChar={(pc) => setPendingChars((prev) => [...prev, pc])}
                                  allScenes={scenes}
                                  highlighted={highlightedNodeId === node.id}
                                  onHoverTarget={setHighlightedNodeId}
                                  canMerge={nodeIdx > 0}
                                  isMerged={nodeBreaks[node.id] === false}
                                  onToggleMerge={() => toggleMerge(node.id)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Add node buttons */}
                    <div className="flex gap-2 mt-4">
                      {(['dialogue', 'choice', 'free_text'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addNodeToScene(sceneIdx, type)}
                          className="lumio-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          {NODE_ICONS[type]}
                          {type === 'free_text' ? 'Free text' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
