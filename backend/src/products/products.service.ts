import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

}
