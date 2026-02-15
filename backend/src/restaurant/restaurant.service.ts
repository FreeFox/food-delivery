import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RestaurantService {
  constructor(private db: DatabaseService) {}

  async findOne() {
    const [restaurants] = await this.db.execute('SELECT * FROM restaurants LIMIT 1');
    return restaurants.length > 0 ? restaurants[0] : null;
  }
}
