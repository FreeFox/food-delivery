import { Controller, Get, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { CreateCategoryDto } from './dto/create-category.dto';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/categories`)
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  async getAll() {
    return this.categories.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.categories.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }
}
