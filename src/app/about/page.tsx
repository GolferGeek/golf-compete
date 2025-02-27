import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About GolfCompete",
  description: "Learn more about GolfCompete, our mission, and our team.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl font-bold mb-8 text-center">About GolfCompete</h1>
      
      <div className="max-w-3xl mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-4">
            GolfCompete aims to become the definitive digital platform for competitive golfers, 
            creating a community where competition drives improvement and improvement fuels competitive success.
          </p>
          <p className="text-lg text-muted-foreground">
            By connecting players, coaches, and courses, we&apos;re building an ecosystem that elevates 
            the entire golfing experience.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-lg text-muted-foreground mb-4">
            GolfCompete was born from a passion for golf and a desire to help golfers of all levels 
            improve their game through structured competition and targeted practice.
          </p>
          <p className="text-lg text-muted-foreground">
            Our team of golf enthusiasts and technology experts came together to create a platform 
            that addresses the unique needs of serious golfers who want to take their game to the next level.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
          <p className="text-lg text-muted-foreground mb-4">
            We believe that improvement in golf comes from a combination of structured practice, 
            competitive play, and professional guidance. GolfCompete brings these elements together 
            in one seamless platform.
          </p>
          <p className="text-lg text-muted-foreground">
            Our FedEx Cup-style competitions, detailed performance tracking, and coaching integration 
            create a comprehensive ecosystem for golfers who are serious about improving their game.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Join Us</h2>
          <p className="text-lg text-muted-foreground">
            Whether you&apos;re a dedicated amateur looking to improve, a golf professional expanding your 
            coaching services, or a course wanting to increase engagement, GolfCompete has something 
            for you. Join us today and elevate your golf experience.
          </p>
        </section>
      </div>
    </div>
  );
} 