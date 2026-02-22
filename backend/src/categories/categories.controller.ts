import { Controller, Get, Post, Param, Body, Patch, Put, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReplaceCategoryDto } from './dto/replace-category.dto';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/categories`)
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  async getAll() {
    return this.categories.findAll({});
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.categories.findOne({ id });
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Put(':id')
  async replace(@Param('id') id: string, @Body() dto: ReplaceCategoryDto) {
    return this.categories.replace(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categories.delete(id);
  }
}
