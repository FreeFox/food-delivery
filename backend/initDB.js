const pool = require('./db');

async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Create restaurants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100),
        rating DECIMAL(3, 1) DEFAULT 4.5,
        reviews INT DEFAULT 0,
        delivery_time VARCHAR(50),
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `);

    // Create products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT,
        category_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image TEXT,
        rating DECIMAL(3, 1) DEFAULT 4.5,
        reviews INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Create product ratings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id VARCHAR(255),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create assets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        url TEXT NOT NULL,
        type VARCHAR(50),
        size INT,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    console.log('✓ Database tables initialized successfully');

    // Check if default restaurant exists
    const [restaurants] = await connection.execute('SELECT COUNT(*) as count FROM restaurants');
    if (restaurants[0].count === 0) {
      // Insert default restaurant
      await connection.execute(`
        INSERT INTO restaurants (name, cuisine, rating, reviews, delivery_time, image) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'Delicious Eats',
        'International',
        4.8,
        342,
        '30-45 mins',
        'https://placehold.co/1200x400?text=Delicious+Eats'
      ]);

      const [restaurantRes] = await connection.execute('SELECT id FROM restaurants WHERE name = ?', ['Delicious Eats']);
      const restaurantId = restaurantRes[0].id;

      // Insert default categories
      const categories = [
        { name: 'Appetizers', icon: '🥗' },
        { name: 'Main Courses', icon: '🍔' },
        { name: 'Desserts', icon: '🍰' },
        { name: 'Beverages', icon: '🍹' }
      ];

      const categoryIds = {};
      for (let i = 0; i < categories.length; i++) {
        await connection.execute(
          'INSERT INTO categories (restaurant_id, name, icon) VALUES (?, ?, ?)',
          [restaurantId, categories[i].name, categories[i].icon]
        );
        const [catRes] = await connection.execute(
          'SELECT id FROM categories WHERE name = ? AND restaurant_id = ?',
          [categories[i].name, restaurantId]
        );
        categoryIds[categories[i].name] = catRes[0].id;
      }

      // Insert default products
      const products = [
        { name: 'Burger Deluxe', price: 12.99, rating: 4.7, category: 'Main Courses', image: 'https://placehold.co/300x200?text=Burger', description: 'Juicy burger with cheese, lettuce, and special sauce' },
        { name: 'Caesar Salad', price: 8.99, rating: 4.5, category: 'Appetizers', image: 'https://placehold.co/300x200?text=Salad', description: 'Fresh romaine lettuce with croutons and parmesan' },
        { name: 'Chocolate Cake', price: 6.99, rating: 4.9, category: 'Desserts', image: 'https://placehold.co/300x200?text=Cake', description: 'Rich chocolate cake with chocolate frosting' },
        { name: 'Fresh Orange Juice', price: 4.99, rating: 4.6, category: 'Beverages', image: 'https://placehold.co/300x200?text=Juice', description: 'Freshly squeezed orange juice' }
      ];

      for (const product of products) {
        await connection.execute(
          'INSERT INTO products (restaurant_id, category_id, name, price, rating, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [restaurantId, categoryIds[product.category], product.name, product.price, product.rating, product.image, product.description]
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

module.exports = initializeDatabase;
