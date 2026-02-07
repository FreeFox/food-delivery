import { Controller, Get } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('api/v1/restaurant')
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Get()
  async get() {
    const data = await this.service.getRestaurant();
    return { success: true, data, error: null };
  }
}
