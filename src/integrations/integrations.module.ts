import { Module } from '@nestjs/common';
import { MailServiceModule } from './mail/mail.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [MailServiceModule, PushModule],
  exports: [MailServiceModule, PushModule],
})
export class IntegrationsModule {}
