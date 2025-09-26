import React from 'react';
import TrainingCard from './TrainingCard';
import SkeletonLoader from '../UI/SkeletonLoader';  

interface TrainingListItem {
  id: string;
  title: string;
  slug: string;
  subheader: string;
  coverImageUrl: string;
  level: string;
  durationMinutes: number | null;
  authorName: string;
  created_at: string;
  likes?: number;
  views?: number;
  commentCount?: number;
}

interface TrainingsListProps {
  trainings: TrainingListItem[];
  loading: boolean;
}

const TrainingsList: React.FC<TrainingsListProps> = ({ trainings, loading }) => {
  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          <SkeletonLoader type="article" count={6} />
        </div>
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Пока нет тренировок</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        {trainings.map(training => (
          <TrainingCard key={training.id} training={training} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TrainingsList);
