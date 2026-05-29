import { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, MessageSquare, ListChecks, PenLine, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { confirmBookYaml, type BookResponse } from '../api/books';

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
  moduleId: string;
  nextOrderIndex: number;
  onClose: () => void;
  onSaved: (b: BookResponse) => void;
}

// ─── YAML serializer ──────────────────────────────────────────────────────────

function escapeYaml(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function serializeToYaml(metadata: Metadata, scenes: Scene[], orderIndex: number, required: boolean): string {
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

function NodeEditor({
  node,
  onChange,
  onDelete,
}: {
  node: ScriptNode;
  onChange: (n: ScriptNode) => void;
  onDelete: () => void;
}) {
  function changeType(type: ScriptNode['type']) {
    if (type === 'dialogue') onChange(newDialogue());
    else if (type === 'choice') onChange(newChoice());
    else onChange(newFreeText());
  }

  return (
    <div className="lumio-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-violet-400">{NODE_ICONS[node.type]}</span>
        <span className="text-xs font-mono text-violet-300 dark:text-violet-600 flex-1">{node.id}</span>
        <select
          value={node.type}
          onChange={(e) => changeType(e.target.value as ScriptNode['type'])}
          className="text-xs rounded-lg px-2 py-1 bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 focus:outline-none cursor-pointer"
        >
          <option value="dialogue">Dialogue</option>
          <option value="choice">Choice</option>
          <option value="free_text">Free text</option>
        </select>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-violet-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fields */}
      {node.type === 'dialogue' && (
        <div className="space-y-2">
          <input
            value={node.character}
            onChange={(e) => onChange({ ...node, character: e.target.value })}
            placeholder="Character"
            className={fieldClass}
          />
          <textarea
            value={node.text}
            onChange={(e) => onChange({ ...node, text: e.target.value })}
            placeholder="Dialogue text"
            rows={2}
            className={`${fieldClass} resize-none`}
          />
          <input
            value={node.next}
            onChange={(e) => onChange({ ...node, next: e.target.value })}
            placeholder="Next node ID (optional)"
            className={fieldClass}
          />
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
                <input
                  value={opt.next}
                  onChange={(e) => {
                    const opts = node.options.map((o, j) => (j === i ? { ...o, next: e.target.value } : o));
                    onChange({ ...node, options: opts });
                  }}
                  placeholder="→ node ID"
                  className={clsx(fieldClass, 'w-28')}
                />
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
          <input
            value={node.on_success}
            onChange={(e) => onChange({ ...node, on_success: e.target.value })}
            placeholder="On success → node ID"
            className={fieldClass}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScriptEditorModal({ moduleId, nextOrderIndex, onClose, onSaved }: Props) {
  const [metadata, setMetadata] = useState<Metadata>({ title: '', author: '', language: '', description: '' });
  const [scenes, setScenes] = useState<Scene[]>([newScene(true)]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showYamlPreview, setShowYamlPreview] = useState(false);

  const activeScene = scenes[activeSceneIdx];

  function updateScene(idx: number, updated: Scene) {
    setScenes((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }

  function addScene() {
    const s = newScene(false);
    setScenes((prev) => [...prev, s]);
    setActiveSceneIdx(scenes.length);
  }

  function deleteScene(idx: number) {
    if (scenes.length === 1) return;
    const next = scenes.filter((_, i) => i !== idx);
    if (!next.some((s) => s.start)) next[0] = { ...next[0], start: true };
    setScenes(next);
    setActiveSceneIdx(Math.min(activeSceneIdx, next.length - 1));
  }

  function addNode(type: ScriptNode['type']) {
    const node = type === 'dialogue' ? newDialogue() : type === 'choice' ? newChoice() : newFreeText();
    updateScene(activeSceneIdx, { ...activeScene, nodes: [...activeScene.nodes, node] });
  }

  function updateNode(nodeIdx: number, updated: ScriptNode) {
    const nodes = activeScene.nodes.map((n, i) => (i === nodeIdx ? updated : n));
    updateScene(activeSceneIdx, { ...activeScene, nodes });
  }

  function deleteNode(nodeIdx: number) {
    const nodes = activeScene.nodes.filter((_, i) => i !== nodeIdx);
    updateScene(activeSceneIdx, { ...activeScene, nodes });
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
      const yaml = serializeToYaml(metadata, scenes, orderIndex, required);
      const file = new File([yaml], `${metadata.title.replace(/\s+/g, '_')}.yaml`, { type: 'application/x-yaml' });
      const result = await confirmBookYaml(moduleId, file, orderIndex, required);
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const yamlPreview = showYamlPreview ? serializeToYaml(metadata, scenes, orderIndex, required) : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0a0918]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2DFFF] dark:border-[#2d2b47] flex-shrink-0">
        <h2 className="font-bold text-[#1A1839] dark:text-white text-base">Script Editor</h2>
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
            {saving ? 'Saving…' : 'Save & publish'}
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
          {/* Metadata */}
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
            <div className="flex gap-2">
              <input
                value={metadata.language}
                onChange={(e) => setMetadata((m) => ({ ...m, language: e.target.value }))}
                placeholder="Lang (en)"
                className={clsx(fieldClass, 'flex-1')}
              />
            </div>
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata((m) => ({ ...m, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className={`${fieldClass} resize-none`}
            />
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
          </div>

          {/* Scenes list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-violet-400 dark:text-violet-500 uppercase tracking-wider">Scenes</p>
              <button
                type="button"
                onClick={addScene}
                className="p-1 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors',
                  idx === activeSceneIdx
                    ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-[#F5F3FF] dark:hover:bg-[#0f0e1a] text-[#1A1839] dark:text-violet-200',
                )}
                onClick={() => setActiveSceneIdx(idx)}
              >
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
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
            ))}
          </div>
        </div>

        {/* Center — node editor for active scene */}
        <div className="flex-1 overflow-y-auto p-5">
          {showYamlPreview ? (
            <pre className="text-xs text-violet-700 dark:text-violet-300 font-mono bg-[#F5F3FF] dark:bg-[#0f0e1a] p-4 rounded-xl border border-[#E2DFFF] dark:border-[#2d2b47] overflow-auto whitespace-pre-wrap">
              {yamlPreview}
            </pre>
          ) : activeScene ? (
            <div className="max-w-xl mx-auto">
              {/* Scene header */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-sm font-bold text-[#1A1839] dark:text-white font-mono">{activeScene.id}</p>
                <label className="flex items-center gap-1.5 text-xs text-[#1A1839] dark:text-violet-200 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={activeScene.start}
                    onChange={(e) => updateScene(activeSceneIdx, { ...activeScene, start: e.target.checked })}
                    className="w-3.5 h-3.5 accent-violet-600"
                  />
                  Start scene
                </label>
              </div>

              {/* Nodes */}
              <div className="space-y-3">
                {activeScene.nodes.map((node, i) => (
                  <NodeEditor
                    key={node.id}
                    node={node}
                    onChange={(updated) => updateNode(i, updated)}
                    onDelete={() => deleteNode(i)}
                  />
                ))}
              </div>

              {/* Add node buttons */}
              <div className="flex gap-2 mt-4">
                {(['dialogue', 'choice', 'free_text'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addNode(type)}
                    className="lumio-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    {NODE_ICONS[type]}
                    {type === 'free_text' ? 'Free text' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
