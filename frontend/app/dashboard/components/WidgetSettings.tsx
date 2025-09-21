"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Props {
  visible: Record<string, boolean>;
  onToggle: (w: string) => void;
}

export default function WidgetSettings({ visible, onToggle }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(profile?.role || null);
      }
    };
    fetchRole();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings size={16} />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuCheckboxItem
          checked={visible.profile}
          onCheckedChange={() => onToggle("profile")}
        >
          Show Profile
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visible.metrics}
          onCheckedChange={() => onToggle("metrics")}
        >
          Show Metrics
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visible.activity}
          onCheckedChange={() => onToggle("activity")}
        >
          Show Activity Feed
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visible.employees}
          onCheckedChange={() => onToggle("employees")}
        >
          Show Employee Management
        </DropdownMenuCheckboxItem>

        {/* Divider */}
        <div className="border-t my-2" />

        {/* Admin/Manager-only link */}
        {(role === "admin" || role === "manager") && (
          <DropdownMenuItem onClick={() => router.push("/dashboard/audit-log")}>
            🛡️ View Audit Log
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


