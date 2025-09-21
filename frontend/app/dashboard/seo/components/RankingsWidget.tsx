"use client";

import { useEffect, useState } from "react";

export default function RankingsWidget({ userId }: { userId: string }) {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch(`/api/seo/rankings?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load rankings");
        setRankings(data.rankings || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [userId]);

  if (loading) return <p className="text-sm text-gray-500">Loading rankings...</p>;
  if (error)
    return <div className="p-3 rounded bg-red-100 text-red-700 text-sm">❌ {error}</div>;

  return (
    <div>
      <h2 className="font-semibold mb-2">Rankings</h2>
      {rankings.length === 0 ? (
        <p className="text-gray-500 text-sm">No rankings available</p>
      ) : (
        <ul className="list-decimal pl-5 space-y-1 text-sm">
          {rankings.map((r, idx) => (
            <li key={idx}>
              {r.keyword} → #{r.position}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


