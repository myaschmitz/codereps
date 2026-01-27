import { Problem, Difficulty, ReviewRecord } from "./models/Problem";
import { addDays, startOfDay } from "date-fns";

/**
 * SRSScheduler - DEEP MODULE
 *
 * Handles all spaced repetition scheduling logic.
 * Simple interface hides complex interval calculations.
 */
export class SRSScheduler {
  private readonly MAX_INTERVAL_DAYS = 90;
  private readonly AUTO_ARCHIVE_THRESHOLD = 3; // Archive after 3 successful reviews

  /**
   * Calculate the next review date based on difficulty and review history
   * This is the main public interface - simple input/output
   */
  scheduleNextReview(problem: Problem, difficulty: Difficulty): Date {
    const reviewCount = problem.reviewHistory.length;
    const baseInterval = this.getBaseInterval(difficulty);
    const multiplier = this.getMultiplier(reviewCount, difficulty);
    const intervalDays = Math.min(
      baseInterval * multiplier,
      this.MAX_INTERVAL_DAYS,
    );

    // Always schedule from today (start of day) to avoid time-of-day issues
    return startOfDay(addDays(new Date(), intervalDays));
  }

  /**
   * Determine if a problem should be auto-archived
   * (based on successful review count)
   */
  shouldArchive(problem: Problem): boolean {
    const successfulReviews = this.countSuccessfulReviews(
      problem.reviewHistory,
    );
    return successfulReviews >= this.AUTO_ARCHIVE_THRESHOLD;
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Get base interval in days for initial review
   */
  private getBaseInterval(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY:
        return this.MAX_INTERVAL_DAYS; // Archive essentially
      case Difficulty.MEDIUM:
        return 7;
      case Difficulty.HARD:
        return 3;
      case Difficulty.DIDNT_GET:
        return 1;
    }
  }

  /**
   * Get multiplier based on review count
   * Progression: 1x → 2x → 2x → 3x → 3x...
   */
  private getMultiplier(reviewCount: number, difficulty: Difficulty): number {
    // If marked EASY or DIDNT_GET, don't apply multiplier
    if (difficulty === Difficulty.EASY || difficulty === Difficulty.DIDNT_GET) {
      return 1;
    }

    // For MEDIUM and HARD, apply multiplier based on successful review count
    if (reviewCount === 0) return 1;
    if (reviewCount === 1) return 1;
    if (reviewCount === 2) return 2;
    if (reviewCount === 3) return 2;
    return 3; // 4+ reviews
  }

  /**
   * Count successful reviews (EASY or MEDIUM)
   */
  private countSuccessfulReviews(reviewHistory: ReviewRecord[]): number {
    return reviewHistory.filter(
      (r) =>
        r.difficulty === Difficulty.EASY || r.difficulty === Difficulty.MEDIUM,
    ).length;
  }
}
