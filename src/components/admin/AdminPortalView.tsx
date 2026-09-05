import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  Check,
  Filter,
} from 'lucide-react';
import { AppRole, CoachSpecialty } from '../../models.ts';
import {
  AdminUserListItem,
  AdminMissingProductReport,
  fetchAllUsersForAdmin,
  updateUserRoleByAdmin,
  fetchMissingProductReportsForAdmin,
  updateMissingProductReportStatus,
} from '../../lib/db/admin.ts';

type AdminTab = 'users' | 'coaches' | 'permissions' | 'reports';

export const AdminPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [reports, setReports] = useState<AdminMissingProductReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const [uList, rList] = await Promise.all([
        fetchAllUsersForAdmin(),
        fetchMissingProductReportsForAdmin(),
      ]);
      setUsers(uList);
      setReports(rList);
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(null), 4000);
    } else {
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleRoleChange = async (
    userItem: AdminUserListItem,
    newRole: AppRole,
    newSpecialty: CoachSpecialty | null,
    newApproved: boolean
  ) => {
    setUpdatingUserId(userItem.userId);
    const res = await updateUserRoleByAdmin(userItem.userId, newRole, newSpecialty, newApproved);
    setUpdatingUserId(null);

    if (res.success) {
      showFeedback(`Successfully updated ${userItem.name} to ${newRole.toUpperCase()}.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === userItem.userId
            ? { ...u, role: newRole, specialty: newSpecialty, isApproved: newApproved }
            : u
        )
      );
    } else {
      showFeedback(res.error || 'Failed to update user role', true);
    }
  };

  const handleReportStatusChange = async (reportId: string, status: 'pending' | 'resolved' | 'rejected') => {
    const res = await updateMissingProductReportStatus(reportId, status);
    if (res.success) {
      showFeedback(`Report marked as ${status}.`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } else {
      showFeedback(res.error || 'Failed to update report status', true);
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCoachRequests = users.filter((u) => u.role === 'coach' && !u.isApproved);
  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Header Banner */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C0FF00]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C0FF00] flex items-center justify-center text-black shadow-[0_0_25px_rgba(192,255,0,0.25)] shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-black italic uppercase tracking-wider text-white">
                  Admin <span className="text-[#C0FF00]">Command Center</span>
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2 py-0.5 rounded-full">
                  SUPERUSER
                </span>
              </div>
              <p className="font-mono text-xs text-gray-400 mt-0.5">
                Manage platform roles, verify coaches, inspect page access, and audit catalog requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-gray-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C0FF00]' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Feedback alert bars */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-[#C0FF00]/15 border border-[#C0FF00]/40 rounded-xl flex items-center gap-2 text-xs font-mono text-[#C0FF00] animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
        {actionErrorMsg && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center gap-2 text-xs font-mono text-red-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#222] overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-[#C0FF00] text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User & Role Directory ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coaches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 relative ${
              activeTab === 'coaches'
                ? 'bg-[#C0FF00] text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Coach Verification Queue</span>
            {pendingCoachRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-black rounded-full">
                {pendingCoachRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'permissions'
                ? 'bg-[#C0FF00] text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Page & Permission Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'reports'
                ? 'bg-[#C0FF00] text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Missing Products Queue</span>
            {pendingReports.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#00ade6] text-black text-[10px] font-black rounded-full">
                {pendingReports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & ROLE DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-[#C0FF00] rounded-xl pl-10 pr-4 py-2 text-xs text-white font-mono placeholder:text-gray-600 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | AppRole)}
                className="bg-[#181818] border border-[#333] text-gray-300 font-mono text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="athlete">Athletes Only</option>
                <option value="coach">Coaches Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">User Profile</th>
                  <th className="py-3 px-3">Current Role</th>
                  <th className="py-3 px-3">Specialty</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3 text-right">Admin Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e] text-xs font-mono">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No users found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isUpdating = updatingUserId === u.userId;
                    return (
                      <tr key={u.userId} className="hover:bg-[#161616] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[11px] text-gray-400">{u.email}</div>
                          <div className="text-[9px] text-gray-600 truncate max-w-[140px]" title={u.userId}>
                            {u.userId}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : u.role === 'coach'
                                ? 'bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30'
                                : 'bg-gray-800 text-gray-300 border border-gray-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {u.role === 'coach' ? (
                            <span className="text-[10px] text-gray-300 capitalize bg-[#222] px-2 py-0.5 rounded">
                              {u.specialty || 'General'}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {u.role === 'coach' ? (
                            u.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )
                          ) : (
                            <span className="text-gray-600">Active</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Make Athlete */}
                            {u.role !== 'athlete' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(u, 'athlete', null, true)}
                                className="px-2 py-1 bg-[#222] hover:bg-[#333] text-gray-300 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                Set Athlete
                              </button>
                            )}

                            {/* Make Coach */}
                            {u.role !== 'coach' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(u, 'coach', 'strength', true)}
                                className="px-2 py-1 bg-[#C0FF00]/15 hover:bg-[#C0FF00]/25 text-[#C0FF00] border border-[#C0FF00]/30 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                Grant Coach
                              </button>
                            )}

                            {/* Toggle Coach Approval */}
                            {u.role === 'coach' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(u, 'coach', u.specialty || 'strength', !u.isApproved)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                                  u.isApproved
                                    ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {u.isApproved ? 'Revoke Approval' : 'Approve Coach'}
                              </button>
                            )}

                            {/* Toggle Admin */}
                            {u.role !== 'admin' ? (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(u, 'admin', null, true)}
                                className="px-2 py-1 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(u, 'athlete', null, true)}
                                className="px-2 py-1 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                Demote Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COACH VERIFICATION QUEUE */}
      {activeTab === 'coaches' && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-white uppercase tracking-wider">
              Pending Coach Applications ({pendingCoachRequests.length})
            </h2>
          </div>

          {pendingCoachRequests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl bg-[#141414] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#C0FF00] mx-auto opacity-60" />
              <p className="font-sans text-xs text-gray-400">All coach applications have been verified and processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingCoachRequests.map((c) => (
                <div key={c.userId} className="bg-[#181818] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{c.name}</h3>
                      <p className="text-[11px] font-mono text-gray-400">{c.email}</p>
                      <p className="text-[9px] font-mono text-gray-600 truncate">{c.userId}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30">
                      Pending
                    </span>
                  </div>

                  <div className="bg-[#121212] p-2.5 rounded-xl border border-[#262626] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Requested Specialty:</span>
                    <span className="text-[#C0FF00] font-bold capitalize">{c.specialty || 'Strength & Conditioning'}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRoleChange(c, 'athlete', null, false)}
                      className="flex-1 py-2 rounded-xl bg-[#222] hover:bg-[#2e2e2e] text-gray-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange(c, 'coach', c.specialty || 'strength', true)}
                      className="flex-1 py-2 rounded-xl bg-[#C0FF00] hover:bg-[#b0f000] text-black font-mono text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(192,255,0,0.25)]"
                    >
                      Approve Coach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAGE & PERMISSION MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <h2 className="font-display text-base font-bold text-white uppercase tracking-wider">
              Role-Based Access Control (RBAC) Page Matrix
            </h2>
            <p className="font-mono text-xs text-gray-400 mt-1">
              Live authorization boundaries and accessible views enforced per user role.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Application View / Page</th>
                  <th className="py-3 px-3">Route / URL</th>
                  <th className="py-3 px-3 text-center">Athlete</th>
                  <th className="py-3 px-3 text-center">Coach</th>
                  <th className="py-3 px-3 text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e] text-xs font-mono">
                <tr>
                  <td className="py-3 px-3 font-bold text-white">Daily Workout Tracker</td>
                  <td className="py-3 px-3 text-gray-400">/#tracker</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Training History & Log Book</td>
                  <td className="py-3 px-3 text-gray-400">/#history</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Performance Insights & Analytics</td>
                  <td className="py-3 px-3 text-gray-400">/#insights</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Macro & Dietary Journal</td>
                  <td className="py-3 px-3 text-gray-400">/#dietary</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Coach Command Center & Roster</td>
                  <td className="py-3 px-3 text-gray-400">/#coach</td>
                  <td className="py-3 px-3 text-center text-gray-600"><Lock className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Client Deep-Dive Inspection View</td>
                  <td className="py-3 px-3 text-gray-400">Dynamic Client Context</td>
                  <td className="py-3 px-3 text-center text-gray-600"><Lock className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-bold text-white">Admin Command Center</td>
                  <td className="py-3 px-3 text-gray-400">/#admin</td>
                  <td className="py-3 px-3 text-center text-gray-600"><Lock className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                  <td className="py-3 px-3 text-center text-gray-600"><Lock className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                  <td className="py-3 px-3 text-center text-purple-400 font-bold"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MISSING PRODUCTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-white uppercase tracking-wider">
                Crowdsourced Missing Food & Barcode Reports ({reports.length})
              </h2>
              <p className="font-mono text-xs text-gray-400 mt-0.5">
                Submitted by athletes when products are missing from global database & Open Food Facts.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl bg-[#141414] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#C0FF00] mx-auto opacity-60" />
              <p className="font-sans text-xs text-gray-400">No missing product reports pending review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#181818] border border-[#282828] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{r.name || 'Unnamed Product'}</span>
                      {r.barcode && (
                        <span className="text-[10px] font-mono text-[#C0FF00] bg-[#C0FF00]/10 px-2 py-0.5 rounded">
                          EAN: {r.barcode}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          r.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    {r.notes && <p className="text-xs text-gray-300 italic">"{r.notes}"</p>}
                    <p className="text-[10px] font-mono text-gray-500">
                      Reported by user: {r.userId?.substring(0, 12)} • {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleReportStatusChange(r.id, 'resolved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleReportStatusChange(r.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#333] text-gray-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
