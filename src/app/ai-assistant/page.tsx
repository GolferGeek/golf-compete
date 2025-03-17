import { Metadata } from 'next';
import GolfAssistantDemo from '@/components/ai/GolfAssistantDemo';

export const metadata: Metadata = {
  title: 'AI Golf Assistant Demo',
  description: 'Try out the AI Golf Assistant to help improve your game',
};

export default function AIAssistantPage() {
  return <GolfAssistantDemo />;
} 