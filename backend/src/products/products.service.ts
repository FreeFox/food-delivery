import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProductsService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    const [products] = await this.db.execute(
      'SELECT id, name, description, price, image, rating, reviews, category_id FROM products ORDER BY id',
    );
    return products;
  }

  async findOne(id: number) {
    const [products] = await this.db.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      throw new NotFoundException('Product not found');
    }
    return products[0];
  }
}
