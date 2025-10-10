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
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 text-base">Загрузка тренировок...</div>
        </div>
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div className="text-gray-600 text-lg font-medium mb-2">Пока нет тренировок</div>
          <p className="text-gray-500 text-sm">Скоро здесь появятся практические упражнения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="space-y-3 sm:space-y-4">
        {trainings.map(training => (
          <TrainingCard key={training.id} training={training} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TrainingsList);
