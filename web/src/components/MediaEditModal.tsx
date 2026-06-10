// Modal for editing a media item's caption, tags, and era in one place.
// Used by the member page and the group page's Group Photos section.

'use client';

import { useState } from 'react';

import { TagInput } from '@/components/ui/TagInput';
import type { Era } from '@/lib/eras';
import type { MediaPatch } from '@/lib/media';

const TAG_SUGGESTIONS = ['selca', 'fancam', 'airport', 'stage', 'photoshoot', 'behind', 'mv', 'concert'];

interface MediaEditModalProps {
  initial: { caption: string | null; tags: string[]; eraId: string | null };
  eras: Era[];
  saving: boolean;
  onSave: (patch: MediaPatch) => void;
  onCancel: () => void;
}

export function MediaEditModal({ initial, eras, saving, onSave, onCancel }: MediaEditModalProps) {
  const [caption, setCaption] = useState(initial.caption ?? '');
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [eraId, setEraId] = useState(initial.eraId ?? '');

  const fieldClass =
    'w-full rounded-sm border border-white/8 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#404040] focus:outline-none focus:ring-1 focus:ring-[#c084fc] focus:border-[#c084fc]/60 transition-colors';
  const labelClass = 'block text-[11px] tracking-[0.12em] uppercase text-[#737373] mb-1.5';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      caption: caption.trim() || null,
      tags,
      eraId: eraId || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-[3px] border border-white/8 bg-[#111111] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-normal text-[#f0f0f0] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Edit media
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelClass}>Caption</label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={saving}
              className={`${fieldClass} resize-none leading-relaxed`}
            />
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <TagInput tags={tags} onChange={setTags} suggestions={TAG_SUGGESTIONS} />
          </div>

          {eras.length > 0 && (
            <div>
              <label className={labelClass}>Era</label>
              <select
                value={eraId}
                onChange={(e) => setEraId(e.target.value)}
                disabled={saving}
                className={`${fieldClass} appearance-none cursor-pointer`}
              >
                <option value="">— no era —</option>
                {eras.map((er) => (
                  <option key={er.id} value={er.id}>{er.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 rounded-sm border border-white/10 px-4 py-2.5 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:border-white/20 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-sm bg-[#c084fc] px-4 py-2.5 text-sm font-medium text-black hover:bg-[#a855f7] disabled:opacity-40 transition-all"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
