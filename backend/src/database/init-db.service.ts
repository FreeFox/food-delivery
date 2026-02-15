import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import type { RowDataPacket } from 'mysql2/promise';

@Injectable()
export class InitDbService implements OnModuleInit {
  constructor(private db: DatabaseService) {}

  async onModuleInit() {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const connection = await this.db.getPool().getConnection();

    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS food_delivery');
      await connection.query('USE food_delivery');

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name CHAR(255) NOT NULL,
          cuisine CHAR(100),
          rating TINYINT UNSIGNED DEFAULT 45,
          reviews INT DEFAULT 0,
          delivery_time VARCHAR(50),
          image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT,
          name CHAR(100) NOT NULL,
          icon CHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
        )
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT,
          category_id INT,
          name CHAR(255) NOT NULL,
          description TEXT,
          price INT UNSIGNED NOT NULL,
          image TEXT,
          rating TINYINT UNSIGNED DEFAULT 45,
          reviews INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS product_ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          user_id CHAR(255),
          rating INT CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id CHAR(255) PRIMARY KEY,
          email CHAR(255) UNIQUE NOT NULL,
          password CHAR(255) NOT NULL,
          first_name CHAR(100),
          last_name CHAR(100),
          phone CHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS assets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name CHAR(255),
          url TEXT NOT NULL,
          type CHAR(50),
          size INT,
          uploaded_by CHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
      `);

      console.log('✓ Database tables initialized successfully');

      const [restaurants] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM restaurants',
      );
      if ((restaurants[0] as RowDataPacket).count === 0) {
        await connection.execute(
          `INSERT INTO restaurants (name, cuisine, rating, reviews, delivery_time, image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['Delicious Eats', 'International', 48, 342, '30-45 mins', 'https://placehold.co/1200x400?text=Delicious+Eats'],
        );

        const [restaurantRes] = await connection.execute<RowDataPacket[]>(
          "SELECT id FROM restaurants WHERE name = ?",
          ['Delicious Eats'],
        );
        const restaurantId = restaurantRes[0].id;

        const categories = [
          { name: 'Appetizers', icon: '🥗' },
          { name: 'Main Courses', icon: '🍔' },
          { name: 'Desserts', icon: '🍰' },
          { name: 'Beverages', icon: '🍹' },
        ];

        const categoryIds: Record<string, number> = {};
        for (const cat of categories) {
          await connection.execute(
            'INSERT INTO categories (restaurant_id, name, icon) VALUES (?, ?, ?)',
            [restaurantId, cat.name, cat.icon],
          );
          const [catRes] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM categories WHERE name = ? AND restaurant_id = ?',
            [cat.name, restaurantId],
          );
          categoryIds[cat.name] = catRes[0].id;
        }

        const products = [
          {
            name: 'Burger Deluxe',
            price: 1299,
            rating: 47,
            category: 'Main Courses',
            image: 'https://placehold.co/300x200?text=Burger',
            description: 'Juicy burger with cheese, lettuce, and special sauce',
          },
          {
            name: 'Caesar Salad',
            price: 899,
            rating: 45,
            category: 'Appetizers',
            image: 'https://placehold.co/300x200?text=Salad',
            description: 'Fresh romaine lettuce with croutons and parmesan',
          },
          {
            name: 'Chocolate Cake',
            price: 699,
            rating: 49,
            category: 'Desserts',
            image: 'https://placehold.co/300x200?text=Cake',
            description: 'Rich chocolate cake with chocolate frosting',
          },
          {
            name: 'Fresh Orange Juice',
            price: 499,
            rating: 46,
            category: 'Beverages',
            image: 'https://placehold.co/300x200?text=Juice',
            description: 'Freshly squeezed orange juice',
          },
        ];

        for (const product of products) {
          await connection.execute(
            'INSERT INTO products (restaurant_id, category_id, name, price, rating, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              restaurantId,
              categoryIds[product.category],
              product.name,
              product.price,
              product.rating,
              product.image,
              product.description,
            ],
          );
        }

        console.log('✓ Default data inserted successfully');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      process.exit(1);
    } finally {
      connection.release();
    }
  }
}
