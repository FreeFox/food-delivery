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

  async create(data: CreateRestaurantDto) : Promise<Restaurant> {
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

  async update(id: string, data: UpdateRestaurantDto) : Promise<Restaurant> {
    const updateData: Prisma.RestaurantUpdateInput = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
    };

    if (data.rootCategoryId !== undefined) {
        updateData.rootCategory = data.rootCategoryId != null
            ? { connect: { id: data.rootCategoryId } }
            : {};
    }

    return this.prisma.restaurant.update({
        where: { id },
        data: updateData,
    });
  }

  async replace(id: string, data: ReplaceRestaurantDto) : Promise<Restaurant> {
    const restaurantData : Prisma.RestaurantUpdateInput = {
      name: data.name,
      address: data.address ?? '',
      rootCategory: {}
    }

    if (data.rootCategoryId && restaurantData.rootCategory) {
      restaurantData.rootCategory.connect = { id: data.rootCategoryId }
    }

    return this.prisma.restaurant.update({
        where: { id },
        data: restaurantData
    });
  }

  async delete(id: string) : Promise<Restaurant> {
    return this.prisma.restaurant.delete({
        where: { id },
    });
  }
}
