// Test script for debugging forum features
// Run this in browser console: window.testForumFeatures()

import { forumAPI } from './api';
import { auth } from '../firebase/config';

export const testForumFeatures = async () => {
  console.log('=== Testing Forum Features ===');
  
  // Test 1: Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('❌ Not authenticated. Please login first.');
    return;
  }
  console.log('✅ Authenticated as:', currentUser.email);
  
  // Test 2: Test like functionality
  console.log('\n--- Testing Like Functionality ---');
  try {
    // Get a topic to test with
    const categories = await forumAPI.getCategories();
    if (categories.categories.length > 0) {
      const firstCategory = categories.categories[0];
      const categoryData = await forumAPI.getCategory(firstCategory.id.toString());
      
      if (categoryData.topics.length > 0) {
        const testTopic = categoryData.topics[0];
        console.log('Testing like on topic:', testTopic.title);
        
        // Like the topic
        await forumAPI.likeTopic(testTopic.id.toString(), 'like');
        console.log('✅ Like added successfully');
        
        // Get updated topic to verify
        const updatedTopic = await forumAPI.getTopic(testTopic.id.toString());
        console.log('Updated likes count:', updatedTopic.topic.likes);
      } else {
        console.log('No topics found to test likes');
      }
    }
  } catch (error) {
    console.error('❌ Like test failed:', error);
  }
  
  // Test 3: Test post creation with image
  console.log('\n--- Testing Post Creation ---');
  try {
    // This would need a real topic ID and content
    console.log('To test post creation, use: forumAPI.createPost(topicId, "Test content", ["image-url"])');
  } catch (error) {
    console.error('❌ Post creation test failed:', error);
  }
  
  console.log('\n=== Tests Complete ===');
};

// Make it available globally
(window as any).testForumFeatures = testForumFeatures;
