import React from 'react';
import { Link } from 'react-router-dom';

const Novice: React.FC = () => {
  return (
    <div id="forumwrapper">
      <div id="ipbwrapper">
        {/* Forum Categories for Novices */}
        <div className="borderwrap">
          <div className="maintitle">
            <table width="100%" cellSpacing="0" cellPadding="0">
              <tbody>
                <tr>
                  <td width="99%"><h1 className="h1">Новичкам</h1></td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="ipbtable" cellSpacing="0">
            <tbody>
              <tr> 
                <th colSpan={2} style={{width: '66%'}}>Темы для новичков</th>
                <th style={{textAlign: 'center', width: '7%'}}>Ответов</th>
                <th style={{width: '35%'}}>Последнее сообщение</th>
              </tr>
              
              <tr> 
                <td style={{textAlign: 'center'}} className="row2" width="1%">
                  <img src="/images/t_new.svg" style={{border: 0}} alt="Важная тема" />
                </td>
                <td className="row2">
                  <b><Link to="/encyclopedia">📚 Энциклопедия бодибилдинга!</Link></b>
                  <br />
                  <span className="forumdesc">ВАЖНО! ЧИТАТЬ НОВИЧКАМ - полное руководство по бодибилдингу</span>
                </td>
                <td style={{textAlign: 'center'}} className="row2">
                  <div className="topics_count">10</div>
                </td>
                <td className="row1" style={{whiteSpace: 'nowrap'}}>
                  <div className="last_poster_info">
                    <span className="drive">
                      <img src="/images/lastpost.svg" style={{border: 0}} alt="Последнее сообщение" />
                    </span>
                    11.9.2018, 21:01<br />
                    <b>Автор:</b> <span className="drive wi">Егорычъ</span>
                  </div>
                </td>
              </tr>

              <tr> 
                <td style={{textAlign: 'center'}} className="row2" width="1%">
                  <img src="/images/f_pinned.svg" style={{border: 0}} alt="Закрепленная тема" />
                </td>
                <td className="row2">
                  <b><span className="drive">❌ Типичные ошибки новичков</span></b>
                  <br />
                  <span className="forumdesc">Самые распространенные ошибки начинающих бодибилдеров</span>
                </td>
                <td style={{textAlign: 'center'}} className="row2">
                  <div className="topics_count">25</div>
                </td>
                <td className="row1" style={{whiteSpace: 'nowrap'}}>
                  <div className="last_poster_info">
                    <span className="drive">
                      <img src="/images/lastpost.svg" style={{border: 0}} alt="Последнее сообщение" />
                    </span>
                    15.8.2018, 14:30<br />
                    <b>Автор:</b> <span className="drive wi">Тренер</span>
                  </div>
                </td>
              </tr>

              <tr> 
                <td style={{textAlign: 'center'}} className="row2" width="1%">
                  <img src="/images/f_norm_no.svg" style={{border: 0}} alt="Обычная тема" />
                </td>
                <td className="row2">
                  <b><span className="drive">🏋️ Первая программа тренировок</span></b>
                  <br />
                  <span className="forumdesc">Базовая программа для начинающих атлетов</span>
                </td>
                <td style={{textAlign: 'center'}} className="row2">
                  <div className="topics_count">15</div>
                </td>
                <td className="row1" style={{whiteSpace: 'nowrap'}}>
                  <div className="last_poster_info">
                    <span className="drive">
                      <img src="/images/lastpost.svg" style={{border: 0}} alt="Последнее сообщение" />
                    </span>
                    10.7.2018, 16:45<br />
                    <b>Автор:</b> <span className="drive wi">НовичокГод</span>
                  </div>
                </td>
              </tr>

              <tr> 
                <td style={{textAlign: 'center'}} className="row2" width="1%">
                  <img src="/images/f_norm_no.svg" style={{border: 0}} alt="Обычная тема" />
                </td>
                <td className="row2">
                  <b><span className="drive">🍽️ Основы питания для набора массы</span></b>
                  <br />
                  <span className="forumdesc">Как правильно питаться для роста мышц</span>
                </td>
                <td style={{textAlign: 'center'}} className="row2">
                  <div className="topics_count">8</div>
                </td>
                <td className="row1" style={{whiteSpace: 'nowrap'}}>
                  <div className="last_poster_info">
                    <span className="drive">
                      <img src="/images/lastpost.svg" style={{border: 0}} alt="Последнее сообщение" />
                    </span>
                    22.6.2018, 12:15<br />
                    <b>Автор:</b> <span className="drive wi">Питание_Эксперт</span>
                  </div>
                </td>
              </tr>

              <tr> 
                <td style={{textAlign: 'center'}} className="row2" width="1%">
                  <img src="/images/f_norm_no.svg" style={{border: 0}} alt="Обычная тема" />
                </td>
                <td className="row2">
                  <b><span className="drive">💊 Спортпит для новичков</span></b>
                  <br />
                  <span className="forumdesc">Какие добавки действительно нужны начинающим</span>
                </td>
                <td style={{textAlign: 'center'}} className="row2">
                  <div className="topics_count">12</div>
                </td>
                <td className="row1" style={{whiteSpace: 'nowrap'}}>
                  <div className="last_poster_info">
                    <span className="drive">
                      <img src="/images/lastpost.svg" style={{border: 0}} alt="Последнее сообщение" />
                    </span>
                    05.6.2018, 18:22<br />
                    <b>Автор:</b> <span className="drive wi">Supplements</span>
                  </div>
                </td>
              </tr>

              <tr> 
                <td className="catend" colSpan={4}>
                  {/* no content */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <br />
        
        {/* Полезная информация */}
        <div className="borderwrap">
          <div className="formsubtitle">
            <b>📖 Полезная информация для новичков</b>
          </div>
          <div className="row1" style={{padding: '15px'}}>
            <h3 style={{color: '#2C5197', marginBottom: '10px'}}>🎯 С чего начать?</h3>
            <ol>
              <li><Link to="/encyclopedia" className="drive wi">📚 Прочитайте энциклопедию бодибилдинга</Link> - основы тренировок и питания</li>
              <li><strong>Определите цель:</strong> набор массы, похудение или поддержание формы</li>
              <li><strong>Выберите программу тренировок</strong> под ваш уровень подготовки</li>
              <li><strong>Составьте план питания</strong> в соответствии с целью</li>
              <li><strong>Начните тренироваться</strong> с правильной техникой</li>
            </ol>

            <h3 style={{color: '#2C5197', marginTop: '20px', marginBottom: '10px'}}>⚠️ Важные моменты</h3>
            <ul>
              <li><strong>Не торопитесь</strong> - результаты приходят постепенно</li>
              <li><strong>Изучайте технику</strong> - качество важнее веса</li>
              <li><strong>Восстановление</strong> - отдых не менее важен тренировок</li>
              <li><strong>Задавайте вопросы</strong> - опытные форумчане всегда помогут</li>
              <li><strong>Ведите дневник</strong> - отслеживайте прогресс</li>
            </ul>

            <h3 style={{color: '#2C5197', marginTop: '20px', marginBottom: '10px'}}>🔗 Полезные разделы форума</h3>
            <ul>
              <li><span className="drive wi">Тренировки</span> - программы и методики</li>
              <li><span className="drive wi">Питание</span> - диеты и рецепты</li>
              <li><span className="drive wi">Спортивное питание</span> - добавки и протеины</li>
              <li><span className="drive wi">Отчеты о прогрессе</span> - истории успеха</li>
            </ul>
          </div>
        </div>

        <br />

        {/* Последние сообщения */}
        <div className="borderwrap">
          <div className="formsubtitle">
            <b>📝 Последние сообщения в разделе</b>
          </div>
          <div className="row1" style={{padding: '10px'}}>
            <div style={{marginBottom: '10px'}}>
              <strong>11.9.2018, 21:01</strong> - <span className="drive wi">Егорычъ</span> в теме 
              <Link to="/encyclopedia" className="drive wi"> "Энциклопедия бодибилдинга!"</Link>
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>15.8.2018, 14:30</strong> - <span className="drive wi">Тренер</span> в теме 
              <span className="drive wi"> "Типичные ошибки новичков"</span>
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>10.7.2018, 16:45</strong> - <span className="drive wi">НовичокГод</span> в теме 
              <span className="drive wi"> "Первая программа тренировок"</span>
            </div>
          </div>
        </div>

        <br style={{clear: 'both'}} />
      </div>
    </div>
  );
};

export default Novice;
