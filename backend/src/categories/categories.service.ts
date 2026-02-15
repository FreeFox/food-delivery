import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    const [categories] = await this.db.execute(
      'SELECT id, name, icon FROM categories ORDER BY id',
    );
    return categories;
  }

  async findOne(id: number) {
    const [categories] = await this.db.execute(
      'SELECT id, name, icon FROM categories WHERE id = ?',
      [id],
    );
    if (categories.length === 0) {
      throw new NotFoundException('Category not found');
    }
    return categories[0];
  }

  async create(dto: CreateCategoryDto) {
    const [category] = await this.db.execute(
      'INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)',
      [dto.id, dto.name, dto.icon],
    );
    return {};
  }
}
