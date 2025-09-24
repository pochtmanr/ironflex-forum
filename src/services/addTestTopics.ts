// Script to add test topics to Firebase
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export const addTestTopics = async () => {
  try {
    console.log('🚀 Adding test topics to Firebase...');
    
    // First, get the available categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log('📂 Available categories:', categories);
    
    if (categories.length === 0) {
      console.log('❌ No categories found. Please initialize categories first.');
      return;
    }
    
    // Use the first category for test topics
    const firstCategory = categories[0];
    console.log('📝 Using category:', firstCategory.name, 'with ID:', firstCategory.id);
    
    // Test topics to add
    const testTopics = [
      {
        categoryId: firstCategory.id,
        userId: 'test-user-1',
        userName: 'Администратор',
        userEmail: 'admin@forum.com',
        title: 'Добро пожаловать на форум! 🎉',
        content: `# Привет всем!

Это **первая тема** на нашем форуме по бодибилдингу и фитнесу!

## Что вы можете делать здесь:
- ✅ Задавать вопросы о тренировках
- ✅ Делиться своими достижениями
- ✅ Обсуждать питание и добавки
- ✅ Находить единомышленников
- ✅ Получать советы от опытных атлетов

### Давайте общаться!
Не стесняйтесь создавать новые темы и активно участвовать в обсуждениях.

**С уважением,**  
*Администрация форума*`,
        mediaLinks: [],
        slug: 'welcome-to-forum',
        views: 15,
        likes: 3,
        dislikes: 0,
        isPinned: true,
        isLocked: false,
        isActive: true,
        replyCount: 2
      },
      {
        categoryId: firstCategory.id,
        userId: 'test-user-2',
        userName: 'Спортсмен',
        userEmail: 'athlete@forum.com',
        title: 'Моя программа тренировок на массу 💪',
        content: `Привет! Хочу поделиться своей программой тренировок, которая помогла мне набрать 10 кг за 6 месяцев.

## Моя программа:

**Понедельник - Грудь и трицепс:**
- Жим лежа 4x8-10
- Жим гантелей на наклонной 3x10-12
- Отжимания на брусьях 3x8-10

**Среда - Спина и бицепс:**
- Подтягивания 4x6-8
- Тяга штанги в наклоне 4x8-10
- Подъем штанги на бицепс 3x10-12

**Пятница - Ноги и плечи:**
- Приседания 4x8-10
- Жим ногами 3x12-15
- Жим штанги стоя 3x8-10

Что думаете о такой программе?`,
        mediaLinks: [],
        slug: 'my-mass-gaining-program',
        views: 28,
        likes: 7,
        dislikes: 1,
        isPinned: false,
        isLocked: false,
        isActive: true,
        replyCount: 5
      },
      {
        categoryId: firstCategory.id,
        userId: 'test-user-3',
        userName: 'Новичок',
        userEmail: 'newbie@forum.com',
        title: 'С чего начать новичку? 🤔',
        content: `Привет всем! Я только начинаю заниматься в зале и не знаю с чего начать.

**Мои данные:**
- Возраст: 22 года
- Рост: 175 см
- Вес: 65 кг
- Опыт: 0 (никогда не занимался)

**Цели:**
- Набрать мышечную массу
- Улучшить общую физическую форму
- Научиться правильной технике

Подскажите, пожалуйста:
1. Какую программу выбрать для начала?
2. Какие упражнения самые важные?
3. Как часто тренироваться?
4. Что с питанием?

Буду благодарен за любые советы!`,
        mediaLinks: [],
        slug: 'where-to-start-beginner',
        views: 42,
        likes: 12,
        dislikes: 0,
        isPinned: false,
        isLocked: false,
        isActive: true,
        replyCount: 8
      }
    ];
    
    // Add each test topic
    for (const topicData of testTopics) {
      const topicRef = await addDoc(collection(db, 'topics'), {
        ...topicData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPostAt: serverTimestamp()
      });
      
      console.log(`✅ Added topic: "${topicData.title}" with ID: ${topicRef.id}`);
    }
    
    console.log('🎉 All test topics added successfully!');
    console.log('📊 You should now see topics in your forum.');
    
  } catch (error) {
    console.error('❌ Error adding test topics:', error);
  }
};

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).addTestTopics = addTestTopics;
  console.log('🔧 Test function available: window.addTestTopics()');
}
