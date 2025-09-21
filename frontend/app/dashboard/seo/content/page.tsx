"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ContentIdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [project, setProject] = useState("");
  const [idea, setIdea] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState("");
  const [editIdea, setEditIdea] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchIdeas(user.id);
      }
    };
    init();
  }, []);

  const fetchIdeas = async (uid: string) => {
    setLoading(true);
    const res = await fetch(`/api/seo/content-ideas?userId=${uid}`);
    const json = await res.json();
    setIdeas(json.contentIdeas || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    const res = await fetch("/api/seo/content-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        project,
        idea,
        notes,
      }),
    });

    const json = await res.json();
    if (res.ok) {
      setIdeas((prev) => [json.contentIdea, ...prev]);
      setProject("");
      setIdea("");
      setNotes("");
    } else {
      alert("Error: " + json.error);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    const res = await fetch(`/api/seo/content-ideas/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } else {
      const json = await res.json();
      alert("Error: " + json.error);
    }
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/seo/content-ideas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: editProject,
        idea: editIdea,
        notes: editNotes,
      }),
    });

    const json = await res.json();
    if (res.ok) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...json.contentIdea } : i))
      );
      setEditingId(null);
    } else {
      alert("Error: " + json.error);
    }
  };

  if (!userId) return <p className="p-6">Loading user...</p>;
  if (loading) return <p className="p-6">Loading content ideas...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Content Ideas</h1>

      {/* 📝 Add New Idea Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-white shadow-md rounded-xl p-4 border border-gray-200"
      >
        <h2 className="font-semibold text-lg mb-3">Add New Content Idea</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Idea"}
          </button>
        </div>
      </form>

      {/* 📋 List of Ideas */}
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <p className="text-gray-500">No content ideas yet.</p>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              {editingId === idea.id ? (
                <>
                  <input
                    type="text"
                    value={editProject}
                    onChange={(e) => setEditProject(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 mb-2"
                  />
                  <input
                    type="text"
                    value={editIdea}
                    onChange={(e) => setEditIdea(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 mb-2"
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(idea.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-semibold">{idea.idea}</h2>
                  <p className="text-sm text-gray-500">{idea.project}</p>
                  <p className="text-sm text-gray-600 mt-2">{idea.notes}</p>
                  <span className="text-xs text-gray-400">
                    Status: {idea.status}
                  </span>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        setEditingId(idea.id);
                        setEditProject(idea.project);
                        setEditIdea(idea.idea);
                        setEditNotes(idea.notes || "");
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

