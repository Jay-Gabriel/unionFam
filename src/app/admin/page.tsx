'use client';

import React, { useState } from 'react';
import { ShieldAlert, Users, Activity, FileText, Lock } from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'errors' | 'audit'>('users');

  const mockUsers = [
    { id: 'usr-1', email: 'minhanh@example.com', role: 'member', joined: '28/08/2026', answersCount: 3 },
    { id: 'usr-2', email: 'operator@unionfam.com', role: 'admin', joined: '20/08/2026', answersCount: 0 },
  ];

  const mockErrors = [
    { id: 'err-1', code: 'AI_PROVIDER_UNAVAILABLE', route: '/api/chat', time: '10:35:12' },
  ];

  return (
    <div className="legacy-calm-page min-h-screen bg-calm-deep-moss p-6 space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-xl">Admin Audit & Operations</h1>
            <p className="text-xs text-slate-500">Bảo mật - Giám sát lỗi - Kiểm toán quyền hạn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['users', 'sessions', 'errors', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">User Management & Roles</h3>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3">Answers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{u.id}</td>
                    <td className="p-3 font-semibold text-slate-900">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">{u.joined}</td>
                    <td className="p-3">{u.answersCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Application & AI Errors</h3>
            {mockErrors.map((e) => (
              <div key={e.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-rose-800">{e.code}</span>
                  <p className="text-slate-600 mt-0.5">Route: {e.route}</p>
                </div>
                <span className="text-slate-400">{e.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
