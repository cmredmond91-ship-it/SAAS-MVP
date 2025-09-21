"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SocialData {
  id: string;
  user_id: string;
  platform: string;
  post_count: number;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    [key: string]: number | undefined;
  };
  last_updated: string;
}

export default function SocialSnapshotWidget({ userId }: { userId: string }) {
  const [data, setData] = useState<SocialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const res = await fetch(`/api/seo/social?userId=${userId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch social data");
        setData(json.social || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSocial();
  }, [userId]);

  if (loading) return <p>Loading social snapshot…</p>;
  if (error) return <p className="text-red-600">❌ {error}</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">📊 Social Media Snapshot</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No social data found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-md font-bold capitalize">
                {item.platform}
              </h3>
              <p className="text-sm text-gray-600">
                Posts: {item.post_count}
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1">
                {Object.entries(item.engagement || {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Last updated:{" "}
                {new Date(item.last_updated).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}


