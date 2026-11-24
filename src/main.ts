import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { ROTAS } from './config/rotas';
import { ProxyService } from './proxy/proxy.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const proxy = app.get(ProxyService);

  // Rotas /internal são só para os serviços conversarem entre si.
  // O gateway nunca deixa passar.
  app.use('/internal', (_req: Request, res: Response) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });

  for (const rota of ROTAS) {
    const destino = config.getOrThrow<string>(rota.destinoEnv);
    app.use(rota.prefixo, proxy.criarEncaminhador(destino));
    Logger.log(`${rota.prefixo} -> ${destino}`, 'Rotas');
  }

  const porta = config.get<number>('PORT', 7501);
  await app.listen(porta);
  Logger.log(`Gateway no ar em http://localhost:${porta}`, 'Bootstrap');
}
void bootstrap();