import React from 'react';

const Encyclopedia: React.FC = () => {
  return (
    <div id="forumwrapper">
      <div id="ipbwrapper">
        {/* Topic Header */}
        <div className="borderwrap">
          <div className="maintitle">
            <table width="100%" cellSpacing="0" cellPadding="0">
              <tbody>
                <tr>
                  <td width="99%">
                    <h1 className="h1">энциклопедия бодибилдинга!</h1>
                    <div className="desc" style={{fontWeight: 'normal', fontSize: '11px', color: '#666'}}>
                      ВАЖНО!ЧИТАТЬ НОВИЧКАМ
                    </div>
                  </td>
                  <td width="1%" style={{whiteSpace: 'nowrap'}} align="right">
                    <div className="popmenubutton" id="topicmenu-options" style={{cursor: 'pointer'}}>
                      <span>Опции темы</span> 
                      <img src="/images/menu_action_down.svg" alt="V" title="Открыть меню" style={{border: 0}} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Topic Content */}
        <div className="borderwrap">
          <table className="ipbtable" cellSpacing="0">
            <tbody>
              {/* Post #1 */}
              <tr>
                <td className="row1" style={{verticalAlign: 'top', width: '150px'}}>
                  <div className="postdetails">
                    <img src="/images/user_icon.svg" alt="Пользователь офлайн" style={{border: 0}} />
                    <b><span className="drive wi">Егорычъ</span></b>
                    <br /><span className="postdetails">Администратор</span>
                    <br /><img src="/images/star.svg" alt="*" style={{border: 0}} />
                    <br /><span className="postdetails">
                      <br />Группа: Администраторы
                      <br />Сообщений: 5,678
                      <br />Регистрация: 15-Февраль 10
                      <br />Пользователь №: 1
                    </span>
                  </div>
                </td>
                <td className="row2" style={{verticalAlign: 'top'}}>
                  <div className="postcolor">
                    <div style={{float: 'right'}}>
                      <span className="postdate">7 февраля 2011 - 00:30</span>
                      <a href="#post1" title="Прямая ссылка на это сообщение">
                        <img src="/images/lastpost.svg" style={{border: 0}} alt="#1" />
                      </a>
                    </div>
                    
                    <div className="post-content">
                      <h2 style={{color: '#2C5197', fontSize: '16px', margin: '10px 0'}}>Энциклопедия бодибилдинга для новичков</h2>
                      
                      <p><strong>Добро пожаловать в мир бодибилдинга!</strong></p>
                      
                      <p>Эта тема создана специально для новичков, которые только начинают свой путь в бодибилдинге. 
                      Здесь вы найдете основную информацию, которая поможет вам избежать распространенных ошибок 
                      и достичь лучших результатов.</p>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>📚 Основы бодибилдинга</h3>
                      
                      <h4><span style={{color: '#2C5197'}}>1. Принципы тренировок</span></h4>
                      <ul>
                        <li><strong>Прогрессивная перегрузка</strong> - постепенное увеличение нагрузки</li>
                        <li><strong>Восстановление</strong> - отдых между тренировками не менее важен самих тренировок</li>
                        <li><strong>Постоянство</strong> - регулярные тренировки дают лучший результат</li>
                        <li><strong>Правильная техника</strong> - качество важнее количества</li>
                      </ul>

                      <h4><span style={{color: '#2C5197'}}>2. Базовые упражнения</span></h4>
                      <p>Новичкам рекомендуется сосредоточиться на базовых упражнениях:</p>
                      <ul>
                        <li><strong>Приседания</strong> - для развития ног и ягодиц</li>
                        <li><strong>Становая тяга</strong> - для спины и ног</li>
                        <li><strong>Жим лежа</strong> - для груди и трицепсов</li>
                        <li><strong>Подтягивания</strong> - для спины и бицепсов</li>
                        <li><strong>Жим стоя</strong> - для плеч</li>
                      </ul>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>🍽️ Питание для набора массы</h3>
                      
                      <h4><span style={{color: '#2C5197'}}>Калории и макронутриенты</span></h4>
                      <ul>
                        <li><strong>Калории:</strong> Для набора массы нужен профицит калорий (+300-500 ккал)</li>
                        <li><strong>Белки:</strong> 1.6-2.2 г на кг веса тела</li>
                        <li><strong>Жиры:</strong> 0.8-1.2 г на кг веса тела</li>
                        <li><strong>Углеводы:</strong> Остальные калории</li>
                      </ul>

                      <h4><span style={{color: '#2C5197'}}>Лучшие продукты</span></h4>
                      <p><strong>Белковые продукты:</strong></p>
                      <ul>
                        <li>Куриная грудка</li>
                        <li>Говядина</li>
                        <li>Рыба</li>
                        <li>Яйца</li>
                        <li>Творог</li>
                        <li>Молоко</li>
                      </ul>

                      <p><strong>Углеводы:</strong></p>
                      <ul>
                        <li>Рис</li>
                        <li>Гречка</li>
                        <li>Овсянка</li>
                        <li>Макароны из твердых сортов</li>
                        <li>Картофель</li>
                      </ul>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>💊 Спортивное питание</h3>
                      
                      <p>Для новичков рекомендуются следующие добавки:</p>
                      <ol>
                        <li><strong>Протеин</strong> - для восполнения дефицита белка</li>
                        <li><strong>Креатин</strong> - для увеличения силы и выносливости</li>
                        <li><strong>Витамины</strong> - для общего здоровья</li>
                        <li><strong>Рыбий жир</strong> - источник омега-3</li>
                      </ol>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>📋 Программа тренировок для новичков</h3>
                      
                      <h4><span style={{color: '#2C5197'}}>Fullbody 3 раза в неделю</span></h4>
                      
                      <p><strong>Тренировка A:</strong></p>
                      <ul>
                        <li>Приседания - 3x8-12</li>
                        <li>Жим лежа - 3x8-12</li>
                        <li>Тяга штанги в наклоне - 3x8-12</li>
                        <li>Жим стоя - 3x8-12</li>
                        <li>Планка - 3x30-60 сек</li>
                      </ul>

                      <p><strong>Тренировка B:</strong></p>
                      <ul>
                        <li>Становая тяга - 3x5-8</li>
                        <li>Подтягивания - 3x максимум</li>
                        <li>Отжимания на брусьях - 3x8-12</li>
                        <li>Подъемы на бицепс - 3x10-15</li>
                        <li>Французский жим - 3x10-15</li>
                      </ul>

                      <p><em>Чередуйте тренировки A и B через день отдыха.</em></p>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>⚠️ Частые ошибки новичков</h3>
                      
                      <ol>
                        <li><strong>Слишком сложные программы</strong> - начинайте с простого</li>
                        <li><strong>Плохая техника</strong> - изучите правильную технику</li>
                        <li><strong>Слишком частые тренировки</strong> - мышцам нужен отдых</li>
                        <li><strong>Недостаток питания</strong> - без правильного питания нет роста</li>
                        <li><strong>Ожидание быстрых результатов</strong> - результаты приходят со временем</li>
                        <li><strong>Постоянная смена программ</strong> - дайте программе время работать</li>
                      </ol>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>📊 Как отслеживать прогресс</h3>
                      
                      <ul>
                        <li><strong>Ведите дневник тренировок</strong> - записывайте веса и повторения</li>
                        <li><strong>Измеряйте объемы</strong> - руки, грудь, талия, бедра</li>
                        <li><strong>Взвешивайтесь</strong> - 1-2 раза в неделю в одно время</li>
                        <li><strong>Делайте фото</strong> - прогресс видно лучше на фото</li>
                      </ul>

                      <h3 style={{color: '#2C5197', marginTop: '20px'}}>🎯 Заключение</h3>
                      
                      <p>Помните: бодибилдинг - это марафон, а не спринт. Будьте терпеливы, последовательны 
                      и результаты обязательно придут. Изучайте материалы, задавайте вопросы, и не бойтесь 
                      просить помощи у более опытных товарищей.</p>

                      <p><strong>Удачи в тренировках!</strong> 💪</p>

                      <hr style={{margin: '20px 0', border: '1px solid #E8E8E8'}} />
                      
                      <div style={{background: '#F8F8F8', padding: '10px', borderLeft: '4px solid #2C5197'}}>
                        <p><strong>📌 Полезные ссылки:</strong></p>
                        <ul>
                          <li><a href="/novice" className="drive">Форум для новичков</a></li>
                          <li><span className="drive">Раздел тренировок</span></li>
                          <li><span className="drive">Раздел питания</span></li>
                          <li><span className="drive">Спортивное питание</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              
              {/* Post Actions */}
              <tr>
                <td className="darkrow2" style={{textAlign: 'center'}}>
                  <img src="/images/user_icon.svg" alt="Пользователь офлайн" style={{border: 0}} />
                </td>
                <td className="darkrow2">
                  <div style={{float: 'right'}}>
                    <span className="drive">
                      <img src="/images/quote_icon.svg" style={{border: 0}} alt="Цитировать" />
                    </span>
                    <span className="drive">
                      <img src="/images/edit_icon.svg" style={{border: 0}} alt="Редактировать" />
                    </span>
                  </div>
                  <div>
                    <strong>Егорычъ</strong> на <em>7 февраля 2011 - 00:30</em> сказал:
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Topic Stats */}
        <div className="borderwrap">
          <div className="formsubtitle">
            <b>Статистика темы</b>
          </div>
          <div className="row1" style={{padding: '4px'}}>
            <strong>Просмотров:</strong> 53,367 • <strong>Ответов:</strong> 10 • 
            <strong>Участников:</strong> 8 • <strong>Последнее сообщение:</strong> 11.9.2018, 21:01
          </div>
        </div>

        {/* Quick Reply */}
        <div className="borderwrap">
          <div className="maintitle">
            Быстрый ответ
          </div>
          <div className="row1" style={{padding: '10px'}}>
            <form action="#" method="post">
              <textarea 
                name="message" 
                rows={10} 
                cols={80} 
                style={{width: '100%', height: '150px', resize: 'vertical'}}
                placeholder="Введите ваш ответ..."
              />
              <br /><br />
              <input type="submit" value="Отправить ответ" className="button" />
              <input type="button" value="Предварительный просмотр" className="button" />
            </form>
          </div>
        </div>

        <br style={{clear: 'both'}} />
      </div>
    </div>
  );
};

export default Encyclopedia;
