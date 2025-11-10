import crypto from 'crypto'
import { Resend } from 'resend'

console.log('[EMAIL MODULE] ✅ Email module loaded with Resend')

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'admin@tarnovsky.ru'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tarnovsky.ru'
const BRAND_NAME = process.env.BRAND_NAME || 'Клинический Протокол Тарновского'

// Create Resend client
const resend = new Resend(RESEND_API_KEY)

// Generate secure token
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Professional Email Templates
const getEmailTemplate = (type: string, data: Record<string, unknown>) => {
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6; 
        color: #2c3e50;
        background: #f8f9fa;
        margin: 0;
        padding: 0;
      }
      .email-wrapper { 
        width: 100%; 
        background: #f8f9fa; 
        padding: 40px 20px; 
        min-height: 100vh;
      }
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      }
      .email-header { 
        background: linear-gradient(135deg,rgb(99, 120, 216) 0%,rgb(120, 120, 120) 100%);
          padding: 40px 30px;
        text-align: center;
        color: white;
      }
      .email-header h1 { 
        font-size: 28px; 
        font-weight: 700; 
        margin-bottom: 10px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .email-header .subtitle { 
        font-size: 16px; 
        opacity: 0.9;
        font-weight: 300;
      }
      .email-content { 
        padding: 40px 30px;
        background: white;
      }
      .email-content h2 {
        color: #2c3e50;
        font-size: 24px;
        margin-bottom: 20px;
        font-weight: 600;
      }
      .email-content p {
        margin-bottom: 16px;
        font-size: 16px;
        color: #5a6c7d;
      }
      .email-button { 
        display: inline-block; 
        padding: 16px 32px; 
        background: linear-gradient(135deg,rgb(99, 120, 216) 0%,rgb(100, 100, 100) 100%);
        color: white !important; 
        text-decoration: none; 
        border-radius: 8px; 
        margin: 24px 0;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      .email-button:hover { 
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }
      .email-link-box {
        background: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        word-break: break-all;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        color: #6c757d;
      }
      .email-warning { 
        background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
        border-left: 4px solid #e17055;
        padding: 20px; 
        border-radius: 8px; 
        margin: 24px 0;
        color: #2d3436;
      }
      .email-warning h3 {
        color: #2d3436;
        margin-bottom: 12px;
        font-size: 18px;
      }
      .email-warning ul {
        margin-left: 20px;
      }
      .email-warning li {
        margin-bottom: 8px;
      }
      .email-footer { 
        background: #2c3e50;
        padding: 30px;
        text-align: center;
        color: #bdc3c7;
      }
      .email-footer p {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .email-footer .brand {
        color: white;
        font-weight: 600;
        font-size: 16px;
      }
      .email-stats {
        display: flex;
        justify-content: space-around;
        margin: 30px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      .stat-item {
        text-align: center;
      }
      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #667eea;
        display: block;
      }
      .stat-label {
        font-size: 12px;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #dee2e6, transparent);
        margin: 30px 0;
      }
      @media only screen and (max-width: 600px) {
        .email-wrapper { padding: 20px 10px; }
        .email-header { padding: 30px 20px; }
        .email-content { padding: 30px 20px; }
        .email-footer { padding: 20px; }
        .email-header h1 { font-size: 24px; }
        .email-stats { flex-direction: column; gap: 15px; }
      }
    </style>
  `

  switch (type) {
    case 'password_reset':
      return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Сброс пароля - tarnovsky.ru</title>
          ${baseStyle}
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <h1>🔐 Сброс пароля</h1>
                <div class="subtitle">Восстановление доступа к аккаунту</div>
              </div>
              
              <div class="email-content">
                <h2>Здравствуйте, ${data.username}!</h2>
                
                <p>Мы получили запрос на сброс пароля для вашего аккаунта на <strong>tarnovsky.ru</strong>.</p>
                
                <p>Чтобы создать новый пароль, нажмите на кнопку ниже:</p>
                
                <div style="text-align: center;">
                  <a href="${data.resetUrl}" class="email-button">Сбросить пароль</a>
                </div>
                
                <div class="divider"></div>
                
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в адресную строку браузера:</p>
                <div class="email-link-box">${data.resetUrl}</div>
                
                <div class="email-warning">
                  <h3>⚠️ Важная информация:</h3>
                  <ul>
                    <li><strong>Срок действия:</strong> Ссылка действительна в течение 1 часа</li>
                    <li><strong>Безопасность:</strong> Никому не передавайте эту ссылку</li>
                    <li><strong>Не запрашивали?</strong> Просто проигнорируйте это письмо</li>
                    <li><strong>Проблемы?</strong> Обратитесь в службу поддержки</li>
                  </ul>
                </div>
                
                <div class="email-stats">
                  <div class="stat-item">
                    <span class="stat-number">1</span>
                    <span class="stat-label">Час</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">🔒</span>
                    <span class="stat-label">Безопасно</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">✓</span>
                    <span class="stat-label">Просто</span>
                  </div>
                </div>
              </div>
              
              <div class="email-footer">
                <p class="brand">Клинический Протокол Тарновского</p>
                <p>Это автоматическое письмо, не отвечайте на него.</p>
                <p>© 2025 Клинический Протокол Тарновского. Все права защищены.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

    case 'email_verification':
      return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение email - Клинический Протокол Тарновского</title>
          ${baseStyle}
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <h1>✉️ Подтверждение email</h1>
                <div class="subtitle">Добро пожаловать в Клинический Протокол Тарновского!</div>
              </div>
              
              <div class="email-content">
                <h2>Здравствуйте, ${data.username}!</h2>
                
                <p>Спасибо за регистрацию на <strong>Клинический Протокол Тарновского</strong>! Мы рады видеть вас в нашем сообществе.</p>
                
                <p>Для завершения регистрации и получения полного доступа ко всем функциям, пожалуйста, подтвердите ваш email адрес:</p>
                
                <div style="text-align: center;">
                  <a href="${data.verificationUrl}" class="email-button">Подтвердить email</a>
                </div>
                
                <div class="divider"></div>
                
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в адресную строку браузера:</p>
                <div class="email-link-box">${data.verificationUrl}</div>
                
                <div class="email-warning">
                  <h3>📋 Что дальше?</h3>
                  <ul>
                    <li><strong>Срок действия:</strong> Ссылка действительна 24 часа</li>
                    <li><strong>Полный доступ:</strong> После подтверждения вы сможете создавать темы и комментарии</li>
                    <li><strong>Безопасность:</strong> Подтвержденный email защищает ваш аккаунт</li>
                    <li><strong>Уведомления:</strong> Получайте важные обновления на email</li>
                  </ul>
                </div>
                
                <div class="email-stats">
                  <div class="stat-item">
                    <span class="stat-number">24</span>
                    <span class="stat-label">Часа</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">🎉</span>
                    <span class="stat-label">Добро пожаловать</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">🚀</span>
                    <span class="stat-label">Начнем</span>
                  </div>
                </div>
              </div>
              
              <div class="email-footer">
                <p class="brand">Клинический Протокол Тарновского</p>
                <p>Это автоматическое письмо, не отвечайте на него.</p>
                <p>© 2025 Клинический Протокол Тарновского. Все права защищены.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

    case 'email_change':
      return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Изменение email - Клинический Протокол Тарновского</title>
          ${baseStyle}
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <h1>📧 Изменение email адреса</h1>
                <div class="subtitle">Подтверждение нового адреса</div>
              </div>
              
              <div class="email-content">
                <h2>Здравствуйте, ${data.username}!</h2>
                
                <p>Вы запросили изменение email адреса для вашего аккаунта на <strong>Клинический Протокол Тарновского</strong>.</p>
                
                
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Старый адрес:</strong> ${data.oldEmail}</p>
                  <p style="margin: 8px 0 0 0;"><strong>Новый адрес:</strong> ${data.newEmail}</p>
                </div>
                
                <p>Чтобы подтвердить изменение, нажмите на кнопку ниже:</p>
                
                <div style="text-align: center;">
                  <a href="${data.confirmUrl}" class="email-button">Подтвердить изменение</a>
                </div>
                
                <div class="divider"></div>
                
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в адресную строку браузера:</p>
                <div class="email-link-box">${data.confirmUrl}</div>
                
                <div class="email-warning">
                  <h3>⚠️ Важная информация:</h3>
                  <ul>
                    <li><strong>Срок действия:</strong> Ссылка действительна в течение 2 часов</li>
                    <li><strong>Безопасность:</strong> После подтверждения старый email перестанет работать</li>
                    <li><strong>Не запрашивали?</strong> Просто проигнорируйте это письмо</li>
                    <li><strong>Доступ:</strong> Используйте новый email для входа в систему</li>
                  </ul>
                </div>
              </div>
              
              <div class="email-footer">
                <p class="brand">Клинический Протокол Тарновского</p>
                <p>Это автоматическое письмо, не отвечайте на него.</p>
                <p>© 2025 Клинический Протокол Тарновского. Все права защищены.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

    case 'welcome':
      return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Добро пожаловать - Клинический Протокол Тарновского</title>
          ${baseStyle}
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <h1>🎉 Добро пожаловать!</h1>
                <div class="subtitle">Ваш аккаунт успешно создан</div>
              </div>
              
              <div class="email-content">
                <h2>Здравствуйте, ${data.username}!</h2>
                
                <p>Поздравляем! Ваш аккаунт на <strong>Клинический Протокол Тарновского</strong> успешно создан и активирован.</p>
                
                <div class="email-stats">
                  <div class="stat-item">
                    <span class="stat-number">✓</span>
                    <span class="stat-label">Активирован</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">🚀</span>
                    <span class="stat-label">Готов к работе</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">🎯</span>
                    <span class="stat-label">Начнем</span>
                  </div>
                </div>
                
                <p>Теперь вы можете:</p>
                <ul>
                  <li>📝 Создавать новые темы для обсуждения</li>
                  <li>💬 Комментировать посты других пользователей</li>
                  <li>👥 Участвовать в сообществе разработчиков</li>
                  <li>🔔 Получать уведомления о новых ответах</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${data.loginUrl || SITE_URL}" class="email-button">Перейти на сайт</a>
                </div>
                
                <div class="divider"></div>
                
                <div class="email-warning">
                  <h3>💡 Полезные советы:</h3>
                  <ul>
                    <li><strong>Профиль:</strong> Заполните информацию о себе в настройках</li>
                    <li><strong>Безопасность:</strong> Используйте надежный пароль</li>
                    <li><strong>Участие:</strong> Будьте вежливы и конструктивны в обсуждениях</li>
                    <li><strong>Помощь:</strong> Обращайтесь к модераторам при необходимости</li>
                  </ul>
                </div>
              </div>
              
              <div class="email-footer">
                <p class="brand">Клинический Протокол Тарновского</p>
                <p>Спасибо, что присоединились к нашему сообществу!</p>
                <p>© 2025 Клинический Протокол Тарновского. Все права защищены.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}

// Send email function using Resend
export const sendEmail = async (
  to: string,
  subject: string,
  type: string,
  data: Record<string, unknown>
): Promise<boolean> => {
  try {
    if (!RESEND_API_KEY) {
      console.error('[EMAIL] ❌ RESEND_API_KEY not configured')
      return false
    }

    console.log('[EMAIL] =====================================')
    console.log(`[EMAIL] 📧 Preparing to send email with Resend`)
    console.log(`[EMAIL] To: ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] Type: ${type}`)
    console.log(`[EMAIL] From: ${FROM_EMAIL}`)

    const html = getEmailTemplate(type, data)

    console.log('[EMAIL] 📤 Sending email via Resend...')
    const result = await resend.emails.send({
      from: `${BRAND_NAME} <onboarding@resend.dev>`, // Resend requires verified domain or use onboarding@resend.dev for testing
      to: [to],
      subject,
      html
    })

    if (result.error) {
      console.error('[EMAIL] ❌ Resend error:', result.error)
      return false
    }

    console.log('[EMAIL] ✅ Email sent successfully!')
    console.log('[EMAIL] Email ID:', result.data?.id)
    console.log('[EMAIL] =====================================')
    return true
  } catch (error) {
    console.error('[EMAIL] =====================================')
    console.error('[EMAIL] ❌ FAILED to send email')
    console.error('[EMAIL] Error:', error)
    if (error instanceof Error) {
      console.error('[EMAIL] Error name:', error.name)
      console.error('[EMAIL] Error message:', error.message)
      console.error('[EMAIL] Error stack:', error.stack)
    }
    console.error('[EMAIL] =====================================')
    return false
  }
}

// Specific email functions
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
): Promise<boolean> => {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`
  
  return sendEmail(
    email,
    'Сброс пароля - Клинический Протокол Тарновского',
    'password_reset',
    { username, resetUrl }
  )
}

export const sendEmailVerificationEmail = async (
  email: string,
  username: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${SITE_URL}/auth/verify-email?token=${token}`
  
  return sendEmail(
    email,
    'Подтверждение email - Клинический Протокол Тарновского',
    'email_verification',
    { username, verificationUrl }
  )
}

export const sendEmailChangeConfirmation = async (
  newEmail: string,
  username: string,
  oldEmail: string,
  token: string
): Promise<boolean> => {
  const confirmUrl = `${SITE_URL}/auth/confirm-email-change?token=${token}`
  
  return sendEmail(
    newEmail,
    'Подтверждение изменения email - Клинический Протокол Тарновского',
    'email_change',
    { username, oldEmail, newEmail, confirmUrl }
  )
}

export const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<boolean> => {
  const loginUrl = `${SITE_URL}/auth/login`
  
  return sendEmail(
    email,
    'Добро пожаловать в Клинический Протокол Тарновского!',
    'welcome',
    { username, loginUrl }
  )
}


