'use client'

import React, { useEffect, useState } from 'react';
import { contentAPI } from '../../services/api';
import TrainingsHeader from '../Trainings/TrainingsHeader';
import TrainingsList from '../Trainings/TrainingsList';

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

type SortOption = 'newest' | 'week' | 'month' | 'year';

const Trainings: React.FC = () => {
  const [items, setItems] = useState<TrainingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Sort trainings based on selected criteria
  const sortTrainings = (trainings: TrainingListItem[], sortOption: SortOption): TrainingListItem[] => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let filteredTrainings = [...trainings];

    switch (sortOption) {
      case 'newest':
        return filteredTrainings.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
      case 'week':
        filteredTrainings = trainings.filter(training => 
          new Date(training.created_at) >= oneWeekAgo
        );
        return filteredTrainings.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      case 'month':
        filteredTrainings = trainings.filter(training => 
          new Date(training.created_at) >= oneMonthAgo
        );
        return filteredTrainings.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      case 'year':
        filteredTrainings = trainings.filter(training => 
          new Date(training.created_at) >= oneYearAgo
        );
        return filteredTrainings.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      default:
        return filteredTrainings;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const res = await contentAPI.getTrainings(1, 50);
        console.log('DEBUG: Trainings page - received data:', res);
        const trainings = res.trainings || [];
        
        // Sort trainings based on selected criteria
        const sortedTrainings = sortTrainings(trainings, sortBy);
        
        setItems(sortedTrainings);
      } catch (error) {
        console.error('Error loading trainings:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sortBy]);

  return (
    <div className="mx-auto py-3 sm:py-6 px-2 sm:px-4">
      <TrainingsHeader 
        sortBy={sortBy} 
        onSortChange={setSortBy} 
      />
      
      <div className="bg-white shadow-md">
        <TrainingsList trainings={items} loading={loading} />
      </div>
    </div>
  );
};

export default React.memo(Trainings);

