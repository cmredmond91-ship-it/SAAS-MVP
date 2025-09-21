"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

interface AddUserDialogProps {
  onUserAdded: () => void;
}

export default function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [employmentType, setEmploymentType] = useState("employee");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("profiles").insert([
        {
          email,
          role,
          employment_type: employmentType,
        },
      ]);

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert([
        {
          message: `New ${employmentType} added: ${email} (${role})`,
          type: "user_added",
        },
      ]);

      toast.success("Employee added");
      onUserAdded();
      setEmail("");
      setRole("user");
      setEmploymentType("employee");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error adding employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + Add Person
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Add New Person
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="tech">Tech</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="employee">Employee (W-2)</option>
                <option value="contractor">1099 Contractor</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-3 py-2 rounded border border-gray-300"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}



