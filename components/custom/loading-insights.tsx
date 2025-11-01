export function LoadingInsights() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
