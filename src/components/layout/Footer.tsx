import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t py-8 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">GolfCompete</h3>
            <p className="text-muted-foreground">
              A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-muted-foreground hover:text-primary transition-colors">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                  Courses
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Features</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/competitions" className="text-muted-foreground hover:text-primary transition-colors">
                  Competition Management
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="text-muted-foreground hover:text-primary transition-colors">
                  Performance Tracking
                </Link>
              </li>
              <li>
                <Link href="/improvement" className="text-muted-foreground hover:text-primary transition-colors">
                  Improvement Framework
                </Link>
              </li>
              <li>
                <Link href="/coaching" className="text-muted-foreground hover:text-primary transition-colors">
                  Professional Coaching
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GolfCompete. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 