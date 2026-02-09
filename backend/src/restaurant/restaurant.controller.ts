import { Controller, Get } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/restaurant`)
export class RestaurantController {
  constructor(private restaurant: RestaurantService) {}

  @Get()
  async getRestaurant() {
    return this.restaurant.findOne();
  }
}
