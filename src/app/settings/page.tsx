"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { reviewService } from "@/services/ReviewService";
import { Problem } from "@/domain/models/Problem";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

type Status = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivedProblems, setArchivedProblems] = useState<Problem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);

  const loadArchivedProblems = useCallback(async () => {
    setIsLoadingArchived(true);
    try {
      const problems = await reviewService.getArchivedProblems();
      setArchivedProblems(problems);
    } catch (error) {
      console.error("Error loading archived problems:", error);
    } finally {
      setIsLoadingArchived(false);
    }
  }, []);

  useEffect(() => {
    if (showArchived && archivedProblems.length === 0) {
      loadArchivedProblems();
    }
  }, [showArchived, archivedProblems.length, loadArchivedProblems]);

  const handleUnarchive = async (problemId: string) => {
    try {
      await reviewService.unarchiveProblem(problemId);
      setArchivedProblems((prev) => prev.filter((p) => p.id !== problemId));
      setStatus({ type: "success", message: "Problem restored successfully" });
    } catch (error) {
      setStatus({
        type: "error",
        message: `Failed to restore problem: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const clearStatus = () => setStatus(null);

  const handleExport = async () => {
    clearStatus();
    try {
      const data = await reviewService.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split("T")[0];
      const link = document.createElement("a");
      link.href = url;
      link.download = `leetcode-srs-backup-${timestamp}.json`;
      link.click();

      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Data exported successfully" });
    } catch (error) {
      setStatus({
        type: "error",
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    clearStatus();
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const count = await reviewService.importData(text);
      setStatus({
        type: "success",
        message: `Successfully imported ${count} problem${count !== 1 ? "s" : ""}`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: `Import failed: ${error instanceof Error ? error.message : "Invalid file format"}`,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    clearStatus();
    try {
      await reviewService.resetDatabase();
      setStatus({ type: "success", message: "Database reset successfully" });
      setShowResetConfirm(false);
      setResetConfirmText("");
    } catch (error) {
      setStatus({
        type: "error",
        message: `Reset failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5 text-primary-600">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Settings
            </h1>
          </div>
        </header>

        {/* Status Message */}
        {status && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${
              status.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Data Management Section */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Data Management
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Export, import, or reset your problem data
            </p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {/* Export */}
            <SettingsRow
              icon={<Download className="h-5 w-5" />}
              iconColor="blue"
              title="Export Data"
              description="Download all your problems and review history as a JSON file"
            >
              <button
                onClick={handleExport}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Export
              </button>
            </SettingsRow>

            {/* Import */}
            <SettingsRow
              icon={<Upload className="h-5 w-5" />}
              iconColor="green"
              title="Import Data"
              description="Restore problems from a previously exported backup file"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Import
              </label>
            </SettingsRow>

            {/* Reset */}
            <SettingsRow
              icon={<Trash2 className="h-5 w-5" />}
              iconColor="red"
              title="Reset Database"
              description="Permanently delete all problems and review history"
            >
              {showResetConfirm ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder='Type "reset database"'
                      className="w-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                      autoFocus
                    />
                    <button
                      onClick={handleReset}
                      disabled={isResetting || resetConfirmText !== "reset database"}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isResetting ? "Resetting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => {
                        setShowResetConfirm(false);
                        setResetConfirmText("");
                      }}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Reset
                </button>
              )}
            </SettingsRow>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Customize how CodeReps looks on your device
            </p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
            <SettingsRow
              icon={<Sun className="h-5 w-5" />}
              iconColor="amber"
              title="Theme"
              description="Select your preferred color scheme"
            >
              <ThemeSelector />
            </SettingsRow>
          </div>
        </section>

        {/* Archived Problems Section */}
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => {
              setShowArchived(!showArchived);
              if (!showArchived) {
                loadArchivedProblems();
              }
            }}
            className="flex w-full items-center justify-between border-b border-neutral-200 px-6 py-4 text-left dark:border-neutral-700"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Archived Problems
                  {archivedProblems.length > 0 && (
                    <span className="ml-2 text-neutral-400 dark:text-neutral-500">
                      ({archivedProblems.length})
                    </span>
                  )}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  View and restore previously archived problems
                </p>
              </div>
            </div>
            {showArchived ? (
              <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            )}
          </button>

          {showArchived && (
            <div className="p-6">
              {isLoadingArchived ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                </div>
              ) : archivedProblems.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                  No archived problems
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                            {problem.name}
                          </h3>
                          {problem.number && (
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                              #{problem.number}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          {problem.reviewHistory.length} review
                          {problem.reviewHistory.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnarchive(problem.id)}
                        className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                        title="Restore problem"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  iconColor: "blue" | "green" | "red" | "amber";
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsRow({
  icon,
  iconColor,
  title,
  description,
  children,
}: SettingsRowProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${colorClasses[iconColor]}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>
      </div>
      <div className="sm:flex-shrink-0">{children}</div>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 sm:w-24 dark:bg-neutral-700" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 sm:w-24 dark:bg-neutral-700" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 sm:w-24 dark:bg-neutral-700" />
      </div>
    );
  }

  const options = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            theme === value
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
