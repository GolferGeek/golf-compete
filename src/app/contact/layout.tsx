import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | GolfCompete",
  description: "Get in touch with the GolfCompete team for support, feedback, or partnership opportunities.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 