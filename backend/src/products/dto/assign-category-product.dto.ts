import { IsArray, IsNotEmpty } from "class-validator";

export class AssignCategoryProductDto {
    @IsNotEmpty()
    @IsArray()
    categories: string[];
}