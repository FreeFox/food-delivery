import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get(':email')
  async getByEmail(@Param('email') email: string) {
    const data = await this.service.findByEmail(email);
    return { success: true, data, error: null };
  }
}
