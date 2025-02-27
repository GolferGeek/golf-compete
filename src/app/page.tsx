import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Elevate Your Golf Game
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            GolfCompete is a comprehensive platform designed to transform how golfers compete, 
            track progress, and enhance their skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              title="Competition Management"
              description="FedEx Cup-style season-long competitions with points tracking, standalone events, and real-time scorecards."
              icon="🏆"
              link="/competitions"
            />
            <FeatureCard 
              title="Performance Tracking"
              description="Multiple bag configurations with separate handicap tracking, course-specific analytics, and comprehensive scoring history."
              icon="🎯"
              link="/tracking"
            />
            <FeatureCard 
              title="Improvement Framework"
              description="Structured practice planning based on identified weaknesses, pre/post routines, and issue logging."
              icon="📈"
              link="/improvement"
            />
            <FeatureCard 
              title="Professional Coaching"
              description="Direct connection to golf professionals with micro-consultation system and personalized feedback."
              icon="👨‍🏫"
              link="/coaching"
            />
            <FeatureCard 
              title="Course Integration"
              description="Detailed course database with comprehensive information and course-hosted daily competitions."
              icon="🏌️"
              link="/courses"
            />
            <FeatureCard 
              title="Course-Initiated Games"
              description="Daily putting and chipping contests set up by course administrators with leaderboards for friendly competition."
              icon="🎮"
              link="/games"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Golf Experience?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Join GolfCompete today and take your game to the next level with our comprehensive platform.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

function FeatureCard({ title, description, icon, link }: FeatureCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="text-4xl mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Link href={link} className="text-sm text-primary hover:underline">
          Learn more →
        </Link>
      </CardFooter>
    </Card>
  );
}
