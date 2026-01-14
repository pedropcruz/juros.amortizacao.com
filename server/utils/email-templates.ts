// Email template utilities for consistent styling across all emails (Dark Mode / Emerald)

// Design System Tokens (Dark Mode + Emerald)
const COLORS = {
  background: '#0f172a', // Slate 900
  surface: '#1e293b', // Slate 800
  text: {
    heading: '#f1f5f9', // Slate 100
    body: '#cbd5e1', // Slate 300
    muted: '#94a3b8', // Slate 400
    inverted: '#ffffff' // White
  },
  primary: '#10b981', // Emerald 500
  primaryDark: '#059669', // Emerald 600
  border: '#334155', // Slate 700
  state: {
    info: {
      bg: 'rgba(56, 189, 248, 0.1)', // Sky 500/10
      border: '#0ea5e9', // Sky 500
      text: '#7dd3fc' // Sky 300
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)', // Amber 500/10
      border: '#f59e0b', // Amber 500
      text: '#fcd34d' // Amber 300
    }
  }
}

const FONTS = '\'Public Sans\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif'

interface EmailLayoutOptions {
  preheader?: string
}

/**
 * Base email layout wrapper with consistent Dark Mode styling
 */
export function emailLayout(content: string, options: EmailLayoutOptions = {}): string {
  const { preheader = '' } = options

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Juros</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      background-color: ${COLORS.background};
      font-family: ${FONTS};
      -webkit-font-smoothing: antialiased;
      color: ${COLORS.text.body};
    }
    table { border-collapse: separate; border-spacing: 0; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${COLORS.primary}; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; color: ${COLORS.primaryDark}; }

    .button:hover { background-color: ${COLORS.primaryDark} !important; }

    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px 16px !important; }
      .content { padding: 32px 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: ${FONTS}; color: ${COLORS.text.body};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; color: ${COLORS.background}; line-height: 1px; opacity: 0;">${preheader}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 600px; margin: 0 auto;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Icon -->
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <div style="width: 32px; height: 32px; background-color: ${COLORS.primary}; border-radius: 8px; display: block;">
                      <!-- Simple geometric logo representation if image not available -->
                      <div style="width: 16px; height: 16px; margin: 8px; background-color: ${COLORS.background}; border-radius: 50%; opacity: 0.3;"></div>
                    </div>
                  </td>
                  <td style="font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; letter-spacing: -0.025em; vertical-align: middle;">
                    Juros
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.surface}; border-radius: 16px; border: 1px solid ${COLORS.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <tr>
                  <td class="content" style="padding: 48px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-family: ${FONTS}; font-size: 13px; color: ${COLORS.text.muted}; text-align: center; line-height: 1.6;">
                    <p style="margin: 0 0 16px 0;">
                      <a href="https://juros.amortizacao.com" style="color: ${COLORS.text.muted}; text-decoration: none;">juros.amortizacao.com</a>
                      <span style="margin: 0 8px;">•</span>
                      Simulador de Crédito Habitação
                    </p>
                    <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                      Enviado com ❤️ pela equipa juros.ammortizacao.com                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Primary action button
 */
export function emailButton(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="${url}" target="_blank" class="button" style="display: inline-block; padding: 16px 32px; font-family: ${FONTS}; font-size: 16px; font-weight: 600; color: ${COLORS.text.inverted}; background-color: ${COLORS.primary}; text-decoration: none; border-radius: 12px; transition: background-color 0.2s ease; text-align: center; mso-padding-alt: 0;">
        <!--[if mso]>
        <i style="letter-spacing: 32px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i>
        <![endif]-->
        <span style="mso-text-raise: 15pt; color: #000000;">${text}</span>
        <!--[if mso]>
        <i style="letter-spacing: 32px; mso-font-width: -100%;">&nbsp;</i>
        <![endif]-->
      </a>
    </td>
  </tr>
</table>`
}

/**
 * Info/warning box
 */
export function emailInfoBox(content: string, type: 'info' | 'warning' = 'info'): string {
  const styles = type === 'warning' ? COLORS.state.warning : COLORS.state.info

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td style="background-color: ${styles.bg}; border: 1px solid ${styles.border}; padding: 20px; border-radius: 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family: ${FONTS}; font-size: 14px; color: ${styles.text}; line-height: 1.6; mso-line-height-rule: exactly;">
            ${content}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

// ============================================
// Email Templates
// ============================================

export function verifyEmailTemplate(userName: string, verifyUrl: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Verifique o seu email
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${userName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Bem-vindo ao <strong>Juros</strong>! 👋<br>
  Estamos muito felizes por o ter connosco. Para começar a simular e poupar no seu crédito habitação, só precisa de confirmar o seu email.
</p>

${emailButton('Verificar o meu Email', verifyUrl)}

<p style="margin: 0; font-family: ${FONTS}; font-size: 14px; color: ${COLORS.text.muted}; line-height: 1.6; text-align: center;">
  Se não criou uma conta no Juros, pode ignorar este email com segurança.
</p>`

  return emailLayout(content, { preheader: 'Bem-vindo ao Juros! Confirme o seu email para começar.' })
}

export function resetPasswordTemplate(userName: string, resetUrl: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Redefinir palavra-passe
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${userName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Recebemos um pedido para recuperar o acesso à sua conta. Não se preocupe, acontece aos melhores! 🔐
</p>

${emailButton('Criar Nova Palavra-passe', resetUrl)}

${emailInfoBox('Se não pediu esta alteração, pode ignorar este email. A sua palavra-passe atual permanecerá segura e inalterada.', 'info')}`

  return emailLayout(content, { preheader: 'Recuperação de acesso à sua conta Juros' })
}

export function changeEmailVerificationTemplate(userName: string, newEmail: string, verifyUrl: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Confirme o novo email
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${userName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Recebemos um pedido para atualizar o email da sua conta para <strong>${newEmail}</strong>.
  Para concluir esta alteração, clique no botão abaixo.
</p>

${emailButton('Confirmar Alteração', verifyUrl)}

${emailInfoBox('Se não pediu esta alteração, por favor ignore este email e a sua conta permanecerá inalterada.', 'info')}`

  return emailLayout(content, { preheader: 'Confirme a atualização do seu endereço de email' })
}

export function changeEmailNotificationTemplate(userName: string, newEmail: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Atualização de segurança
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${userName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  O endereço de email associado à sua conta foi alterado para: <strong>${newEmail}</strong>
</p>
<p style="margin: 16px 0 0 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Se foi você, verifique a caixa de entrada do novo email para confirmar a alteração.
</p>

${emailInfoBox('⚠️ Se não reconhece esta ação, é possível que alguém tenha acedido à sua conta. Recomendamos que redefina a sua palavra-passe imediatamente.', 'warning')}`

  return emailLayout(content, { preheader: 'Alerta de segurança: Alteração de email solicitada' })
}

export function nameChangedTemplate(userName: string, newName: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Perfil atualizado
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${newName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  O nome da sua conta foi atualizado com sucesso. Esperamos que goste da mudança! ✨
</p>

${emailInfoBox('Se não reconhece esta alteração, verifique a segurança da sua conta imediatamente.', 'warning')}`

  return emailLayout(content, { preheader: 'O seu nome de perfil foi atualizado' })
}

export function passwordChangedTemplate(userName: string): string {
  const content = `
<h1 style="margin: 0 0 24px 0; font-family: ${FONTS}; font-size: 24px; font-weight: 700; color: ${COLORS.text.heading}; text-align: center;">
  Palavra-passe alterada
</h1>
<p style="margin: 0 0 16px 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Olá <strong>${userName}</strong>,
</p>
<p style="margin: 0; font-family: ${FONTS}; font-size: 16px; color: ${COLORS.text.body}; line-height: 1.6;">
  Esta é uma confirmação de que a palavra-passe da sua conta foi alterada recentemente.
</p>

${emailInfoBox('⚠️ Se não reconhece esta alteração, contacte o suporte ou redefina a sua palavra-passe imediatamente.', 'warning')}`

  return emailLayout(content, { preheader: 'Alerta de segurança: A sua palavra-passe foi alterada' })
}
