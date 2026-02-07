import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  async getAll() {
    const data = await this.service.findAll();
    return { success: true, data, error: null };
  }
}
