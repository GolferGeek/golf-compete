import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enter Scores | Golf Compete',
  description: 'Enter hole scores for your round',
};

export default function ScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 