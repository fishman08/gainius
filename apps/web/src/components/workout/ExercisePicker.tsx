import { useState, useCallback, useRef } from 'react';
import { searchExercises } from '@fitness-tracker/shared';
import type { CatalogExercise } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ExercisePicker({
  value,
  onChange,
  onSelect,
  placeholder = 'Exercise name',
  autoFocus,
}: Props) {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState<CatalogExercise[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (text.trim().length >= 2) {
          const results = searchExercises(text, 8);
          setSuggestions(results);
          setShowDropdown(results.length > 0);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }, 300);
    },
    [onChange],
  );

  const handleSelect = useCallback(
    (exercise: CatalogExercise) => {
      onSelect(exercise.name);
      onChange(exercise.name);
      setShowDropdown(false);
    },
    [onSelect, onChange],
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
        style={{
          width: '100%',
          padding: 12,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: 8,
          fontSize: 16,
          boxSizing: 'border-box',
          background: theme.colors.inputBackground,
          color: theme.colors.text,
        }}
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: 'auto',
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.surfaceBorder}`,
            borderRadius: 8,
            marginTop: 2,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {suggestions.map((ex) => (
            <div
              key={ex.name}
              onMouseDown={() => handleSelect(ex)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ color: theme.colors.text, fontSize: 14 }}>{ex.name}</span>
              <span style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{ex.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
