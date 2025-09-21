"use client";

export default function TestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🚀 Tailwind is Working!
        </h1>
        <p className="text-gray-600 mb-6">
          If you see this box styled with colors, rounded corners, and shadows,
          TailwindCSS is installed correctly.
        </p>
        <button className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
          Click Me
        </button>
      </div>
    </main>
  );
}

