import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div 
      className="flex flex-col min-h-screen bg-[#0F291B] dark:bg-[#07140D]"
      style={{ zoom: "1.1" }}
    >
      <Navbar />
      <Hero />
      
      {/* Additional sections can be placed here as we build them */}
    </div>
  );
}
