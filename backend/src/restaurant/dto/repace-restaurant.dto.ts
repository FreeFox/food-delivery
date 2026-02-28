import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class ReplaceRestaurantDto {
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
