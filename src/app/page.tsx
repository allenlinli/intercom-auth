"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Intercom OAuth Demo
          </h1>
          <p className="text-gray-600">
            Connect your Intercom account to see the OAuth authorization code
            flow in action.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <a
          href="/api/auth/intercom"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect with Intercom
        </a>

        <div className="text-xs text-gray-400 space-y-1">
          <p>This will redirect you to Intercom to authorize access.</p>
          <p>Your token is stored in an HTTP-only cookie and never exposed to JavaScript.</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
