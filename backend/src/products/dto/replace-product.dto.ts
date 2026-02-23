import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class ReplaceProductDto {
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
