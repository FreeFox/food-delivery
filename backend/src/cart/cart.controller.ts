import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDto, CheckoutDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/cart')
export class CartController {
  constructor(private cart: CartService) {}

  @Get(':userId')
  async get(@Param('userId') userId: string) {
    const data = await this.cart.getCart(userId);
    return { success: true, data, error: null };
  }

  @Post(':userId')
  async set(@Param('userId') userId: string, @Body() body: CartDto) {
    await this.cart.setCart(userId, body);
    return { success: true, data: body, error: null };
  }

  // Protected checkout endpoint - requires valid JWT
  @UseGuards(JwtAuthGuard)
  @Post(':userId/checkout')
  async checkout(@Param('userId') userId: string, @Body() body: CheckoutDto) {
    // Minimal implementation: validate cart exists and clear it
    try {
      const cart = await this.cart.getCart(userId);
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new HttpException({ success: false, data: null, error: 'Cart empty' }, HttpStatus.BAD_REQUEST);
      }
      // Future: create order in DB
      await this.cart.clearCart(userId);
      return { success: true, data: { message: 'Order placed (stub)' }, error: null };
    } catch (e: any) {
      throw new HttpException({ success: false, data: null, error: e.message || 'Checkout failed' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
