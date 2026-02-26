import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReplaceCategoryDto } from './dto/replace-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }) {
    return this.prisma.category.findMany({
      skip: params.skip,
      take: params.take,
      cursor: params.cursor,
      where: params.where,
      orderBy: params.orderBy,
    });
  }

  async findOne(categoryWhereUniqueInput: Prisma.CategoryWhereUniqueInput): Promise<Category> {
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
    return this.prisma.$transaction(async (tx) => {
      if (data.parentId) {
        if (data.parentId === data.id) {
          throw new BadRequestException('Category cannot be parent of itself');
        }

        await this.validateNoCycle(tx, data.id, data.parentId);
      }

      try {
        return await tx.category.create({
          data: {
            id: data.id,
            name: data.name,
            icon: data.icon ?? '',
            parent: data.parentId
              ? { connect: { id: data.parentId } }
              : undefined,
          }
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('Category with this id already exists');
        }
        throw error;
      }
    });
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      if (data.parentId) {
        if (data.parentId === id) {
          throw new BadRequestException('Category cannot be parent of itself');
        }
        await this.validateNoCycle(tx, id, data.parentId);
      }

      const updateData: Prisma.CategoryUpdateInput = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.parentId !== undefined && {
          parent: data.parentId
            ? { connect: { id: data.parentId } }
            : { disconnect: true },
        }),
      };

      return this.updateInternal(tx, { id }, updateData);
    });
  }

  async replace(id: string, data: ReplaceCategoryDto): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      if (data.parentId) {
        if (data.parentId === id) {
          throw new BadRequestException('Category cannot be parent of itself');
        }
        await this.validateNoCycle(tx, id, data.parentId);
      }

      return this.updateInternal(tx, { id }, {
        name: data.name,
        icon: data.icon ?? '', // Set to empty string if not provided
        parent: data.parentId
          ? { connect: { id: data.parentId } }
          : { disconnect: true }
      });
    });
  }

  async delete(id: string): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      const childrenCount = await tx.category.count({
        where: { parentId: id }
      });

      if (childrenCount > 0) {
        throw new BadRequestException('Cannot delete category with children');
      }

      try {
        return await tx.category.delete({
          where: { id }
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException(`Category with id ${id} not found`);
        }

        throw error;
      }
    });
  }

  private async validateNoCycle(tx: Prisma.TransactionClient, categoryId: string, newParentId: string): Promise<void> {
    let currentParentId: string | null = newParentId;

    while (currentParentId !== null) {
      if (currentParentId === categoryId) {
        throw new BadRequestException(
          'Cannot set parent: this would create a cycle',
        );
      }

      const parent: { parentId: string | null } | null = await tx.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });

      currentParentId = parent?.parentId ?? null;
    }
  }

  private async updateInternal(
    tx: Prisma.TransactionClient,
    where: Prisma.CategoryWhereUniqueInput,
    data: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    try {
      return await tx.category.update({
        where,
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }
}
