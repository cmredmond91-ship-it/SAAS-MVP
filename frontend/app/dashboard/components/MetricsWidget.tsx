"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Profile {
  id: string;
  role: string;
  employment_type: string;
}

export default function MetricsWidget() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, employment_type");

      if (!error && data) {
        setProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  // 📊 Compute stats
  const total = profiles.length;
  const employees = profiles.filter(
    (p) => p.employment_type === "employee"
  ).length;
  const contractors = profiles.filter(
    (p) => p.employment_type === "contractor"
  ).length;

  const roleCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  });

  const chartData = Object.entries(roleCounts).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>📊 Team Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-gray-500">Loading metrics...</p>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total" value={total} color="bg-indigo-50" />
              <StatBox
                label="Employees"
                value={employees}
                color="bg-green-50"
              />
              <StatBox
                label="Contractors"
                value={contractors}
                color="bg-orange-50"
              />
              <StatBox
                label="Roles"
                value={Object.keys(roleCounts).length}
                color="bg-blue-50"
              />
            </div>

            {/* Role Distribution Chart */}
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center mt-12">
                  No role data available
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// 📦 Small helper component for stats
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`p-3 rounded-lg ${color} text-center`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}


