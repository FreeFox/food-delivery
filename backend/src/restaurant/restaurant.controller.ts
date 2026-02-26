import { Body, Controller, Get, Patch, Post, Put, Delete } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

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

  @Post()
  async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurant.create(createRestaurantDto);
  }

  @Patch(':id')
  async updateRestaurant(id: string) {
    return this.restaurant.update(id);
  }

  @Put(':id')
  async replaceRestaurant(id: string) {
    return this.restaurant.replace(id);
  }

  @Delete(':id')
  async deleteRestaurant(id: string) {
    return this.restaurant.delete(id);
  }
}
