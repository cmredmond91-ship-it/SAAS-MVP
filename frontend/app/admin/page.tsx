// app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const allowedRoles = ["user", "admin", "manager", "tech", "dispatcher"];

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Unauthorized");
        return;
      }
      setSession(data.session);
      fetchUsers();
    };

    checkAuth();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      const res = await fetch("/api/admin/updateRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });

      if (res.ok) {
        toast.success("Role updated");
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update role");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard – User Roles</h1>

      <table className="w-full table-auto border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Current Role</th>
            <th className="px-4 py-2 border">Set New Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">
                <select
                  className="border rounded px-2 py-1"
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                >
                  {allowedRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

