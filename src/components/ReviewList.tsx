"use client";

import { useState, useEffect } from "react";
import { reviewService } from "@/services/ReviewService";
import { ReviewItem } from "@/domain/ReviewQueue";
import { ChevronDown, ChevronRight } from "lucide-react";
import ReviewCard from "./ReviewCard";

interface ReviewListProps {
  refreshKey?: number;
  onStatsChange: () => void;
}

export default function ReviewList({
  refreshKey,
  onStatsChange,
}: ReviewListProps) {
  const [todaysReviews, setTodaysReviews] = useState<ReviewItem[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReviewItem[]>([]);
  const [showAllTodays, setShowAllTodays] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [refreshKey]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const [todays, upcoming] = await Promise.all([
        reviewService.getTodaysReviews(),
        reviewService.getUpcomingReviews(),
      ]);
      setTodaysReviews(todays);
      setUpcomingReviews(upcoming);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (problemId: string) => {
    try {
      await reviewService.archiveProblem(problemId);
      await loadReviews();
      onStatsChange();
    } catch (error) {
      console.error("Error archiving problem:", error);
    }
  };

  const handleDelete = async (problemId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this problem? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await reviewService.deleteProblem(problemId);
      await loadReviews();
      onStatsChange();
    } catch (error) {
      console.error("Error deleting problem:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const REVIEW_LIMIT = 3;
  const visibleTodays = showAllTodays
    ? todaysReviews
    : todaysReviews.slice(0, REVIEW_LIMIT);
  const hiddenTodaysCount = Math.max(0, todaysReviews.length - REVIEW_LIMIT);

  return (
    <div className="space-y-6">
      {/* Today's Reviews */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Today&apos;s Reviews{" "}
            <span className="text-neutral-400 dark:text-neutral-500">({todaysReviews.length})</span>
          </h2>
          {todaysReviews.some((r) => r.isOverdue) && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {todaysReviews.filter((r) => r.isOverdue).length} overdue
            </span>
          )}
        </div>

        {todaysReviews.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
            No reviews due today. Great job! 🎉
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleTodays.map((review) => (
                <ReviewCard
                  key={review.problem.id}
                  review={review}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {hiddenTodaysCount > 0 && (
              <button
                onClick={() => setShowAllTodays(!showAllTodays)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {showAllTodays ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Show {hiddenTodaysCount} more review
                    {hiddenTodaysCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Upcoming Reviews */}
      {upcomingReviews.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="mb-4 flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Upcoming Reviews{" "}
              <span className="text-neutral-400 dark:text-neutral-500">
                ({upcomingReviews.length})
              </span>
            </h2>
            {showUpcoming ? (
              <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            )}
          </button>

          {showUpcoming && (
            <div className="space-y-3">
              {upcomingReviews.map((review) => (
                <ReviewCard
                  key={review.problem.id}
                  review={review}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
