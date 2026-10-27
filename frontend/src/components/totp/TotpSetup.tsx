'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { TotpSetupData } from '@/types/totp';
import { createMockTotpSetup, downloadBackupCodesFile } from '@/lib/totp-mock';
import { OtpInput } from './OtpInput';

interface TotpSetupProps {
  onComplete: (data: TotpSetupData) => void;
  onCancel?: () => void;
}

type SetupStep = 'scan' | 'verify' | 'backup' | 'finished';

export function TotpSetup({ onComplete, onCancel }: TotpSetupProps) {
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [step, setStep] = useState<SetupStep>('scan');
  const [otpCode, setOtpCode] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);
  const [backupSaved, setBackupSaved] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const data = await createMockTotpSetup();
      if (isMounted) {
        setSetupData(data);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopySecret = async () => {
    if (!setupData) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleCopyBackupCodes = async () => {
    if (!setupData) return;
    await navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
  };

  const handleDownloadBackup = () => {
    if (!setupData) return;
    downloadBackupCodesFile(setupData.backupCodes, setupData.accountName);
  };

  const handleVerifyCode = (codeToVerify = otpCode) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số từ ứng dụng xác thực');
      return;
    }

    setVerifying(true);
    setErrorMsg('');

    setTimeout(() => {
      setVerifying(false);
      if (codeToVerify === '000000') {
        setErrorMsg('Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại!');
        return;
      }
      setStep('backup');
    }, 600);
  };

  const handleFinishSetup = () => {
    if (!setupData) return;
    if (!backupSaved) {
      setErrorMsg('Vui lòng xác nhận bạn đã lưu mã dự phòng trước khi tiếp tục');
      return;
    }
    setStep('finished');
    onComplete(setupData);
  };

  if (loading || !setupData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Đang khởi tạo mã bảo mật TOTP...
        </p>
      </div>
    );
  }

  const stepsList = [
    { id: 'scan', label: '1. Quét mã QR' },
    { id: 'verify', label: '2. Xác nhận mã' },
    { id: 'backup', label: '3. Lưu mã dự phòng' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden transition-all">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Kích hoạt xác thực 2 lớp (TOTP)
            </h2>
            <p className="text-xs text-slate-500">
              Bảo vệ tài khoản {setupData.accountName} với ứng dụng Authenticator
            </p>
          </div>
        </div>

        {onCancel && step !== 'finished' && (
          <button
            onClick={onCancel}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            Hủy
          </button>
        )}
      </div>

      {step !== 'finished' && (
        <div className="grid grid-cols-3 border-b border-slate-100 text-xs font-medium text-center bg-slate-50/40">
          {stepsList.map((s, idx) => {
            const stepOrder = ['scan', 'verify', 'backup', 'finished'];
            const currentIndex = stepOrder.indexOf(step);
            const thisIndex = stepOrder.indexOf(s.id);
            const isCompleted = currentIndex > thisIndex;
            const isCurrent = step === s.id;

            return (
              <div
                key={s.id}
                className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  isCurrent
                    ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/40'
                    : isCompleted
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-bold text-slate-500">
                    {idx + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.label.split('.')[1]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-6 sm:p-8">
        {step === 'scan' && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold text-slate-900">
                Bước 1: Quét mã QR vào ứng dụng xác thực
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Sử dụng Google Authenticator, Microsoft Authenticator, 1Password hoặc ứng dụng tương đương để quét mã dưới đây.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Image
                  src={setupData.qrCodeUrl}
                  alt="Mã QR TOTP"
                  width={180}
                  height={180}
                  className="rounded-xl"
                  priority
                  unoptimized
                />
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="text-xs text-slate-500">
                  Không quét được mã QR? Hãy nhập khóa bí mật (Secret Key) này thủ công:
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-indigo-600 select-all truncate">
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                      copiedSecret
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {copiedSecret ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã chép
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Sao chép
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div>Kiểu khóa: Time-based (TOTP) | Độ dài: 6 số | Chu kỳ: 30s</div>
                  <div>Tài khoản: {setupData.accountName}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                Tiếp tục: Xác nhận mã
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-base font-semibold text-slate-900">
                Bước 2: Xác nhận mã từ ứng dụng Authenticator
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Nhập 6 chữ số đang hiển thị trên ứng dụng xác thực của bạn để kiểm tra tính hợp lệ.
              </p>
            </div>

            <div className="py-4">
              <OtpInput
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  setErrorMsg('');
                }}
                onComplete={(code) => handleVerifyCode(code)}
                hasError={Boolean(errorMsg)}
                disabled={verifying}
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center flex items-center justify-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('scan')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
              >
                Quay lại xem mã QR
              </button>

              <button
                type="button"
                onClick={() => handleVerifyCode()}
                disabled={otpCode.length !== 6 || verifying}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Xác nhận mã
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Bước 3: Lưu mã dự phòng khẩn cấp (Backup Codes)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Nếu bạn mất điện thoại hoặc không thể truy cập ứng dụng Authenticator, đây là cách duy nhất để đăng nhập lại vào tài khoản. Mỗi mã chỉ dùng được 1 lần.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {setupData.backupCodes.map((c, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-mono text-xs sm:text-sm font-bold text-slate-800 shadow-2xs"
                  >
                    {c}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
                >
                  {copiedBackup ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Đã chép tất cả
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Sao chép tất cả mã
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải về file .txt
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Cảnh báo quan trọng: Các mã dự phòng này sẽ không hiển thị lại sau khi bạn hoàn tất bước này. Hãy cất giữ ở nơi bảo mật an toàn.
              </span>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={backupSaved}
                onChange={(e) => {
                  setBackupSaved(e.target.checked);
                  setErrorMsg('');
                }}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                Tôi đã sao chép hoặc tải các mã dự phòng này về nơi an toàn.
              </span>
            </label>

            {errorMsg && (
              <div className="text-rose-600 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={!backupSaved}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                Hoàn tất kích hoạt 2FA
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === 'finished' && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-500/10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Xác thực hai lớp (TOTP) đã được kích hoạt!
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Từ bây giờ, mỗi khi đăng nhập vào ToolHub, bạn sẽ được yêu cầu cung cấp thêm mã 6 chữ số từ ứng dụng xác thực của mình.
              </p>
            </div>

            <div className="p-4 max-w-md mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 text-left text-xs text-indigo-950 space-y-1">
              <div className="font-semibold text-indigo-600">Trạng thái bảo mật: Cực cao</div>
              <div>Số mã dự phòng còn lại: {setupData.backupCodes.length} mã</div>
              <div>Phương thức: TOTP 6 số (SHA1 / 30s)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
