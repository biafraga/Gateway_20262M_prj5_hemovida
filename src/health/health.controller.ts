import { Controller, Get } from '@nestjs/common';

// Rota pública que só diz "o gateway está funcionando".
@Controller('health')
export class HealthController {
  @Get()
  verificar() {
    return {
      status: 'ok',
      servico: 'gateway',
      timestamp: new Date().toISOString(),
    };
  }
}