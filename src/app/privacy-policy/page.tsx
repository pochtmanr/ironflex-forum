import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности - IronFlex Forum",
  description: "Политика конфиденциальности IronFlex Forum",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика конфиденциальности</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Сбор информации</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Мы собираем информацию, которую вы предоставляете при регистрации на нашем форуме, 
            включая имя пользователя, email и другую информацию, необходимую для функционирования сервиса.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Использование информации</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Собранная информация используется для:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Предоставления услуг форума</li>
            <li>Связи с пользователями</li>
            <li>Улучшения качества сервиса</li>
            <li>Обеспечения безопасности</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Защита данных</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Мы принимаем все необходимые меры для защиты ваших личных данных от несанкционированного 
            доступа, изменения, раскрытия или уничтожения.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Файлы cookie</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Наш сайт использует файлы cookie для улучшения пользовательского опыта и анализа трафика. 
            Вы можете отключить cookie в настройках вашего браузера.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Контактная информация</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Если у вас есть вопросы по данной политике конфиденциальности, 
            свяжитесь с нами по email: <a href="mailto:info@ironflex.kz" className="text-blue-600 hover:text-blue-700">info@ironflex.kz</a>
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8">
          Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
}
