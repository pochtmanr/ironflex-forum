import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Default categories for the forum
const defaultCategories = [
  {
    id: 'news-competitions',
    name: 'Новости и соревнования',
    description: 'Все новости бодибилдинга, пауэрлифтинга и других видов спорта. Анонсы соревнований, результаты.',
    slug: 'news-competitions',
    orderIndex: 1,
    isActive: true
  },
  {
    id: 'beginners',
    name: 'Новичкам',
    description: 'Раздел для начинающих, содержащий схемы тренировок для новичков',
    slug: 'beginners',
    orderIndex: 2,
    isActive: true
  },
  {
    id: 'nutrition',
    name: 'Питание',
    description: 'Все о питании в бодибилдинге, диеты, рецепты',
    slug: 'nutrition',
    orderIndex: 3,
    isActive: true
  },
  {
    id: 'sports-nutrition',
    name: 'Спортивное питание',
    description: 'Протеины, гейнеры, аминокислоты, креатин и другие добавки',
    slug: 'sports-nutrition',
    orderIndex: 4,
    isActive: true
  },
  {
    id: 'pharmacology',
    name: 'Фармакология',
    description: 'Обсуждение фармакологических препаратов в спорте',
    slug: 'pharmacology',
    orderIndex: 5,
    isActive: true
  },
  {
    id: 'training',
    name: 'Тренировки',
    description: 'Программы тренировок, методики, техника выполнения упражнений',
    slug: 'training',
    orderIndex: 6,
    isActive: true
  }
];

// Initialize Firestore with default data
export const initializeFirestore = async () => {
  try {
    console.log('🔥 Initializing Firestore database...');
    
    // Check if categories already exist
    const categoriesRef = collection(db, 'categories');
    const existingCategoriesQuery = query(categoriesRef, where('isActive', '==', true));
    const existingCategoriesSnapshot = await getDocs(existingCategoriesQuery);
    
    if (existingCategoriesSnapshot.empty) {
      console.log('📝 Creating default categories...');
      
      // Create default categories
      for (const category of defaultCategories) {
        const categoryRef = doc(db, 'categories', category.id);
        await setDoc(categoryRef, {
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created category: ${category.name}`);
      }
      
      console.log('🎉 Firestore initialization complete!');
    } else {
      console.log('✅ Firestore already initialized with categories');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    return false;
  }
};

// Function to create a sample topic for testing
export const createSampleTopic = async (userId: string, userName: string, userEmail: string) => {
  try {
    console.log('📝 Creating sample topic...');
    
    const sampleTopicRef = doc(collection(db, 'topics'));
    await setDoc(sampleTopicRef, {
      categoryId: 'beginners',
      userId,
      userName,
      userEmail,
      title: 'Добро пожаловать на форум!',
      content: `Привет всем! 

Это первая тема на нашем форуме. Здесь вы можете:

- Задавать вопросы о тренировках
- Делиться своими достижениями  
- Обсуждать питание и добавки
- Находить единомышленников

Добро пожаловать в наше сообщество! 💪`,
      mediaLinks: [],
      slug: 'welcome-to-forum',
      views: 1,
      likes: 0,
      dislikes: 0,
      isPinned: true,
      isLocked: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastPostAt: new Date(),
      replyCount: 0
    });
    
    console.log('✅ Sample topic created!');
    return sampleTopicRef.id;
  } catch (error) {
    console.error('❌ Error creating sample topic:', error);
    return null;
  }
};

// Check Firestore connection
export const testFirestoreConnection = async () => {
  try {
    const testRef = collection(db, 'test');
    await getDocs(testRef);
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
};
