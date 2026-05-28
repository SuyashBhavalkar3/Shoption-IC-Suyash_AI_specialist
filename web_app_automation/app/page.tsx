import ProcessingDashboard from '@/components/ProcessingDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base text-text-base relative overflow-hidden transition-colors duration-300">
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-brand/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="py-12 relative z-10">
        <ProcessingDashboard />
      </div>
    </main>
  );
}
