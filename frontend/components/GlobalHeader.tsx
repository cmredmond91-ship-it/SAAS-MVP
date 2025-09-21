"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import GlobalSearch from "./GlobalSearch";

type Role = "admin" | "manager" | "tech" | "dispatcher" | "employee";

interface ReleaseFlags {
  show_crm?: boolean;
}

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [releaseFlags, setReleaseFlags] = useState<ReleaseFlags>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const getSessionAndRole = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, release_flags")
          .eq("id", data.session.user.id)
          .single();

        if (profile?.role) setRole(profile.role as Role);
        if (profile?.release_flags) setReleaseFlags(profile.release_flags);
      }
      setReady(true);
    };

    getSessionAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("role, release_flags")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => {
              if (data?.role) setRole(data.role as Role);
              if (data?.release_flags) setReleaseFlags(data.release_flags);
            });
        } else {
          setRole(null);
          setReleaseFlags({});
        }
        setReady(true);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!ready) {
    return (
      <nav className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-600 to-sky-400 shadow-md h-14" />
    );
  }

  if (!session) {
    return (
      <nav className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-600 to-sky-400 shadow-md h-14 flex items-center">
        <div className="mx-auto max-w-7xl px-4 text-white font-semibold text-lg">
          Welcome
        </div>
      </nav>
    );
  }

  // ✅ SEO-first nav
  const navItems: any[] = [
    { name: "Dashboard", href: "/dashboard", roles: ["admin", "manager", "employee"] },
    {
      name: "SEO",
      roles: ["admin", "manager"],
      children: [
        { name: "Overview", href: "/dashboard/seo" },
        { name: "Keywords", href: "/dashboard/seo/keywords" },
        { name: "Content", href: "/dashboard/seo/content" },
        { name: "Reports", href: "/dashboard/seo/reports" },
      ],
    },
    { name: "Billing", href: "/dashboard/billing", roles: ["admin", "manager"] },
  ];

  // 🚀 Add CRM section only if flag is enabled
  if (releaseFlags.show_crm) {
    navItems.push({
      name: "CRM",
      roles: ["admin", "manager"],
      children: [
        { name: "Customers", href: "/dashboard/customers" },
        { name: "Jobs", href: "/dashboard/jobs" },
        { name: "Invoices", href: "/dashboard/invoices" },
      ],
    });
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems
        .filter((item) => (role ? item.roles.includes(role) : false))
        .map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.children) {
            return (
              <div key={item.name} className="relative group">
                <span
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    active
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.name}
                  <ChevronDown size={14} />
                </span>
                {/* Desktop dropdown */}
                <div className="absolute hidden group-hover:block bg-white shadow-lg mt-1 rounded-md">
                  {item.children.map((child: any) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        pathname === child.href ? "font-semibold bg-gray-50" : ""
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
                {/* Mobile dropdown */}
                {mobile && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-1 text-sm ${
                          pathname === child.href
                            ? "text-indigo-600 font-semibold"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              } ${mobile ? "w-full text-left" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          );
        })}
    </>
  );

  return (
    <nav className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-600 to-sky-400 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between gap-4">
        {/* Desktop Nav + Search */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <NavLinks />
          <div className="ml-auto">
            <GlobalSearch />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/20"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="hidden md:block px-3 py-1.5 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 shadow"
        >
          Logout
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-indigo-700/95 px-2 pb-3 space-y-3 shadow-lg">
          <GlobalSearch />
          <NavLinks mobile />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}













