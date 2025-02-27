import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About GolfCompete",
  description: "Learn more about GolfCompete, our mission, and our team.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 