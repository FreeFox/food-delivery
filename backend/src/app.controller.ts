import { Controller, Get } from '@nestjs/common';

const API_VERSION = 'v1';

@Controller()
export class AppController {
  @Get()
  root() {
    return `<h1>Food Delivery API</h1><p>API is running. See <a href="/api/${API_VERSION}/health">/api/${API_VERSION}/health</a></p>`;
  }

  @Get(`api/${API_VERSION}/health`)
  health() {
    return { status: 'API is running' };
  }

  @Get(`api/${API_VERSION}/test`)
  test() {
    return { status: 'Test route is working' };
  }
}
