import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";

export class CreateCategoryDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
