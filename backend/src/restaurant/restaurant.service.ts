import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RestaurantService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    const [restaurants] = await this.db.execute('SELECT * FROM restaurants WHERE id = ?', [id]);
    return restaurants.length > 0 ? restaurants[0] : null;
  }

  async findAll() {
    const [restaurants] = await this.db.execute('SELECT * FROM restaurants');
    return restaurants;
  }

  async create() {
    const [result] = await this.db.execute('INSERT INTO restaurants (name) VALUES (?)', ['New Restaurant']);
    return { id: result.insertId, name: 'New Restaurant' };
  }

  async update(id: string) {
    await this.db.execute('UPDATE restaurants SET name = ? WHERE id = ?', ['Updated Restaurant', id]);
    return { id, name: 'Updated Restaurant' };
  }

  async replace(id: string) {
    await this.db.execute('UPDATE restaurants SET name = ? WHERE id = ?', ['Replaced Restaurant', id]);
    return { id, name: 'Replaced Restaurant' };
  }

  async delete(id: string) {
    await this.db.execute('DELETE FROM restaurants WHERE id = ?', [id]);
    return { id };
  }
}
