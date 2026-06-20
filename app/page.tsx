import { CoursesSection } from "@/components/CoursesSection";
import { Footer } from "@/components/Footer";
import { ForumsSection } from "@/components/ForumsSection";
import { Hero } from "@/components/Hero";
import { ProfileSection } from "@/components/ProfileSection";
import { PublicationsSection } from "@/components/PublicationsSection";
import { PublicHeader } from "@/components/PublicHeader";
import { TimelineSection } from "@/components/TimelineSection";

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main>
        <Hero />
        <ProfileSection />
        <TimelineSection />
        <CoursesSection />
        <ForumsSection />
        <PublicationsSection />
      </main>
      <Footer />
    </>
  );
}
