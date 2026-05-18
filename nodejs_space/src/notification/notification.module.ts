import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PushTokenController } from './push-token.controller';
import { ChatPresenceService } from './chat-presence.service';
import { ChatPresenceController } from './chat-presence.controller';

@Global()
@Module({
  controllers: [PushTokenController, ChatPresenceController],
  providers: [NotificationService, ChatPresenceService],
  exports: [NotificationService, ChatPresenceService],
})
export class NotificationModule {}
