import { Module } from '@nestjs/common';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    PrismaModule,
    RestaurantsModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    CartModule,
  ],
})
export class AppModule {}
