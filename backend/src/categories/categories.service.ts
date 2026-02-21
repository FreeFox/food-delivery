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
        include: {
          parent: true,
          children: true,
        }
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({
          data: {
            ...data,
            icon: data.icon || '', // Set to empty string if not provided
            parentId: data.parentId || null, // Set to null if not provided
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }

  async replace(where: Prisma.CategoryWhereUniqueInput, data: ReplaceCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.update({
          where,
          data: {
            ...data,
            icon: data.icon || '', // Set to empty string if not provided
            parentId: data.parentId || null, // Set to null if not provided
          }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }

  async delete(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    try {
      return await this.prisma.category.delete({
          where
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }
}
