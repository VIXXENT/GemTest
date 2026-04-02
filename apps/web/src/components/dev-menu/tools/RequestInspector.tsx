/**
 * Request inspector panel showing the last N tRPC
 * requests. Currently renders an empty state shell.
 * Actual request capture requires a tRPC link
 * middleware (planned for a future task).
 */
const RequestInspector = () => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-gray-300">Request Inspector</h3>
    <div
      className="rounded border border-gray-700
        bg-gray-800/50 p-3"
    >
      <p className="text-sm text-gray-500">No requests captured yet.</p>
      <p className="mt-1 text-xs text-gray-600">
        Configure the tRPC inspector link to capture requests. Last 20 entries will be shown here.
      </p>
    </div>
  </div>
)

export { RequestInspector }
