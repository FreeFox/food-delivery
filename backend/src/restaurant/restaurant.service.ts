import { Injectable } from '@nestjs/common';
import { Prisma, Restaurant } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ReplaceRestaurantDto } from './dto/repace-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) { }

  async findById(id: string) : Promise<Restaurant | null> {
    return await this.prisma.restaurant.findUnique({
      where: { id },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RestaurantWhereUniqueInput;
    where?: Prisma.RestaurantWhereInput;
    orderBy?: Prisma.RestaurantOrderByWithRelationInput;
  }) : Promise<Restaurant[]> {
    return await this.prisma.restaurant.findMany({
      skip: params.skip,
      take: params.take,
      cursor: params.cursor,
      where: params.where,
      orderBy: params.orderBy,
    });
  }

  async create(data: CreateRestaurantDto) {
    const restaurantData : Prisma.RestaurantCreateInput = {
      id: data.id,
      name: data.name,
      address: data.address ?? '',
      rootCategory: {}
    }

    if (data.rootCategoryId) {
      restaurantData.rootCategory.connect = { id: data.rootCategoryId }
    }

    return await this.prisma.restaurant.create({
      data: restaurantData,
    });
  }

  async update(id: string, data: UpdateRestaurantDto) {
    // await this.db.execute('UPDATE restaurants SET name = ? WHERE id = ?', ['Updated Restaurant', id]);
    // return { id, name: 'Updated Restaurant' };
  }

  async replace(id: string, data: ReplaceRestaurantDto) {
    // await this.db.execute('UPDATE restaurants SET name = ? WHERE id = ?', ['Replaced Restaurant', id]);
    // return { id, name: 'Replaced Restaurant' };
  }

  async delete(id: string) {
    // await this.db.execute('DELETE FROM restaurants WHERE id = ?', [id]);
    // return { id };
  }
}
