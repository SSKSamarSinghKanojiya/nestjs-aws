import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], 
})
export class DatabaseModule {}
// src/database/database.module.ts
// import { Module } from '@nestjs/common';
// import { DatabaseService } from './database.service';

// @Module({
//   providers: [
//     {
//       provide: 'DATABASE_SERVICE',
//       useClass: DatabaseService,
//     },
//   ],
//   exports: ['DATABASE_SERVICE'],
// })
// export class DatabaseModule {}