import { Controller, Body, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/products`)
export class ProductsController {
    constructor(private products: ProductsService) { }

    @Get()
    async getAll() {
        return this.products.findAll({});
    }

    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.products.findOne({ id });
    }

    @Post()
    async create(@Body() dto: CreateProductDto) {
        // this.products.create({
        //     ...dto
        // });
        return { message: 'Create product endpoint' };
    }

    @Patch(':id')
    async update(@Param('id') id: string) {
        return { message: `Update product with id ${id} endpoint` };
    }

    @Put(':id')
    async replace(@Param('id') id: string) {
        return { message: `Replace product with id ${id} endpoint` };
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return { message: `Delete product with id ${id} endpoint` };
    }
}
