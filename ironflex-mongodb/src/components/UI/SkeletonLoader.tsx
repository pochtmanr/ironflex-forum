import React from 'react';

interface SkeletonLoaderProps {
  type: 'article' | 'training' | 'topic' | 'category';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 5 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'article':
      case 'training':
        return (
          <div className="block border border-gray-200 rounded overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
              <div className="flex items-center gap-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        );
      
      case 'topic':
        return (
          <tr className="border-b animate-pulse">
            <td className="px-6 py-4">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
          </tr>
        );
      
      case 'category':
        return (
          <tr className="border-b animate-pulse">
            <td className="px-4 py-4">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </td>
            <td className="px-4 py-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-4 py-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-4 py-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </td>
          </tr>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;
