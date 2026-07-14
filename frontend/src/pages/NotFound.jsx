// src/pages/NotFound.jsx
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <Seo title="Page Not Found" noindex />
      <div className="max-w-md text-center">
        <p className="mb-2 text-sm uppercase tracking-widest text-gray-400">
          Error 404
        </p>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>

        <p className="mb-8 text-gray-500">
          The page you are looking for doesn’t exist or has been moved.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Back to Home
          </a>

          <a
            href="/products"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
          >
            View Products
          </a>
        </div>
      </div>
    </main>
  )
}
