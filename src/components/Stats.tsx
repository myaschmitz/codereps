"use client";

import { useState, useEffect } from "react";
import { reviewService } from "@/services/ReviewService";
import { TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

export default function Stats() {
  const [stats, setStats] = useState({
    totalProblems: 0,
    dueToday: 0,
    completedReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [allProblems, todaysReviews] = await Promise.all([
        reviewService.getAllProblems(false),
        reviewService.getTodaysReviews(),
      ]);

      const totalReviews = allProblems.reduce(
        (sum, p) => sum + p.reviewHistory.length,
        0,
      );

      setStats({
        totalProblems: allProblems.length,
        dueToday: todaysReviews.length,
        completedReviews: totalReviews,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Total Problems"
        value={stats.totalProblems}
        color="blue"
      />
      <StatCard
        icon={<Calendar className="h-5 w-5" />}
        label="Due Today"
        value={stats.dueToday}
        color="orange"
      />
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        label="Total Reviews"
        value={stats.completedReviews}
        color="green"
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "orange" | "green";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-neutral-900">{value}</div>
          <div className="text-sm text-neutral-600">{label}</div>
        </div>
      </div>
    </div>
  );
}
