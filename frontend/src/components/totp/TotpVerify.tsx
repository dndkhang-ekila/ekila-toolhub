'use client';

import React, { useState, useEffect } from 'react';
import { OtpInput } from './OtpInput';
import { TotpVerificationMethod } from '@/types/totp';

interface TotpVerifyProps {
  onSuccess: () => void;
  onCancel?: () => void;
  validOtpHint?: string;
  availableBackupCodes?: string[];
  accountName?: string;
}

export function TotpVerify({
  onSuccess,
  onCancel,
  validOtpHint = '123456',
  availableBackupCodes = [],
  accountName = 'user@ekila.vn',
}: TotpVerifyProps) {
  const [method, setMethod] = useState<TotpVerificationMethod>('app');
  const [otpCode, setOtpCode] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setSecondsRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyTotp = (codeToVerify = otpCode) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số từ ứng dụng');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setLoading(false);
      const isCorrect =
        codeToVerify === validOtpHint ||
        codeToVerify === '123456' ||
        (codeToVerify !== '000000' && codeToVerify.length === 6);

      if (isCorrect) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg('Mã xác thực không chính xác hoặc đã hết hiệu lực');
        setOtpCode('');
      }
    }, 700);
  };

  const handleVerifyBackup = () => {
    const cleanCode = backupCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Vui lòng nhập mã dự phòng');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setLoading(false);
      const matched =
        availableBackupCodes.length === 0 ||
        availableBackupCodes.some((c) => c.toUpperCase() === cleanCode);

      if (matched && cleanCode.length >= 8) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg('Mã dự phòng không hợp lệ hoặc đã qua sử dụng');
      }
    }, 700);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden transition-all">
      <div className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            {method === 'app' ? (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {method === 'app' ? 'Xác thực hai lớp (2FA)' : 'Nhập mã dự phòng'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Đăng nhập tài khoản: <span className="font-semibold text-slate-700">{accountName}</span>
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-base font-bold text-slate-900">
              Xác thực thành công!
            </div>
            <p className="text-xs text-slate-500">
              Đang chuyển hướng vào hệ thống...
            </p>
          </div>
        ) : (
          <>
            {method === 'app' ? (
              <div className="space-y-5">
                <p className="text-xs text-center text-slate-600">
                  Mở ứng dụng xác thực trên điện thoại của bạn và điền mã 6 chữ số:
                </p>

                <OtpInput
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    setErrorMsg('');
                  }}
                  onComplete={(code) => handleVerifyTotp(code)}
                  hasError={Boolean(errorMsg)}
                  disabled={loading}
                />

                <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        secondsRemaining > 10 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                    <span>Chu kỳ mã: {secondsRemaining}s</span>
                  </div>
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        secondsRemaining > 10 ? 'bg-indigo-600' : 'bg-rose-500'
                      }`}
                      style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleVerifyTotp()}
                  disabled={otpCode.length !== 6 || loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xác minh...
                    </>
                  ) : (
                    'Xác nhận đăng nhập'
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('backup');
                      setErrorMsg('');
                    }}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Không mang điện thoại? Sử dụng mã dự phòng
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-xs text-center text-slate-600">
                  Nhập một trong các mã dự phòng (8 ký tự) bạn đã lưu khi kích hoạt 2FA:
                </p>

                <div>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => {
                      setBackupCode(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    placeholder="VD: A1B2-C3D4"
                    maxLength={10}
                    disabled={loading}
                    className="w-full py-3 px-4 text-center font-mono font-bold tracking-widest text-lg uppercase bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyBackup}
                  disabled={!backupCode.trim() || loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    'Sử dụng mã dự phòng'
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('app');
                      setErrorMsg('');
                    }}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Quay lại xác thực bằng ứng dụng
                  </button>
                </div>
              </div>
            )}

            {onCancel && (
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
