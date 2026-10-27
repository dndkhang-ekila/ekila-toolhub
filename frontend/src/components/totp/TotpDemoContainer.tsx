'use client';

import React, { useState } from 'react';
import { TotpSetup } from './TotpSetup';
import { TotpVerify } from './TotpVerify';
import { TotpSetupData } from '@/types/totp';

type ActiveView = 'setup' | 'verify' | 'settings';

export function TotpDemoContainer() {
  const [activeView, setActiveView] = useState<ActiveView>('setup');
  const [is2faEnabled, setIs2faEnabled] = useState<boolean>(false);
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [showNotification, setShowNotification] = useState<string>('');

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(''), 4000);
  };

  const handleSetupComplete = (data: TotpSetupData) => {
    setSetupData(data);
    setIs2faEnabled(true);
    triggerNotification('Chúc mừng! Xác thực 2 lớp (TOTP) đã được kích hoạt thành công.');
  };

  const handleDisable2fa = () => {
    setIs2faEnabled(false);
    setSetupData(null);
    triggerNotification('Đã tắt xác thực hai lớp TOTP thành công.');
  };

  const handleVerifySuccess = () => {
    triggerNotification('Đăng nhập thành công! Phiên làm việc đã được bảo mật qua TOTP.');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Bảo mật cấp cao ToolHub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Xác thực hai lớp bằng TOTP
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Hệ thống xác thực mã ngẫu nhiên theo thời gian thực (Time-based One-Time Password) tuân theo chuẩn RFC 6238, tương thích Google Authenticator, Microsoft Authenticator & 1Password.
          </p>
        </header>

        {showNotification && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{showNotification}</span>
            </div>
            <button
              onClick={() => setShowNotification('')}
              className="text-emerald-700/70 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 max-w-lg mx-auto shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView('setup')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeView === 'setup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            1. Thiết lập 2FA
          </button>
          <button
            type="button"
            onClick={() => setActiveView('verify')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeView === 'verify'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            2. Màn hình Xác thực
          </button>
          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeView === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            3. Quản lý trạng thái
          </button>
        </div>

        <main className="transition-all">
          {activeView === 'setup' && (
            <div className="space-y-4">
              <TotpSetup
                onComplete={handleSetupComplete}
                onCancel={() => setActiveView('settings')}
              />
            </div>
          )}

          {activeView === 'verify' && (
            <div className="space-y-4">
              <TotpVerify
                onSuccess={handleVerifySuccess}
                onCancel={() => setActiveView('settings')}
                validOtpHint="123456"
                availableBackupCodes={setupData?.backupCodes || ['DEMO-CODE', 'TEST-2026']}
                accountName={setupData?.accountName || 'user@ekila.vn'}
              />
            </div>
          )}

          {activeView === 'settings' && (
            <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Trạng thái bảo mật 2FA</h3>
                  <p className="text-xs text-slate-500">
                    Bảo vệ bổ sung bằng mã xác thực 6 số trên thiết bị di động
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    is2faEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      is2faEnabled ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {is2faEnabled ? 'Đang kích hoạt' : 'Chưa bật'}
                </div>
              </div>

              {is2faEnabled ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">Tài khoản bảo vệ:</span>
                      <span className="font-semibold">{setupData?.accountName || 'user@ekila.vn'}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">Phương thức:</span>
                      <span>TOTP (Google / Microsoft Authenticator)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">Mã dự phòng:</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {setupData?.backupCodes?.length || 8} mã còn hiệu lực
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveView('verify')}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      Thử nghiệm đăng nhập ngay
                    </button>
                    <button
                      type="button"
                      onClick={handleDisable2fa}
                      className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition"
                    >
                      Vô hiệu hóa 2FA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Tài khoản của bạn chưa được bảo vệ bằng 2FA
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Kích hoạt ngay để ngăn chặn truy cập trái phép ngay cả khi mật khẩu của bạn bị lộ.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveView('setup')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20"
                  >
                    Bắt đầu cài đặt 2FA
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-2xl mx-auto text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Bảng điều khiển Sandbox phục vụ kiểm thử:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Mã OTP hợp lệ kiểm thử:</span>{' '}
              <span className="font-mono text-emerald-600 font-bold">123456</span> (hoặc bất kỳ 6 số khác 000000)
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Mã cố tình sai để test:</span>{' '}
              <span className="font-mono text-rose-600 font-bold">000000</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
