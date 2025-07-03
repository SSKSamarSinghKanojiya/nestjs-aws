import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { DatabaseModule } from './database/database.module';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  // imports: [ItemsModule],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env', // Optional: Load custom .env file
    }),
    // Other modules...
    ItemsModule
  ],
  // imports: [DatabaseModule, ItemsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
