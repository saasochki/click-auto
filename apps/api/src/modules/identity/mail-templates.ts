import type { Locale } from '@clickauto/shared';
import type { MailMessage } from '../../infra/mail.service';

const TEXTS: Record<Locale, { subject: string; body: (code: string) => string }> = {
  ru: {
    subject: 'Код для входа в ClickAuto',
    body: (code) =>
      `Ваш код для входа: ${code}\n\nКод действует 10 минут. Если вы не запрашивали код, просто проигнорируйте это письмо.\n\nClickAuto`,
  },
  ro: {
    subject: 'Codul de conectare la ClickAuto',
    body: (code) =>
      `Codul dvs. de conectare: ${code}\n\nCodul este valabil 10 minute. Dacă nu ați solicitat codul, ignorați acest e-mail.\n\nClickAuto`,
  },
};

export function otpMail(to: string, code: string, locale: Locale): MailMessage {
  const texts = TEXTS[locale];
  return { to, subject: texts.subject, text: texts.body(code) };
}
