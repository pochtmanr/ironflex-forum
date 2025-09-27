import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Условия использования - IronFlex Forum",
  description: "Условия использования IronFlex Forum",
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Условия использования</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Принятие условий</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Используя наш форум, вы соглашаетесь с данными условиями использования. 
            Если вы не согласны с какими-либо положениями, пожалуйста, не используйте наш сервис.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Правила поведения</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Пользователи обязуются:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Соблюдать правила сообщества</li>
            <li>Не размещать спам или нежелательный контент</li>
            <li>Уважать других пользователей</li>
            <li>Не нарушать авторские права</li>
            <li>Не использовать оскорбительный или дискриминационный язык</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Модерация контента</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Администрация форума оставляет за собой право удалять любой контент, 
            нарушающий правила сообщества или законодательство.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Ответственность</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Пользователи несут ответственность за размещаемый ими контент. 
            Администрация не несет ответственности за мнения и материалы, размещенные пользователями.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Изменения условий</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Мы оставляем за собой право изменять данные условия в любое время. 
            Продолжение использования сервиса после внесения изменений означает согласие с новыми условиями.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Контактная информация</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            По вопросам условий использования обращайтесь: 
            <a href="mailto:info@ironflex.kz" className="text-blue-600 hover:text-blue-700">info@ironflex.kz</a>
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8">
          Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
}
