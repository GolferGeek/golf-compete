import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ScorecardDisplay } from '@/components/scorecard/ScorecardDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getServerSession } from '@/lib/api/auth';

async function getEventData(eventId: string) {
    const response = await fetch(`/api/events/${eventId}/scorecard`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            notFound();
        }
        throw new Error('Failed to fetch event data');
    }

    const data = await response.json();
    return data.data;
}

export default async function EventScorecardPage({ params }: { params: { id: string } }) {
    const eventId = params.id;
    if (!eventId) notFound();

    // Check if user has access to this event
    const session = await getServerSession();
    if (!session?.user) notFound();

    const eventData = await getEventData(eventId);

    return (
        <div className="container mx-auto px-4 py-8">
            <Suspense fallback={<LoadingSpinner />}>
                <ScorecardDisplay 
                    event={eventData.event}
                    holes={eventData.holes}
                    rounds={eventData.rounds}
                    holeScores={eventData.holeScores}
                />
            </Suspense>
        </div>
    );
} 