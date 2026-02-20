import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
