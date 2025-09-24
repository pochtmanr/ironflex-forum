#!/usr/bin/env node

/**
 * Switch IronFlex Forum to Firebase Backend
 * 
 * This script updates the import statements in your React components
 * to use Firebase instead of the REST API backend.
 */

const fs = require('fs');
const path = require('path');

// Files that need to be updated
const filesToUpdate = [
  'src/components/Forum/ForumHome.tsx',
  'src/components/Forum/CategoryView.tsx', 
  'src/components/Forum/TopicView.tsx',
  'src/components/Forum/CreateTopic.tsx',
  'src/components/Pages/AdminContent.tsx',
  // Add more files as needed
];

// Backup original api.ts
const backupApiFile = () => {
  const apiPath = 'src/services/api.ts';
  const backupPath = 'src/services/api.backup.ts';
  
  if (fs.existsSync(apiPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(apiPath, backupPath);
    console.log('✅ Backed up original api.ts to api.backup.ts');
  }
};

// Replace api.ts with Firebase integration
const switchToFirebaseAPI = () => {
  const originalPath = 'src/services/api.ts';
  const firebasePath = 'src/services/firebaseIntegration.ts';
  
  if (fs.existsSync(firebasePath)) {
    // Read Firebase integration content
    const firebaseContent = fs.readFileSync(firebasePath, 'utf8');
    
    // Write to api.ts
    fs.writeFileSync(originalPath, firebaseContent);
    console.log('✅ Switched api.ts to use Firebase integration');
  }
};

// Update package.json to remove proxy (not needed with Firebase)
const updatePackageJson = () => {
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.proxy) {
      delete packageJson.proxy;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Removed proxy from package.json');
    }
  }
};

// Main execution
const main = () => {
  console.log('🔥 Switching IronFlex Forum to Firebase...\n');
  
  try {
    // Change to the correct directory
    process.chdir(path.join(__dirname, 'ironflex-forum'));
    
    // Step 1: Backup and switch API
    console.log('1️⃣ Switching API to Firebase...');
    backupApiFile();
    switchToFirebaseAPI();
    
    // Step 2: Update package.json
    console.log('\n2️⃣ Updating package.json...');
    updatePackageJson();
    
    console.log('\n🎉 Successfully switched to Firebase!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your React app: npm run dev');
    console.log('2. The app will automatically initialize Firestore with default categories');
    console.log('3. Create your first topic to test the forum!');
    console.log('\n📁 Your original API file is backed up as api.backup.ts');
    console.log('\n⚠️ Note: You no longer need to run the backend server!');
    
  } catch (error) {
    console.error('❌ Error switching to Firebase:', error.message);
    process.exit(1);
  }
};

// Run the script
main();
