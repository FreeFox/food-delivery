import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    RestaurantModule,
    CategoriesModule,
    ProductsModule,
    AuthModule,
    PrismaModule,
    ProfilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
