import { Module } from '@nestjs/common';
import { MailServiceModule } from './mail/mail.module';

@Module({
  imports: [MailServiceModule],
  exports: [MailServiceModule],
})
export class IntegrationsModule {}
