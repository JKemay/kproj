'use client';

import { useState } from 'react';

interface FieldDef {
  name: string;
  label: string;
  value: string | number;
  type: 'text' | 'number' | 'textarea';
}

interface EditEntityFormProps {
  fields: FieldDef[];
  onSave: (values: Record<string, string>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function EditEntityForm({ fields, onSave, onCancel, saving }: EditEntityFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, String(f.value ?? '')]))
  );

  const set = (name: string, val: string) => setValues((prev) => ({ ...prev, [name]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const inputClass =
    'w-full rounded-sm border border-white/8 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#404040] focus:outline-none focus:ring-1 focus:ring-[#c084fc] focus:border-[#c084fc]/60 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.12em] uppercase text-[#737373]">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              value={values[field.name]}
              onChange={(e) => set(field.name, e.target.value)}
              rows={3}
              disabled={saving}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          ) : (
            <input
              type={field.type}
              value={values[field.name]}
              onChange={(e) => set(field.name, e.target.value)}
              disabled={saving}
              className={inputClass}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-sm border border-white/10 bg-transparent px-4 py-2.5 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:border-white/20 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-[#c084fc] px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="5" strokeOpacity="0.3" />
                <path d="M6.5 1.5a5 5 0 015 5" strokeLinecap="round" />
              </svg>
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
