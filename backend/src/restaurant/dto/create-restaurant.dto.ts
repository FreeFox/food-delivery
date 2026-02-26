import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateRestaurantDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    rootCategoryId?: string;
}
