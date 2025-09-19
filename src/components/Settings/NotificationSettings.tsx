import React, { useState } from 'react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'new-reply',
      title: 'Новые ответы',
      description: 'Уведомления о новых ответах в ваших темах',
      email: true,
      push: true
    },
    {
      id: 'mentions',
      title: 'Упоминания',
      description: 'Когда кто-то упоминает вас в сообщении',
      email: true,
      push: false
    },
    {
      id: 'private-messages',
      title: 'Личные сообщения',
      description: 'Новые личные сообщения от других пользователей',
      email: true,
      push: true
    },
    {
      id: 'weekly-digest',
      title: 'Еженедельный дайджест',
      description: 'Подборка популярных тем за неделю',
      email: false,
      push: false
    }
  ]);

  const handleToggle = (id: string, type: 'email' | 'push') => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, [type]: !setting[type] }
        : setting
    ));
  };

  const handleSave = () => {
    // In a real app, save to Firestore
    console.log('Saving notification settings:', settings);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Настройки уведомлений</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Типы уведомлений</h3>
          
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className="ml-4 flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.email}
                        onChange={() => handleToggle(setting.id, 'email')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.push}
                        onChange={() => handleToggle(setting.id, 'push')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Push</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Частота уведомлений</h3>
          <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option>Мгновенно</option>
            <option>Ежедневная сводка</option>
            <option>Еженедельная сводка</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
