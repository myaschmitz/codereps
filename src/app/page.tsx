"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import ProblemInput from "@/components/ProblemInput";
import ReviewList from "@/components/ReviewList";
import Stats from "@/components/Stats";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProblemAdded = () => {
    // Trigger refresh of review list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              CodeReps{" "}
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                SRS
              </span>
            </h1>
            <p className="mt-2 text-neutral-600">
              Spaced repetition for deliberate practice
            </p>
          </div>
          <Link
            href="/settings"
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6" />
          </Link>
        </header>

        {/* Stats */}
        <Stats key={refreshKey} />

        {/* Problem Input */}
        <div className="mb-8">
          <ProblemInput onProblemAdded={handleProblemAdded} />
        </div>

        {/* Review List */}
        <ReviewList refreshKey={refreshKey} onStatsChange={handleProblemAdded} />
      </div>
    </main>
  );
}
