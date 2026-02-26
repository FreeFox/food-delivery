import { Controller, Body, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReplaceProductDto } from './dto/replace-product.dto';
import { AssignCategoryProductDto } from './dto/assign-category-product.dto';

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
        return this.products.create({
            ...dto
        });
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.products.update(id, dto);
    }

    @Put(':id')
    async replace(@Param('id') id: string, @Body() dto: ReplaceProductDto) {
        return this.products.replace(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.products.delete(id);
    }

    @Post(':id/categories/')
    async addCategory(@Param('id') id: string, @Body() dto: AssignCategoryProductDto) {
        return this.products.addCategory(id, dto.categories);
    }

    @Delete(':id/categories/')
    async removeCategory(@Param('id') id: string, @Body() dto: AssignCategoryProductDto) {
        return this.products.removeCategory(id, dto.categories);

    }
}
