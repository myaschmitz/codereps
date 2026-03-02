import { Problem, ReturnPriority, ReviewRecord } from "./models/Problem";
import { addDays, startOfDay } from "date-fns";

/**
 * SRSScheduler - DEEP MODULE
 *
 * Handles all spaced repetition scheduling logic.
 * Simple interface hides complex interval calculations.
 */
export class SRSScheduler {
  private readonly MAX_INTERVAL_DAYS = 90;
  private readonly AUTO_ARCHIVE_THRESHOLD = 3; // Archive after 3 low-priority reviews

  /**
   * Calculate the next review date based on priority and review history
   */
  scheduleNextReview(problem: Problem, priority: ReturnPriority, fromDate?: Date): Date {
    const reviewCount = problem.reviewHistory.length;
    const baseInterval = this.getBaseInterval(priority);
    const multiplier = this.getMultiplier(reviewCount, priority);
    const intervalDays = Math.min(
      Math.round(baseInterval * multiplier),
      this.MAX_INTERVAL_DAYS,
    );

    const baseDate = fromDate ? startOfDay(fromDate) : startOfDay(new Date());
    return startOfDay(addDays(baseDate, intervalDays));
  }

  /**
   * Determine if a problem should be auto-archived
   * (based on low-priority review count — ratings 1 or 2)
   */
  shouldArchive(problem: Problem): boolean {
    const lowPriorityCount = this.countLowPriorityReviews(problem.reviewHistory);
    return lowPriorityCount >= this.AUTO_ARCHIVE_THRESHOLD;
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private getBaseInterval(priority: ReturnPriority): number {
    const intervals: Record<ReturnPriority, number> = {
      1: 90,
      2: 30,
      3: 14,
      4: 7,
      5: 2,
    };
    return intervals[priority];
  }

  /**
   * Get multiplier based on review count.
   * Only applies to ratings 3-5 (higher urgency). Ratings 1-2 stay fixed.
   */
  private getMultiplier(reviewCount: number, priority: ReturnPriority): number {
    if (priority <= 2) return 1;

    if (reviewCount <= 2) return 1;
    if (reviewCount <= 4) return 1.5;
    return 2;
  }

  /**
   * Count reviews with low return priority (1 or 2)
   */
  private countLowPriorityReviews(reviewHistory: ReviewRecord[]): number {
    return reviewHistory.filter((r) => r.priority <= 2).length;
  }
}
