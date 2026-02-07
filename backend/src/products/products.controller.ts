import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  async all() {
    const data = await this.service.findAll();
    return { success: true, data, error: null };
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const data = await this.service.findOne(Number(id));
    return { success: true, data, error: null };
  }
}
