import {
  Problem,
  ReturnPriority,
  createProblem,
  ReviewRecord,
} from "../domain/models/Problem";
import { TodoItem } from "../domain/models/TodoItem";
import { ProblemRepository } from "../domain/ProblemRepository";
import { SRSScheduler } from "../domain/SRSScheduler";
import { ReviewQueue, ReviewItem } from "../domain/ReviewQueue";
import { todoService } from "./TodoService";

/**
 * Map old difficulty strings to new priority values (for v2 import migration)
 */
function migrateDifficultyToPriority(difficulty: string): ReturnPriority {
  const mapping: Record<string, ReturnPriority> = {
    EASY: 1,
    MEDIUM: 3,
    HARD: 5,
    DIDNT_GET: 5,
  };
  return mapping[difficulty] ?? 3;
}

/**
 * ReviewService - APPLICATION SERVICE (THIN)
 *
 * Orchestrates domain modules to perform use cases.
 * Doesn't contain business logic - delegates to deep modules.
 */
export class ReviewService {
  private repository: ProblemRepository;
  private scheduler: SRSScheduler;
  private queue: ReviewQueue;

  constructor() {
    this.repository = new ProblemRepository();
    this.scheduler = new SRSScheduler();
    this.queue = new ReviewQueue(this.repository);
  }

  /**
   * Add a new problem or find existing
   */
  async addProblem(
    name: string,
    number?: number,
    reviewDate?: Date,
  ): Promise<Problem> {
    // Check if problem already exists
    const existing = await this.repository.existsByName(name);
    if (existing) {
      return existing;
    }

    const problem = createProblem(name, number);

    // Use custom review date if provided, otherwise use today
    if (reviewDate) {
      problem.nextReviewDate = reviewDate;
    }

    await this.repository.save(problem);
    return problem;
  }

  /**
   * Record a review and calculate next review date
   */
  async recordReview(
    problemId: string,
    priority: ReturnPriority,
    reviewDate?: Date,
    notes?: string,
  ): Promise<Problem> {
    const problem = await this.repository.findById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }

    // Add review to history
    const review: ReviewRecord = {
      date: reviewDate || new Date(),
      priority,
      ...(notes && { notes }),
    };
    problem.reviewHistory.push(review);

    // Calculate next review date
    problem.nextReviewDate = this.scheduler.scheduleNextReview(
      problem,
      priority,
    );

    // Auto-archive if meets threshold
    if (this.scheduler.shouldArchive(problem)) {
      problem.archived = true;
    }

    await this.repository.save(problem);
    return problem;
  }

  /**
   * Search problems by name (for autocomplete)
   */
  async searchProblems(query: string): Promise<Problem[]> {
    if (!query.trim()) {
      return [];
    }
    return await this.repository.findByNamePattern(query);
  }

  /**
   * Get all problems for display
   */
  async getAllProblems(includeArchived = false): Promise<Problem[]> {
    return await this.repository.getAll(includeArchived);
  }

  /**
   * Get only archived problems
   */
  async getArchivedProblems(): Promise<Problem[]> {
    return await this.repository.getArchived();
  }

  /**
   * Get review queue (today's reviews)
   */
  async getTodaysReviews(): Promise<ReviewItem[]> {
    return await this.queue.getTodaysReviews();
  }

  /**
   * Get upcoming reviews
   */
  async getUpcomingReviews(): Promise<ReviewItem[]> {
    return await this.queue.getUpcomingReviews();
  }

  /**
   * Get all reviews
   */
  async getAllReviews(): Promise<ReviewItem[]> {
    return await this.queue.getAllReviews();
  }

  /**
   * Archive a problem
   */
  async archiveProblem(problemId: string): Promise<void> {
    await this.repository.archive(problemId);
  }

  /**
   * Unarchive a problem
   */
  async unarchiveProblem(problemId: string): Promise<void> {
    await this.repository.unarchive(problemId);
  }

  /**
   * Delete a problem
   */
  async deleteProblem(problemId: string): Promise<void> {
    await this.repository.delete(problemId);
  }

  /**
   * Get problem by ID
   */
  async getProblem(problemId: string): Promise<Problem | null> {
    return await this.repository.findById(problemId);
  }

  /**
   * Update a review record (priority, note)
   * If editing the most recent review, recalculates nextReviewDate
   */
  async updateReviewRecord(
    problemId: string,
    reviewIndex: number,
    updates: {
      date?: Date;
      priority?: ReturnPriority;
      note?: string;
    }
  ): Promise<Problem> {
    const problem = await this.repository.findById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }

    if (reviewIndex < 0 || reviewIndex >= problem.reviewHistory.length) {
      throw new Error("Review index out of bounds");
    }

    const review = problem.reviewHistory[reviewIndex];
    const isLastReview = reviewIndex === problem.reviewHistory.length - 1;

    // Update fields if provided
    if (updates.date !== undefined) {
      review.date = updates.date;
    }
    if (updates.priority !== undefined) {
      review.priority = updates.priority;
    }
    if (updates.note !== undefined) {
      if (updates.note.trim()) {
        review.notes = updates.note.trim();
      } else {
        delete review.notes;
      }
    }

    // If this is the most recent review and date/priority changed, recalculate next review date
    if (isLastReview && (updates.date !== undefined || updates.priority !== undefined)) {
      problem.nextReviewDate = this.scheduler.scheduleNextReview(
        problem,
        review.priority,
        review.date
      );
    }

    await this.repository.save(problem);
    return problem;
  }

  /**
   * Reset the database by deleting all problems and todos
   */
  async resetDatabase(): Promise<void> {
    await this.repository.deleteAll();
    await todoService.deleteAll();
  }

  /**
   * Export all data as a JSON string with metadata
   */
  async exportData(): Promise<string> {
    const problems = await this.repository.getAll(true);
    const todoItems = await todoService.exportData();

    const exportPayload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      data: { problems, todoItems },
    };

    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Import data from a JSON string, validating structure
   * Handles both v2 (difficulty) and v3 (priority) formats
   * Returns the number of problems imported
   */
  async importData(jsonString: string): Promise<number> {
    const parsed = JSON.parse(jsonString);

    if (!parsed.version || !parsed.data?.problems) {
      throw new Error("Invalid export file format");
    }

    const isV2 = parsed.version < 3;

    const problems = parsed.data.problems.map((p: Problem) => ({
      ...p,
      nextReviewDate: new Date(p.nextReviewDate),
      createdAt: new Date(p.createdAt),
      reviewHistory: p.reviewHistory.map((r: any) => {
        const record: ReviewRecord = {
          date: new Date(r.date),
          priority: isV2 && r.difficulty !== undefined
            ? migrateDifficultyToPriority(r.difficulty)
            : r.priority,
          ...(r.notes && { notes: r.notes }),
        };
        return record;
      }),
    }));

    await this.repository.importMany(problems);

    // Import todos if present (version 2+)
    if (parsed.data.todoItems) {
      await todoService.importData(parsed.data.todoItems);
    }

    return problems.length;
  }
}

// Singleton instance
export const reviewService = new ReviewService();
