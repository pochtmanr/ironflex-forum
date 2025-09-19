import React, { useState } from 'react';

const PrivacySettings: React.FC = () => {
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showActivity: true,
    allowMessages: true,
    showOnlineStatus: true
  });

  const handleChange = (key: keyof typeof privacy) => {
    setPrivacy({
      ...privacy,
      [key]: !privacy[key]
    });
  };

  const handleSave = () => {
    // In a real app, save to Firestore
    console.log('Saving privacy settings:', privacy);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Настройки конфиденциальности</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Видимость профиля</h3>
          
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacy.showEmail}
                onChange={() => handleChange('showEmail')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">Показывать email</span>
                <p className="text-sm text-gray-500">Разрешить другим пользователям видеть ваш email адрес</p>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacy.showActivity}
                onChange={() => handleChange('showActivity')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">Показывать активность</span>
                <p className="text-sm text-gray-500">Отображать ваши последние темы и сообщения в профиле</p>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacy.showOnlineStatus}
                onChange={() => handleChange('showOnlineStatus')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">Показывать онлайн статус</span>
                <p className="text-sm text-gray-500">Разрешить другим видеть, когда вы онлайн</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Общение</h3>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={privacy.allowMessages}
              onChange={() => handleChange('allowMessages')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Разрешить личные сообщения</span>
              <p className="text-sm text-gray-500">Получать личные сообщения от других пользователей</p>
            </div>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Заблокированные пользователи</h3>
          <p className="text-sm text-gray-500 mb-3">У вас нет заблокированных пользователей</p>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Управление заблокированными
          </button>
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

export default PrivacySettings;
