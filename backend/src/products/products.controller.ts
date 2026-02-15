import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/products`)
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  async getAll() {
    return this.products.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }
}
