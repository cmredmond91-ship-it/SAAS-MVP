"use client";

import { useEffect, useState } from "react";

export default function SocialSnapshotWidget({ userId }: { userId: string }) {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`/api/social/snapshot`);
        const data = await res.json();
        setSnapshot(data.snapshot || {});
      } catch (err) {
        console.error("❌ Social snapshot fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, [userId]);

  if (loading) return <p>Loading social snapshot...</p>;

  return (
    <div>
      <h2 className="font-semibold mb-2">Social Media Snapshot</h2>
      <ul className="space-y-1 text-sm">
        {Object.entries(snapshot).map(([platform, count]) => (
          <li key={platform}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}


