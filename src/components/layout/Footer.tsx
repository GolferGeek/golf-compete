import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">GolfCompete</h3>
            <p className="text-muted-foreground text-sm">
              Elevate your golf game with competitions, tracking, and professional coaching.
            </p>
          </div>
          <div>
            <h4 className="text-md font-medium mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/competitions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/improvement" className="text-muted-foreground hover:text-foreground transition-colors">
                  Improvement
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/coaching" className="text-muted-foreground hover:text-foreground transition-colors">
                  Coaching
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-medium mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@golfcompete.com" className="text-muted-foreground hover:text-foreground transition-colors">
                  info@golfcompete.com
                </a>
              </li>
              <li>
                <a href="https://twitter.com/golfcompete" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://instagram.com/golfcompete" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-10 pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GolfCompete. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 