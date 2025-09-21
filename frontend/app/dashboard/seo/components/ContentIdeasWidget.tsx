"use client";

import { useEffect, useState } from "react";

export default function ContentIdeasWidget({ userId }: { userId: string }) {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const res = await fetch(`/api/seo/content-ideas?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load content ideas");
        setIdeas(data.ideas || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [userId]);

  if (loading) return <p className="text-sm text-gray-500">Loading content ideas...</p>;
  if (error)
    return <div className="p-3 rounded bg-red-100 text-red-700 text-sm">❌ {error}</div>;

  return (
    <div>
      <h2 className="font-semibold mb-2">Content Ideas</h2>
      {ideas.length === 0 ? (
        <p className="text-gray-500 text-sm">No ideas yet</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {ideas.map((idea, idx) => (
            <li key={idx}>{idea.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}


