import React, { useEffect, useState } from 'react';


const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <br  />
      <table cellSpacing="0" id="gfooter">
        <tbody>
          <tr>
            <td width="55%" align="center" style={{whiteSpace: 'nowrap'}}>
              Язык/Мова/Lang 
              <div id="google_translate_element">
                <select id="language_selector">
                  <option value="ru">Русский</option>
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
              </div>
            </td>
            
            <td width="45%" align="right" style={{whiteSpace: 'nowrap'}}>
              Сейчас: <span id="current_time">{formatTime(currentTime)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default Footer;

