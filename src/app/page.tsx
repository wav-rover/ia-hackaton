import Link from "next/link";

const features = [
  { title: "Batteries included", body: "Database, auth and UI wired together and ready to run." },
  { title: "Type-safe", body: "End-to-end TypeScript with strict mode on from the first commit." },
  { title: "Yours to shape", body: "Plain Next.js App Router — no magic, edit anything." },
];

// Marketing landing page. The CTA points at /account, which your auth setup
// redirects to the right sign-in page; adjust the links to taste.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600">
          Built with Stackr
        </span>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Ship your idea, faster.
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          A runnable full-stack Next.js starter with the boring parts already done — so you can
          build the part that matters.
        </p>
        <div className="flex gap-3">
          <Link
            href="/account"
            className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Get started
          </Link>
          <a
            href="#features"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100"
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 p-6">
              <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
              <p className="text-sm text-gray-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
