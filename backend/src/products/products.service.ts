import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ReplaceProductDto } from './dto/replace-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

    async create(data: CreateProductDto): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            // validations?

            try {
                return await tx.product.create({
                    data: {
                        id: data.id,
                        name: data.name,
                        description: data.description ?? '',
                        price: data.price,
                        image: data.image ?? '',
                        rating: data.rating ?? 0,
                        reviews: data.reviews ?? 0
                    }
                });
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002'
                ) {
                    throw new BadRequestException('Product with this id already exists');
                }
                throw error;
            }
        });
    }

    async update(id: string, data: UpdateProductDto): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            const updateData: Prisma.ProductUpdateInput = {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.image !== undefined && { image: data.image }),
                ...(data.rating !== undefined && { rating: data.rating }),
                ...(data.reviews !== undefined && { reviews: data.reviews }),
            };

            return this.updateInternal(tx, { id }, updateData);
        });
    }

    async replace(id: string, data: ReplaceProductDto): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            return this.updateInternal(tx, { id }, {
                name: data.name,
                description: data.description ?? '',
                price: data.price,
                image: data.image ?? '',
                rating: data.rating ?? 0,
                reviews: data.reviews ?? 0
            });
        });
    }

    async delete(id: string): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            try {
                return await tx.product.delete({
                    where: { id }
                });
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    throw new NotFoundException(`Product with id ${id} not found`);
                }

                throw error;
            }
        });
    }

    async updateInternal(
        tx: Prisma.TransactionClient,
        where: Prisma.ProductWhereUniqueInput,
        data: Prisma.ProductUpdateInput
    ): Promise<Product> {
        try {
            return await tx.product.update({
                where,
                data,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Product not found');
            }
            throw error;
        }
    }

    async addCategory(id: string, categoryIds: string[]): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            const product = await this.findOne({ id });

            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } }
            });

            if (categories.length !== categoryIds.length) {
                throw new NotFoundException('One or more categories not found');
            }

            return await tx.product.update({
                where: { id },
                data: {
                    category: {
                        connect: categoryIds.map(categoryId => ({ id: categoryId }))
                    }
                }
            });
        });
    }

    async removeCategory(id: string, categoryIds: string[]): Promise<Product> {
        return this.prisma.$transaction(async (tx) => {
            const product = await this.findOne({ id });

            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } }
            });

            if (categories.length !== categoryIds.length) {
                throw new NotFoundException('One or more categories not found');
            }

            return await tx.product.update({
                where: { id },
                data: {
                    category: {
                        disconnect: categoryIds.map(categoryId => ({ id: categoryId }))
                    }
                }
            });
        });
    }

}
