import { getSeriesParticipants } from '@/services/competition/seriesParticipantService';
import { getAllProfiles } from '@/lib/profileService';
import SeriesParticipantsManagement from '@/components/series/SeriesParticipantsManagement';
import { SeriesAuthGuard } from '@/components/auth/SeriesAuthGuard';

interface SeriesParticipantsPageProps {
  params: {
    id: string;
  };
}

export default async function SeriesParticipantsPage({ params }: SeriesParticipantsPageProps) {
  const { id } = params;

  // Fetch initial data
  const [participants, profiles] = await Promise.all([
    getSeriesParticipants(id),
    getAllProfiles()
  ]);

  return (
    <SeriesAuthGuard seriesId={id}>
      <SeriesParticipantsManagement 
        seriesId={id}
        initialParticipants={participants}
        initialAvailableUsers={profiles}
      />
    </SeriesAuthGuard>
  );
} 