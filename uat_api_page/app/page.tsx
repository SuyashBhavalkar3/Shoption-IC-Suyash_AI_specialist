"use client";

import { useEffect, useState } from "react";

type FaqItem = {
  id?: string | number;
  question?: string;
  answer?: string;
  [key: string]: any;
};

type ApiResponse = {
  data?: FaqItem[];
  error?: string;
  [key: string]: any;
};

export default function Home() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/faqs");
        const result = (await response.json()) as ApiResponse | FaqItem[];

        if (!response.ok) {
          const errorMessage =
            typeof result === "object" && result !== null && "error" in result
              ? (result as ApiResponse).error
              : "Unable to load FAQs.";
          throw new Error(errorMessage || "Unable to load FAQs.");
        }

        if (Array.isArray(result)) {
          setFaqs(result);
        } else if (Array.isArray(result.data)) {
          setFaqs(result.data);
        } else if (Array.isArray(result.faqs)) {
          setFaqs(result.faqs);
        } else if (result && typeof result === "object" && Array.isArray(result.message?.data?.faqs)) {
          setFaqs(result.message.data.faqs);
        } else if (result && typeof result === "object" && Array.isArray(result.message?.faqs)) {
          setFaqs(result.message.faqs);
        } else {
          setFaqs([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/20">
        <h1 className="text-3xl font-semibold">Shoption FAQ fetcher</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
          Fetching FAQs from the UAT API via a secure server-side proxy using env-based credentials.
        </p>

        <div className="mt-8 space-y-6">
          {loading && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200">
              Loading FAQs...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && faqs.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700 dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-200">
              No FAQs available yet.
            </div>
          )}

          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <article key={faq.id ?? index} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {faq.question ?? faq.title ?? `FAQ #${index + 1}`}
                </h2>
                <div className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
                  {faq.answer ? (
                    <div
                      className="prose prose-slate dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  ) : faq.description ? (
                    <p>{faq.description}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(faq, null, 2)}</pre>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
