"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Result {
  id: string;
  type: "Customer" | "Estimate" | "Job";
  label: string;
  href: string;
}

export default function GlobalSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const router = useRouter();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const runSearch = async () => {
      if (!query.trim()) return;
      setLoading(true);

      let allResults: Result[] = [];

      // 🔍 Search Customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .ilike("name", `%${query}%`);
      if (customers) {
        allResults.push(
          ...customers.map((c) => ({
            id: c.id,
            type: "Customer",
            label: `${c.name} (${c.email})`,
            href: `/dashboard/customers/${c.id}`,
          }))
        );
      }

      // 🔍 Search Estimates
      const { data: estimates } = await supabase
        .from("estimates")
        .select("id, title")
        .ilike("title", `%${query}%`);
      if (estimates) {
        allResults.push(
          ...estimates.map((e) => ({
            id: e.id,
            type: "Estimate",
            label: e.title,
            href: `/dashboard/estimates/${e.id}`,
          }))
        );
      }

      // 🔍 Search Jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, description")
        .ilike("description", `%${query}%`);
      if (jobs) {
        allResults.push(
          ...jobs.map((j) => ({
            id: j.id,
            type: "Job",
            label: j.description,
            href: `/dashboard/jobs/${j.id}`,
          }))
        );
      }

      setResults(allResults);
      setLoading(false);
    };

    runSearch();
  }, [query]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>🔎 Search Results for "{query}"</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ⚡ Quick Actions */}
          {query.trim() && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/customers/new?prefill=${encodeURIComponent(query)}`)}
              >
                <Plus size={16} className="mr-1" /> New Customer
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/estimates/new?prefill=${encodeURIComponent(query)}`)}
              >
                <Plus size={16} className="mr-1" /> New Estimate
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/jobs/new?prefill=${encodeURIComponent(query)}`)}
              >
                <Plus size={16} className="mr-1" /> New Job
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={20} />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="text-gray-500">No results found.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={r.href}
                    className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 transition"
                  >
                    <span>
                      <span className="font-medium">{r.type}:</span> {r.label}
                    </span>
                    <span className="text-xs text-gray-400">View →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

