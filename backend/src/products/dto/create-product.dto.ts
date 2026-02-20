import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsOptional()
    image?: string;

    @IsNumber()
    @IsNotEmpty()
    rating: number;

    @IsNumber()
    @IsNotEmpty()
    reviews: number;
}
