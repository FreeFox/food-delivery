import { Controller, Get } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/restaurant`)
export class RestaurantController {
  constructor(private restaurant: RestaurantService) {}

  @Get()
  async getRestaurants() {
    return this.restaurant.findAll();
  }

  @Get(':id')
  async getRestaurantById(id: string) {
    return this.restaurant.findById(id);
  }

}
