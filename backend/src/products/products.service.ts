import { HttpException, Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ProductWhereUniqueInput;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) {
        return await this.prisma.product.findMany({
            skip: params.skip,
            take: params.take,
            cursor: params.cursor,
            where: params.where,
            orderBy: params.orderBy,
        });
    }

    async findOne(productWhereUniqueInput: Prisma.ProductWhereUniqueInput): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({
            where: productWhereUniqueInput,
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async create(dto: CreateProductDto): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            try {
                return await tx.product.create({
                    data: dto,
                });
            } catch (error) {
                throw new HttpException('Failed to create product', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    }

    /*

      async create(data: CreateCategoryDto): Promise<Category> {
        return this.prisma.$transaction(async (tx) => {
          if (data.parentId) {
            if (data.parentId === data.id) {
              throw new BadRequestException('Category cannot be parent of itself');
            }
    
            await this.parentCategoryExists(tx, data.parentId);
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

     */
    
}
