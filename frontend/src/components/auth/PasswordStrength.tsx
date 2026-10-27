import React from 'react';
import { evaluatePasswordStrength } from '@/lib/validation';
import { CheckIcon } from '../ui/Icons';

interface PasswordStrengthProps {
  password?: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({
  password = '',
  showRequirements = true,
}: PasswordStrengthProps) {
  const { score, label, color, requirements } = evaluatePasswordStrength(password);

  if (!password) {
    return null;
  }

  const items = [
    { label: 'Tối thiểu 8 ký tự', met: requirements.minLength },
    { label: 'Chữ hoa (A-Z) và chữ thường (a-z)', met: requirements.hasUppercase && requirements.hasLowercase },
    { label: 'Chữ số (0-9)', met: requirements.hasNumber },
    { label: 'Ký tự đặc biệt (!@#$%...)', met: requirements.hasSpecialChar },
  ];

  return (
    <div className="mt-2 space-y-2 text-left">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Độ mạnh mật khẩu:</span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((level) => {
          const isActive = score >= level;
          return (
            <div
              key={level}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? color : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          );
        })}
      </div>

      {showRequirements && (
        <ul className="mt-2 space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`text-[11px] flex items-center gap-1.5 transition-colors ${
                item.met
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  item.met
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600'
                }`}
              >
                {item.met ? <CheckIcon className="w-2.5 h-2.5" /> : '•'}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
