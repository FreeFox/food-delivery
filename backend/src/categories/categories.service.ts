import { HttpStatus, Injectable, NotFoundException, HttpException } from '@nestjs/common';
import type { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReplaceCategoryDto } from './dto/replace-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }) {
    return await this.prisma.category.findMany({
      skip: params.skip,
      take: params.take,
      cursor: params.cursor,
      where: params.where,
      orderBy: params.orderBy,
    });
  }

  async findOne(categoryWhereUniqueInput: Prisma.CategoryWhereUniqueInput) : Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
        where: categoryWhereUniqueInput,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({
          data: {
            ...dto,
            icon: dto.icon || '', // Set to empty string if not provided
          }
      });
    } catch (error) {
      throw new HttpException('Failed to create category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(where: Prisma.CategoryWhereUniqueInput, data: UpdateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.update({
          where,
          data: {
            ...data
          }
      });
    } catch (error) {
      throw new HttpException('Failed to update category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async replace(where: Prisma.CategoryWhereUniqueInput, data: ReplaceCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.update({
          where,
          data: {
            ...data,
            icon: data.icon || '', // Set to empty string if not provided
          }
      });
    } catch (error) {
      throw new HttpException('Failed to replace category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    try {
      return await this.prisma.category.delete({
          where
      });
    } catch (error) {
      throw new HttpException('Failed to delete category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
