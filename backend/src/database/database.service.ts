import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: mysql.Pool;

  constructor(private config: ConfigService) {
    this.pool = mysql.createPool({
      host: this.config.get('DB_HOST') || this.config.get('DATABASE_HOST') || 'localhost',
      port: this.config.get('DB_PORT') || this.config.get('DATABASE_PORT') || 3306,
      user: this.config.get('DB_USER') || this.config.get('DATABASE_USER') || 'root',
      password: this.config.get('DB_PASSWORD') || this.config.get('DATABASE_PASSWORD') || '',
      database: this.config.get('DB_NAME') || this.config.get('DATABASE_NAME') || 'food_delivery',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }

  getPool(): mysql.Pool {
    return this.pool;
  }

  async execute<T = unknown>(sql: string, params?: unknown[]): Promise<[T[], mysql.FieldPacket[]]> {
    return this.pool.execute(sql, params) as Promise<[T[], mysql.FieldPacket[]]>;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
