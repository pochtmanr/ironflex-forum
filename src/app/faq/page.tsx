'use client'

import type { Metadata } from "next";
import { useState } from 'react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "Как зарегистрироваться на форуме?",
      answer: "Нажмите на кнопку 'Регистрация' в правом верхнем углу страницы, заполните необходимые поля (имя пользователя, email, пароль) и подтвердите регистрацию по email."
    },
    {
      question: "Как создать новую тему?",
      answer: "Зарегистрированные пользователи могут создавать темы, нажав на кнопку 'Создать тему' на главной странице или в любой категории форума."
    },
    {
      question: "Как редактировать свой профиль?",
      answer: "После входа в систему перейдите в свой профиль, где вы сможете изменить аватар, описание, контактную информацию и другие настройки."
    },
    {
      question: "Что делать, если забыл пароль?",
      answer: "На странице входа нажмите на ссылку 'Забыли пароль?' и следуйте инструкциям для восстановления доступа к аккаунту."
    },
    {
      question: "Как найти интересующую меня тему?",
      answer: "Используйте поиск в верхней части страницы или просматривайте категории форума. Вы также можете сортировать темы по дате, популярности или количеству ответов."
    },
    {
      question: "Можно ли прикреплять файлы к сообщениям?",
      answer: "Да, вы можете прикреплять изображения и другие файлы к своим сообщениям. Поддерживаются форматы: JPG, PNG, GIF, PDF, DOC, DOCX."
    },
    {
      question: "Как работает система репутации?",
      answer: "Пользователи могут оценивать сообщения других участников. Положительные оценки повышают репутацию, отрицательные - понижают. Репутация влияет на видимость в сообществе."
    },
    {
      question: "Что запрещено на форуме?",
      answer: "Запрещены: спам, оскорбления, дискриминация, нарушение авторских прав, размещение неподходящего контента. За нарушения может быть вынесено предупреждение или блокировка."
    },
    {
      question: "Как связаться с администрацией?",
      answer: "Вы можете написать на email info@ironflex.kz или использовать форму обратной связи. Мы отвечаем в течение 24-48 часов."
    },
    {
      question: "Можно ли использовать форум с мобильного устройства?",
      answer: "Да, наш форум адаптирован для мобильных устройств и работает на всех современных смартфонах и планшетах."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Часто задаваемые вопросы</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openItems.includes(index) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Не нашли ответ на свой вопрос?</h2>
        <p className="text-gray-700 mb-4">
          Если у вас есть другие вопросы, не стесняйтесь обращаться к нам:
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:info@ironflex.kz"
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-center"
          >
            Написать нам
          </a>
          <a
            href="/about"
            className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium text-center"
          >
            О форуме
          </a>
        </div>
      </div>
    </div>
  );
}
