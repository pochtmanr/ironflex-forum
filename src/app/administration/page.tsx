'use client'

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function Administration() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Администрация</h1>

      <div className="prose prose-gray max-w-none">
        {/* Contact & Form */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Обратная связь</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            По вопросам работы форума, модерации или сотрудничества вы можете связаться
            с администрацией напрямую или через форму ниже.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:info@tarnovsky.ru.kz" className="text-blue-600 hover:text-blue-700">
                info@tarnovsky.ru.kz
              </a>
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Сайт:</strong>{" "}
              <a href="https://www.tarnovsky.ru.kz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                www.tarnovsky.ru.kz
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Среднее время ответа — 24–48 часов в рабочие дни.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                Тема обращения
              </label>
              <input
                id="contact-subject"
                type="text"
                required
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Тема вашего сообщения"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                Сообщение
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y"
                placeholder="Опишите ваш вопрос или предложение..."
              />
            </div>

            {status === 'sent' && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                Сообщение отправлено. Мы свяжемся с вами в ближайшее время.
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                Не удалось отправить сообщение. Попробуйте позже или напишите на email напрямую.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </section>

        {/* Purpose */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">О форуме</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Форум tarnovsky.ru — площадка для общения и обмена опытом на темы спорта, здоровья,
            физической культуры и здорового образа жизни. Целью форума является создание
            открытого пространства, где участники могут обсуждать интересующие их вопросы в
            уважительной и безопасной обстановке.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Форум носит исключительно информационный характер. Материалы, размещённые на форуме,
            не являются руководством к действию и предназначены для ознакомительных целей.
          </p>
        </section>

        {/* Rules */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Правила форума</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Участники форума обязаны соблюдать следующие правила:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Уважительное отношение к другим участникам. Запрещены оскорбления, угрозы, разжигание ненависти и дискриминация в любой форме.</li>
            <li>Запрещено размещение спама, рекламы, а также материалов, нарушающих законодательство Российской Федерации.</li>
            <li>Запрещено размещение контента, пропагандирующего насилие, экстремизм или иную противоправную деятельность.</li>
            <li>Запрещено размещение персональных данных третьих лиц без их согласия.</li>
            <li>Участники несут ответственность за содержание публикуемых ими материалов.</li>
            <li>Запрещено выдавать личное мнение за экспертное медицинское заключение или рекомендацию.</li>
          </ul>
        </section>

        {/* Moderation */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Принципы модерации</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Модерация осуществляется с целью поддержания порядка и безопасной среды для общения.
            Администрация оставляет за собой право:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Удалять или редактировать сообщения, нарушающие правила форума.</li>
            <li>Выносить предупреждения участникам.</li>
            <li>Временно или постоянно ограничивать доступ участникам, систематически нарушающим правила.</li>
            <li>Перемещать темы в соответствующие разделы.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Решения по модерации принимаются на основании правил форума. В случае несогласия с
            решением модератора участник может обратиться к администрации.
          </p>
        </section>

        {/* Medical disclaimer */}
        <section className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Медицинский отказ от ответственности</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Информация, размещённая на форуме, не является медицинской консультацией, диагнозом
              или назначением лечения. Форум не заменяет обращение к квалифицированному специалисту.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              Перед началом любых тренировочных программ, приёмом добавок или изменением режима
              питания настоятельно рекомендуется проконсультироваться с врачом.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Администрация форума не несёт ответственности за последствия применения информации,
              полученной из обсуждений на форуме. Каждый участник самостоятельно принимает решения
              относительно своего здоровья.
            </p>
          </div>
        </section>

        {/* User responsibility */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ответственность пользователей</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Каждый участник форума несёт персональную ответственность за публикуемый контент.
            Размещая материалы на форуме, пользователь подтверждает, что:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Содержание публикации не нарушает действующее законодательство.</li>
            <li>Публикация не содержит заведомо ложной информации, представленной в качестве достоверной.</li>
            <li>Публикация не нарушает права и законные интересы третьих лиц.</li>
            <li>Пользователь осознаёт публичный характер размещаемой информации.</li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-center"
          >
            На главную
          </Link>
          <Link
            href="/faq"
            className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium text-center"
          >
            Частые вопросы
          </Link>
        </div>
      </div>
    </div>
  );
}
