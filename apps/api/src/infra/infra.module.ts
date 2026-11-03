import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RedisModule } from './redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [MailService],
  exports: [MailService, RedisModule],
})
export class InfraModule {}
