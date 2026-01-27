import { Problem } from "./models/Problem";
import { ProblemRepository } from "./ProblemRepository";
import { startOfDay, isAfter, isBefore, isSameDay } from "date-fns";

export interface ReviewItem {
  problem: Problem;
  daysOverdue: number;
  isOverdue: boolean;
  isToday: boolean;
}

/**
 * ReviewQueue - DEEP MODULE
 *
 * Manages the review queue with smart sorting and filtering.
 * Hides complexity of date comparisons and priority calculations.
 */
export class ReviewQueue {
  constructor(private repository: ProblemRepository) {}

  /**
   * Get today's reviews (due today or overdue)
   * Sorted by due date (oldest first)
   */
  async getTodaysReviews(): Promise<ReviewItem[]> {
    const problems = await this.repository.getAll();
    const today = startOfDay(new Date());

    const dueProblems = problems
      .filter((p) => {
        const dueDate = startOfDay(p.nextReviewDate);
        return isBefore(dueDate, today) || isSameDay(dueDate, today);
      })
      .map((p) => this.createReviewItem(p, today));

    // Sort by due date (oldest/most overdue first)
    return dueProblems.sort((a, b) => {
      const dateA = startOfDay(a.problem.nextReviewDate);
      const dateB = startOfDay(b.problem.nextReviewDate);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Get upcoming reviews (future)
   * Sorted by due date (soonest first)
   */
  async getUpcomingReviews(): Promise<ReviewItem[]> {
    const problems = await this.repository.getAll();
    const today = startOfDay(new Date());

    const upcomingProblems = problems
      .filter((p) => {
        const dueDate = startOfDay(p.nextReviewDate);
        return isAfter(dueDate, today);
      })
      .map((p) => this.createReviewItem(p, today));

    // Sort by due date (soonest first)
    return upcomingProblems.sort((a, b) => {
      const dateA = startOfDay(a.problem.nextReviewDate);
      const dateB = startOfDay(b.problem.nextReviewDate);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Get count of overdue reviews
   */
  async getOverdueCount(): Promise<number> {
    const todaysReviews = await this.getTodaysReviews();
    return todaysReviews.filter((r) => r.isOverdue).length;
  }

  /**
   * Get all reviews (today + upcoming)
   */
  async getAllReviews(): Promise<ReviewItem[]> {
    const [todays, upcoming] = await Promise.all([
      this.getTodaysReviews(),
      this.getUpcomingReviews(),
    ]);

    return [...todays, ...upcoming];
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Create a ReviewItem with calculated metadata
   */
  private createReviewItem(problem: Problem, today: Date): ReviewItem {
    const dueDate = startOfDay(problem.nextReviewDate);
    const isToday = isSameDay(dueDate, today);
    const isOverdue = isBefore(dueDate, today);

    const daysOverdue = isOverdue
      ? Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      problem,
      daysOverdue,
      isOverdue,
      isToday,
    };
  }
}
