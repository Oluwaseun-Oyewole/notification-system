import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

export interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async send(options: SendMailOptions) {
    const { to, subject, template, context } = options;

    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
