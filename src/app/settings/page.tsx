"use client";

import { useState, useRef } from "react";
import { reviewService } from "@/services/ReviewService";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type Status = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5 text-primary-600">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Settings
            </h1>
          </div>
        </header>

        {/* Status Message */}
        {status && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${
              status.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
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
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Data Management
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Export, import, or reset your problem data
            </p>
          </div>

          <div className="divide-y divide-neutral-100">
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
                      className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Reset
                </button>
              )}
            </SettingsRow>
          </div>
        </section>
      </div>
    </main>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  iconColor: "blue" | "green" | "red";
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
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${colorClasses[iconColor]}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
