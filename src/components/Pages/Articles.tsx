'use client'

import React, { useEffect, useState } from 'react';
import { contentAPI } from '../../services/api';
import ArticlesHeader from '../Articles/ArticlesHeader';
import ArticlesList from '../Articles/ArticlesList';

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  subheader: string;  
  coverImageUrl: string;
  tags: string;
  created_at: string;
  likes?: number;
  views?: number;
  commentCount?: number;
}

type SortOption = 'newest' | 'week' | 'month' | 'year';

const Articles: React.FC = () => {
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Sort articles based on selected criteria
  const sortArticles = (articles: ArticleListItem[], sortOption: SortOption): ArticleListItem[] => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let filteredArticles = [...articles];

    switch (sortOption) {
      case 'newest':
        return filteredArticles.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
      case 'week':
        filteredArticles = articles.filter(article => 
          new Date(article.created_at) >= oneWeekAgo
        );
        return filteredArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      case 'month':
        filteredArticles = articles.filter(article => 
          new Date(article.created_at) >= oneMonthAgo
        );
        return filteredArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      case 'year':
        filteredArticles = articles.filter(article => 
          new Date(article.created_at) >= oneYearAgo
        );
        return filteredArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
      default:
        return filteredArticles;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const res = await contentAPI.getArticles(1, 50); // Get more articles for better sorting
        console.log('DEBUG: Articles page - received data:', res);
        const articles = res.articles || [];
        
        // Sort articles based on selected criteria
        const sortedArticles = sortArticles(articles, sortBy);
        
        setItems(sortedArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sortBy]);

  return (
    <div className="mx-auto py-3 sm:py-6 px-2 sm:px-4">
      <ArticlesHeader 
        sortBy={sortBy} 
        onSortChange={setSortBy} 
      />
      
      <div className="bg-white shadow-md">
        <ArticlesList articles={items} loading={loading} />
      </div>
    </div>
  );
};

export default React.memo(Articles);

