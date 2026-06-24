import { useState } from "react";
import type { UserRecord, EmployeeRecord } from "./types";

type RoleTableProps = {
  users: UserRecord[];
  employees: EmployeeRecord[];
  onToggleTrackingNeeded?: (empId: string, currentVal: boolean) => void;
};

export default function RoleTable({ users, employees, onToggleTrackingNeeded }: RoleTableProps) {
  const [activeTab, setActiveTab] = useState<"users" | "registry">("users");

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden mt-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 px-6 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "users"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Active Users Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex-1 py-3 px-6 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "registry"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Employee Registry ({employees.length})
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {activeTab === "users" ? (
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Call Tracking</th>
                <th className="px-6 py-4">System ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No active users match the current hierarchy filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{user.full_name}</div>
                      <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 capitalize">
                      {user.role.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_approved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {user.is_approved ? "Approved" : "Pending Approval"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_tracking_enabled
                          ? "bg-[#04693F]/10 text-[#04693F]"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {user.is_tracking_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                      {user.system_id ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Employee ID / Email</th>
                <th className="px-6 py-4">System ID</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Call Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No registered employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{emp.employee_id}</div>
                      <div className="text-xs text-slate-400 font-medium">{emp.email ?? "No email provided"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#015C96]">
                      {emp.system_id}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleTrackingNeeded?.(emp.id, emp.is_tracking_needed)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          emp.is_tracking_needed
                            ? "bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] text-[#04693F] border-[#04693F]/15 hover:opacity-90"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {emp.is_tracking_needed ? "Tracking Required" : "Tracking Disabled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
