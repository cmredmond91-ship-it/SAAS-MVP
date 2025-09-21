"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface Result {
  id: string;
  type: string;
  label: string;
  href: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // 🔍 Run search when query changes
  useEffect(() => {
    const runSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      let allResults: Result[] = [];

      // Customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .ilike("name", `%${query}%`)
        .limit(5);
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

      // Estimates
      const { data: estimates } = await supabase
        .from("estimates")
        .select("id, title")
        .ilike("title", `%${query}%`)
        .limit(5);
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

      // Jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, description")
        .ilike("description", `%${query}%`)
        .limit(5);
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

    const timer = setTimeout(runSearch, 400); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Search className="text-white opacity-70" size={18} />
        <Input
          placeholder="Search customers, jobs, estimates..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="bg-white/20 text-white placeholder:text-white/60 border-none focus:ring-2 focus:ring-white/50"
        />
      </form>

      {open && query && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-md shadow-lg z-50">
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-gray-500 text-sm">
              <Loader2 className="animate-spin" size={16} />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-gray-500 text-sm">No results found</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {results.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  onClick={() => {
                    router.push(r.href);
                    setOpen(false);
                  }}
                  className="p-3 text-sm cursor-pointer hover:bg-gray-100"
                >
                  <span className="font-medium">{r.type}:</span> {r.label}
                </li>
              ))}
              <li
                className="p-3 text-sm text-blue-600 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
                  setOpen(false);
                }}
              >
                View all results →
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
