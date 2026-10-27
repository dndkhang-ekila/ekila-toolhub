'use client';

import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  length = 6,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        const nextValue = nextDigits.join('');
        onChange(nextValue);
      } else if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        const nextValue = nextDigits.join('');
        onChange(nextValue);
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const inputValue = e.target.value.replace(/\D/g, '');

    if (!inputValue) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
      return;
    }

    const nextChar = inputValue[inputValue.length - 1];
    const nextDigits = [...digits];
    nextDigits[index] = nextChar;
    const nextValue = nextDigits.join('');
    onChange(nextValue);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (nextValue.length === length && onComplete) {
      onComplete(nextValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const targetFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[targetFocus]?.focus();

    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => {
        const isCurrentActive = digits.findIndex((d) => !d) === index;

        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoFocus={index === 0 && !disabled}
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border-2 transition-all outline-none shadow-xs
              ${
                hasError
                  ? 'border-rose-500 bg-rose-50/50 text-rose-600 focus:ring-4 focus:ring-rose-500/20'
                  : isCurrentActive
                    ? 'border-indigo-600 bg-white shadow-indigo-500/10 ring-4 ring-indigo-500/15'
                    : digits[index]
                      ? 'border-slate-300 bg-slate-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={`Ký tự số ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
