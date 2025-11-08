import { useState } from "react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function AdminMigration() {
  const [status, setStatus] = useState<"idle" | "checking" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any>(null);

  const checkMigrationStatus = async () => {
    setStatus("checking");
    setMessage("Checking migration status...");
    
    try {
      const res = await fetch("/api/admin/check-migration");
      const data = await res.json();
      
      if (data.migrationComplete) {
        setStatus("success");
        setMessage("✅ Migration already completed! All columns exist.");
        setDetails(data);
      } else {
        setStatus("idle");
        setMessage(`⚠️ Migration needed. Missing columns: ${data.missingColumns.join(", ")}`);
        setDetails(data);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(`Error checking migration: ${error.message}`);
    }
  };

  const runMigration = async () => {
    setStatus("running");
    setMessage("Running migration... This may take a few seconds.");
    
    try {
      const res = await fetch("/api/admin/run-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        setMessage("🎉 Migration completed successfully!");
        setDetails(data.details);
      } else {
        setStatus("error");
        setMessage(`Migration failed: ${data.error}`);
        setDetails(data);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(`Error running migration: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔧 Database Migration Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Run the featured listings migration to fix API errors
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Migration Status
          </h2>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              status === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200" :
              status === "error" ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200" :
              status === "running" || status === "checking" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200" :
              "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
            }`}>
              <div className="flex items-center gap-3">
                {status === "success" && <CheckCircle className="w-5 h-5" />}
                {status === "error" && <XCircle className="w-5 h-5" />}
                {(status === "running" || status === "checking") && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === "idle" && <AlertCircle className="w-5 h-5" />}
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}

          {/* Details */}
          {details && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={checkMigrationStatus}
              disabled={status === "checking" || status === "running"}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {status === "checking" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Migration Status"
              )}
            </button>

            <button
              onClick={runMigration}
              disabled={status === "checking" || status === "running"}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Migration...
                </>
              ) : (
                "Run Migration Now"
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What This Does
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>✅ Adds featured listing columns to the database</li>
            <li>✅ Creates indexes for better performance</li>
            <li>✅ Fixes all 500 API errors</li>
            <li>✅ Enables the featured carousel on homepage</li>
            <li>✅ Safe to run multiple times (won't break anything)</li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click "Check Migration Status" to see if migration is needed</li>
            <li>If migration is needed, click "Run Migration Now"</li>
            <li>Wait for success message</li>
            <li>Refresh the homepage - errors should be gone!</li>
            <li>Test creating and featuring a listing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
