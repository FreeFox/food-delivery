import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { InitDbService } from './init-db.service';

@Global()
@Module({
  providers: [DatabaseService, InitDbService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
