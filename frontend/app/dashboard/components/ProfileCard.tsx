"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function ProfileCard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  if (!user) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>👤 Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>👤 Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {/* Avatar Circle */}
        <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
          {user.email?.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div>
          <p className="font-medium">{user.email}</p>
          <p className="text-sm text-gray-500">
            User ID: {user.id.slice(0, 8)}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
