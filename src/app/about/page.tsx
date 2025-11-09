import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О нас - tarnovsky.ru Forum",
  description: "Информация о tarnovsky.ru Forum - форуме для любителей бодибилдинга и фитнеса",
};

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">О нас</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <div className="flex items-center mb-6">
            <img 
              src="/images/4_logo12.svg" 
              alt="tarnovsky.ru" 
              className="h-16 w-auto mr-4"
            />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">tarnovsky.ru Forum</h2>
              <p className="text-gray-600">Сообщество для любителей фитнеса и здорового образа жизни</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Наша миссия</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            tarnovsky.ru Forum создан для объединения людей, увлеченных бодибилдингом, фитнесом и здоровым образом жизни. 
            Мы стремимся создать дружелюбное сообщество, где каждый может найти поддержку, поделиться опытом 
            и получить ответы на свои вопросы.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Что мы предлагаем</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">💬 Обсуждения</h3>
              <p className="text-gray-700">
                Активное обсуждение тем, связанных с тренировками, питанием, добавками и здоровьем.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">👥 Сообщество</h3>
              <p className="text-gray-700">
                Возможность общаться с единомышленниками и делиться личным опытом.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Знания</h3>
              <p className="text-gray-700">
                Доступ к проверенной информации и экспертным советам.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 Мотивация</h3>
              <p className="text-gray-700">
                Поддержка и мотивация на пути к достижению ваших целей.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Наши принципы</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Уважение</strong> - Мы уважаем мнение каждого участника сообщества</li>
            <li><strong>Безопасность</strong> - Мы создаем безопасную среду для общения</li>
            <li><strong>Качество</strong> - Мы стремимся к качественному контенту и обсуждениям</li>
            <li><strong>Поддержка</strong> - Мы помогаем друг другу достигать целей</li>
            <li><strong>Развитие</strong> - Мы постоянно улучшаем наш форум</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Присоединяйтесь к нам</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Станьте частью нашего сообщества! Зарегистрируйтесь на форуме и начните общаться 
            с людьми, которые разделяют ваши интересы.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-center"
            >
              Зарегистрироваться
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium text-center"
            >
              На главную
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Контакты</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Если у вас есть вопросы или предложения, мы всегда рады обратной связи:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> <a href="mailto:info@tarnovsky.ru.kz" className="text-blue-600 hover:text-blue-700">info@tarnovsky.ru.kz</a>
            </p>
            <p className="text-gray-700">
              <strong>Сайт:</strong> <a href="https://www.tarnovsky.ru.kz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">www.tarnovsky.ru.kz</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
