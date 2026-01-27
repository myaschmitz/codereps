import {
  Problem,
  Difficulty,
  createProblem,
  ReviewRecord,
} from "../domain/models/Problem";
import { ProblemRepository } from "../domain/ProblemRepository";
import { SRSScheduler } from "../domain/SRSScheduler";
import { ReviewQueue, ReviewItem } from "../domain/ReviewQueue";

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
    difficulty: Difficulty,
    reviewDate?: Date,
  ): Promise<Problem> {
    const problem = await this.repository.findById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }

    // Add review to history
    const review: ReviewRecord = {
      date: reviewDate || new Date(),
      difficulty,
    };
    problem.reviewHistory.push(review);

    // Calculate next review date
    problem.nextReviewDate = this.scheduler.scheduleNextReview(
      problem,
      difficulty,
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
   * Reset the database by deleting all problems
   */
  async resetDatabase(): Promise<void> {
    await this.repository.deleteAll();
  }

  /**
   * Export all data as a JSON string with metadata
   */
  async exportData(): Promise<string> {
    const problems = await this.repository.getAll(true);

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { problems },
    };

    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Import data from a JSON string, validating structure
   * Returns the number of problems imported
   */
  async importData(jsonString: string): Promise<number> {
    const parsed = JSON.parse(jsonString);

    if (!parsed.version || !parsed.data?.problems) {
      throw new Error("Invalid export file format");
    }

    const problems = parsed.data.problems.map((p: Problem) => ({
      ...p,
      nextReviewDate: new Date(p.nextReviewDate),
      createdAt: new Date(p.createdAt),
      reviewHistory: p.reviewHistory.map((r) => ({
        ...r,
        date: new Date(r.date),
      })),
    }));

    await this.repository.importMany(problems);
    return problems.length;
  }
}

// Singleton instance
export const reviewService = new ReviewService();
