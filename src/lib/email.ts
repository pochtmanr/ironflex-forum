import nodemailer from 'nodemailer'
import crypto from 'crypto'

console.log('[EMAIL MODULE] ✅ Email module loaded with Nodemailer')

// Email configuration for Timeweb
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.timeweb.ru'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' // true for 465, false for 587
const SMTP_USER = process.env.SMTP_USER || 'support@tarnovsky.ru'
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@tarnovsky.ru'
const FROM_NAME = process.env.FROM_NAME || 'Клинический Протокол Тарновского'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tarnovsky.ru'

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

const createTransporter = () => {
  if (!SMTP_PASS) {
    console.error('[EMAIL] ❌ SMTP_PASS not configured')
    return null
  }

  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true for 465, false for 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'SSLv3'
      },
      // Connection timeout
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    })

    console.log('[EMAIL] ✅ Transporter created successfully')
    console.log(`[EMAIL] Configuration: ${SMTP_HOST}:${SMTP_PORT} (secure: ${SMTP_SECURE})`)
    
    return transporter
  } catch (error) {
    console.error('[EMAIL] ❌ Failed to create transporter:', error)
    return null
  }
}

// Generate secure random token
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Professional Email Templates
const getEmailTemplate = (type: string, data: Record<string, unknown>) => {
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }
      .email-wrapper { 
        width: 100%; 
        padding: 40px 20px;
        background-color: #f5f5f5;
      }
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .email-header { 
        background: #2563eb;
        color: white;
        padding: 40px 30px 30px;
        text-align: center;
      }
      .email-header h1 { 
        font-size: 28px; 
        font-weight: 700;
        margin-bottom: 8px;
      }
      .email-header .subtitle { 
        font-size: 16px; 
        opacity: 0.95;
      }
      .email-icons {
        display: flex;
        justify-content: center;
        gap: 30px;
        padding: 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .email-icon-item {
        text-align: center;
      }
      .email-icon-item .icon {
        font-size: 32px;
        display: block;
        margin-bottom: 5px;
      }
      .email-icon-item .label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      .email-content { 
        padding: 40px 30px;
        background: white;
      }
      .email-content h2 {
        color: #1e293b;
        font-size: 22px;
        margin-bottom: 16px;
      }
      .email-content p {
        margin-bottom: 16px;
        color: #475569;
        line-height: 1.8;
      }
      .email-button { 
        display: inline-block; 
        padding: 14px 32px;
        background: #2563eb;
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
        transition: background 0.2s;
      }
      .email-button:hover { 
        background: #1d4ed8;
      }
      .email-link-box {
        background: #f1f5f9;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #2563eb;
        word-break: break-all;
        font-size: 13px;
        color: #64748b;
        margin: 15px 0;
      }
      .email-info-box { 
        background: #eff6ff;
        padding: 20px;
        border-radius: 6px;
        margin: 20px 0;
        border-left: 4px solid #2563eb;
      }
      .email-info-box h3 {
        color: #1e40af;
        font-size: 16px;
        margin-bottom: 10px;
      }
      .email-info-box ul {
        margin-left: 20px;
      }
      .email-info-box li {
        margin-bottom: 8px;
        color: #1e40af;
      }
      .email-footer { 
        background: #1e293b;
        color: white;
        padding: 30px;
        text-align: center;
      }
      .email-footer p {
        margin-bottom: 8px;
        opacity: 0.9;
        font-size: 14px;
      }
      .email-footer .brand {
        color: white;
        font-weight: 600;
        font-size: 18px;
      }
      @media only screen and (max-width: 600px) {
        .email-wrapper { padding: 20px 10px; }
        .email-header { padding: 30px 20px 20px; }
        .email-content { padding: 30px 20px; }
        .email-footer { padding: 20px; }
        .email-header h1 { font-size: 24px; }
        .email-icons { gap: 15px; }
      }
    </style>
  `

  switch (type) {
    case 'password_reset':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Сброс пароля - ${FROM_NAME}</title>
            ${baseStyle}
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-container">
                <div class="email-header">
                  <h1>Сброс пароля</h1>
                  <div class="subtitle">Восстановление доступа к аккаунту</div>
                </div>
                
                <div class="email-icons">
                  <div class="email-icon-item">
                    <span class="icon">⏰</span>
                    <span class="label">1 час</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">🔒</span>
                    <span class="label">Безопасно</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">✓</span>
                    <span class="label">Просто</span>
                  </div>
                </div>
                
                <div class="email-content">
                  <h2>Здравствуйте, ${data.username}!</h2>
                  
                  <p>Мы получили запрос на сброс пароля для вашего аккаунта на <strong>${FROM_NAME}</strong>.</p>
                  
                  <p>Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
                  
                  <div style="text-align: center;">
                    <a href="${data.resetUrl}" class="email-button">Сбросить пароль</a>
                  </div>
                  
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в адресную строку браузера:
                  </p>
                  <div class="email-link-box">${data.resetUrl}</div>
                  
                  <div class="email-info-box">
                    <h3>⚠️ Важная информация:</h3>
                    <ul>
                      <li><strong>Срок действия:</strong> Ссылка действительна в течение 1 часа</li>
                      <li><strong>Безопасность:</strong> Никому не передавайте эту ссылку</li>
                      <li><strong>Не запрашивали?</strong> Просто проигнорируйте это письмо</li>
                    </ul>
                  </div>
                </div>
                
                <div class="email-footer">
                  <p class="brand">${FROM_NAME}</p>
                  <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                  <p style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
                    © ${new Date().getFullYear()} ${FROM_NAME}. Все права защищены.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    case 'email_verification':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Подтверждение email - ${FROM_NAME}</title>
            ${baseStyle}
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-container">
                <div class="email-header">
                  <h1>Подтверждение email</h1>
                  <div class="subtitle">Добро пожаловать в ${FROM_NAME}!</div>
                </div>
                
                <div class="email-icons">
                  <div class="email-icon-item">
                    <span class="icon">✉️</span>
                    <span class="label">Подтвердите</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">⏰</span>
                    <span class="label">24 часа</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">🎉</span>
                    <span class="label">Готово!</span>
                  </div>
                </div>
                
                <div class="email-content">
                  <h2>Здравствуйте, ${data.username}!</h2>
                  
                  <p>Спасибо за регистрацию на <strong>${FROM_NAME}</strong>!</p>
                  
                  <p>Для завершения регистрации и получения полного доступа ко всем функциям, пожалуйста, подтвердите ваш email адрес:</p>
                  
                  <div style="text-align: center;">
                    <a href="${data.verificationUrl}" class="email-button">Подтвердить email</a>
                  </div>
                  
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в адресную строку браузера:
                  </p>
                  <div class="email-link-box">${data.verificationUrl}</div>
                  
                  <div class="email-info-box">
                    <h3>📋 Что дальше?</h3>
                    <ul>
                      <li><strong>Полный доступ:</strong> После подтверждения вы сможете создавать темы и комментарии</li>
                      <li><strong>Безопасность:</strong> Подтвержденный email защищает ваш аккаунт</li>
                      <li><strong>Уведомления:</strong> Получайте важные обновления на email</li>
                    </ul>
                  </div>
                </div>
                
                <div class="email-footer">
                  <p class="brand">${FROM_NAME}</p>
                  <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                  <p style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
                    © ${new Date().getFullYear()} ${FROM_NAME}. Все права защищены.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    case 'welcome':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Добро пожаловать - ${FROM_NAME}</title>
            ${baseStyle}
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-container">
                <div class="email-header">
                  <h1>Добро пожаловать!</h1>
                  <div class="subtitle">Ваш аккаунт успешно активирован</div>
                </div>
                
                <div class="email-icons">
                  <div class="email-icon-item">
                    <span class="icon">📝</span>
                    <span class="label">Создавайте</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">💬</span>
                    <span class="label">Общайтесь</span>
                  </div>
                  <div class="email-icon-item">
                    <span class="icon">🎓</span>
                    <span class="label">Учитесь</span>
                  </div>
                </div>
                
                <div class="email-content">
                  <h2>Здравствуйте, ${data.username}!</h2>
                  
                  <p>Поздравляем! Ваш email успешно подтвержден, и теперь у вас есть полный доступ к <strong>${FROM_NAME}</strong>.</p>
                  
                  <p>Начните с изучения наших разделов и присоединяйтесь к обсуждениям!</p>
                  
                  <div style="text-align: center;">
                    <a href="${data.loginUrl || SITE_URL}" class="email-button">Перейти на сайт</a>
                  </div>
                  
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    Если у вас есть вопросы, не стесняйтесь обращаться к нашему сообществу!
                  </p>
                  
                  <div class="email-info-box">
                    <h3>💡 Полезные советы:</h3>
                    <ul>
                      <li>Заполните свой профиль для лучшего взаимодействия</li>
                      <li>Подпишитесь на интересующие вас темы</li>
                      <li>Соблюдайте правила сообщества</li>
                    </ul>
                  </div>
                </div>
                
                <div class="email-footer">
                  <p class="brand">${FROM_NAME}</p>
                  <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                  <p style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
                    © ${new Date().getFullYear()} ${FROM_NAME}. Все права защищены.
                  </p>
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

// Send email function using Nodemailer
export const sendEmail = async (
  to: string,
  subject: string,
  type: string,
  data: Record<string, unknown>
): Promise<boolean> => {
  try {
    if (!SMTP_PASS) {
      console.error('[EMAIL] ❌ SMTP_PASS not configured')
      return false
    }

    console.log('[EMAIL] =====================================')
    console.log(`[EMAIL] 📧 Preparing to send email with Nodemailer`)
    console.log(`[EMAIL] To: ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] Type: ${type}`)
    console.log(`[EMAIL] From: ${FROM_EMAIL}`)

    const html = getEmailTemplate(type, data)

    // Create or reuse transporter
    const emailTransporter = transporter || createTransporter()
    
    if (!emailTransporter) {
      console.error('[EMAIL] ❌ Failed to create email transporter')
      return false
    }

    // Verify connection
    console.log('[EMAIL] 🔍 Verifying SMTP connection...')
    await emailTransporter.verify()
    console.log('[EMAIL] ✅ SMTP connection verified')

    console.log('[EMAIL] 📤 Sending email...')
    const info = await emailTransporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log('[EMAIL] ✅ Email sent successfully!')
    console.log('[EMAIL] Message ID:', info.messageId)
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

export const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<boolean> => {
  const loginUrl = SITE_URL
  
  return sendEmail(
    email,
    'Добро пожаловать в Клинический Протокол Тарновского!',
    'welcome',
    { username, loginUrl }
  )
}

