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
      <div className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="flex">
                {/* Image placeholder */}
                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 animate-pulse" />
                {/* Content */}
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1 hidden sm:block" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse mb-3 hidden sm:block" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-green-50 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
