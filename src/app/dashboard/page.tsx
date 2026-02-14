"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminData {
  type: string;
  id: string;
  name: string;
  email: string;
  avatar?: {
    image_url: string;
  };
  app?: {
    name: string;
    timezone: string;
    region: string;
  };
  [key: string]: unknown;
}

export default function Dashboard() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(setAdmin)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!admin) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Intercom OAuth Demo
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Disconnect
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            {admin.avatar?.image_url && (
              <img
                src={admin.avatar.image_url}
                alt={admin.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {admin.name}
              </h2>
              <p className="text-gray-600">{admin.email}</p>
            </div>
          </div>

          {admin.app && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Workspace</span>
                <p className="font-medium text-gray-900">{admin.app.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Region</span>
                <p className="font-medium text-gray-900">{admin.app.region}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full px-6 py-4 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
          >
            Raw API Response
            <span className="text-gray-400">{showRaw ? "Hide" : "Show"}</span>
          </button>
          {showRaw && (
            <pre className="px-6 pb-4 text-xs text-gray-600 overflow-auto max-h-96">
              {JSON.stringify(admin, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
