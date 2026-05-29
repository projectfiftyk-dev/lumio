import { useRef, useState } from 'react';
import { ImagePlus, X, Loader } from 'lucide-react';
import { uploadMedia } from '../api/media';

interface Props {
  value: string | null;
  previewUrl: string | null;
  onChange: (key: string, url: string) => void;
  onClear: () => void;
}

export default function ThumbnailUploader({ value, previewUrl, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMedia(file);
      onChange(res.key, res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Thumbnail</label>
      {previewUrl ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-[#E2DFFF] dark:border-[#2d2b47] bg-[#F5F3FF] dark:bg-[#0f0e1a]">
          <img src={previewUrl} alt="thumbnail" className="w-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 bg-white dark:bg-[#1a1833] rounded-full p-1 shadow text-violet-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 rounded-xl border-2 border-dashed border-[#E2DFFF] dark:border-[#2d2b47] flex flex-col items-center justify-center gap-2 text-violet-400 dark:text-violet-600 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer disabled:opacity-60"
        >
          {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          <span className="text-xs">{uploading ? 'Uploading…' : 'Upload image'}</span>
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {value && !previewUrl && (
        <p className="text-xs text-violet-300 dark:text-violet-700 mt-1 truncate">Key: {value}</p>
      )}
    </div>
  );
}
