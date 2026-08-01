import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navbar />
      
      {/* Main content area */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
            Welcome to GBRU V2
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            The header section is successfully implemented and responsive. We are ready to build the next sections of the website.
          </p>
        </div>
      </main>
    </div>
  );
}
