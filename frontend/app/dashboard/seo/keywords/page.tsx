"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Keyword = {
  id: string;
  project: string;
  term: string;
  target_url: string | null;
  ranking: number | null;
  search_volume: number | null;
  last_updated: string;
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [project, setProject] = useState("");
  const [term, setTerm] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  // ✅ Fetch keywords via API route
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Not logged in");

        const res = await fetch(`/api/seo/keywords?userId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load keywords");

        setKeywords(data.keywords || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  // ✅ Insert keyword via API route
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Not logged in");

      const res = await fetch("/api/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          project,
          term,
          target_url: targetUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add keyword");

      setKeywords((prev) => [data.keyword, ...prev]);
      setProject("");
      setTerm("");
      setTargetUrl("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SEO Keywords</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Add Keyword Form */}
      <form onSubmit={handleAddKeyword} className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Keyword Term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="url"
          placeholder="Target URL (optional)"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Keyword
        </button>
      </form>

      {/* Keywords Table */}
      {keywords.length === 0 ? (
        <p>No keywords yet.</p>
      ) : (
        <table className="w-full border-collapse border rounded shadow bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Project</th>
              <th className="border px-4 py-2">Keyword</th>
              <th className="border px-4 py-2">Target URL</th>
              <th className="border px-4 py-2">Ranking</th>
              <th className="border px-4 py-2">Search Volume</th>
              <th className="border px-4 py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw.id} className="text-center">
                <td className="border px-4 py-2">{kw.project}</td>
                <td className="border px-4 py-2">{kw.term}</td>
                <td className="border px-4 py-2">
                  {kw.target_url ? (
                    <a
                      href={kw.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {kw.target_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border px-4 py-2">
                  {kw.ranking ?? "—"}
                </td>
                <td className="border px-4 py-2">
                  {kw.search_volume ?? "—"}
                </td>
                <td className="border px-4 py-2">
                  {new Date(kw.last_updated).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
