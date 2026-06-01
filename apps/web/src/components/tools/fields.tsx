'use client';

export interface Choice {
  value: string;
  label: string;
}

/**
 * Accessible single-select choice group rendered as a radiogroup.
 * Keyboard-operable buttons with visible focus + selected states.
 */
export function ChoiceGroup({
  label,
  name,
  choices,
  value,
  onChange,
}: {
  label: string;
  name: string;
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 block text-sm font-semibold text-gray-900">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => onChange(c.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 ${
                selected
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Labeled number input with min/max and a unit suffix. */
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
  suffix,
  id,
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id: string;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-900">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-40 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}
