"use client";

import { useEffect, useState } from "react";

export default function GoogleInsightsWidget({ accountId, locationId }: { accountId: string, locationId: string }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`/api/seo/google?accountId=${accountId}&locationId=${locationId}`);
        const data = await res.json();
        setInsights(data.insights || {});
      } catch (err) {
        console.error("Error fetching GBP insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [accountId, locationId]);

  if (loading) return <p>Loading Google Business data...</p>;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-bold mb-3">📊 Google Business Insights</h2>
      {insights?.locationMetrics ? (
        <ul className="space-y-2">
          {insights.locationMetrics[0]?.metricValues.map((m: any, idx: number) => (
            <li key={idx} className="text-sm">
              {m.metric}: <strong>{m.totalValue?.value || 0}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No insights found.</p>
      )}
    </div>
  );
}
