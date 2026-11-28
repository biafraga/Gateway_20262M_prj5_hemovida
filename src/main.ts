import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppModule } from './app.module';
import { ROTAS } from './config/rotas';
import { ProxyService } from './proxy/proxy.service';

// Limite do cadastro público de doador (POST /doadores), por IP.
const CADASTRO_JANELA_MS = 15 * 60 * 1000;
const CADASTRO_MAXIMO = 20;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const proxy = app.get(ProxyService);

  // Quantos proxies existem na frente do gateway (o da faculdade = 1).
  // Precisa ser número: com texto, o Express entenderia como um endereço IP.
  app.set('trust proxy', Number(config.get('TRUST_PROXY', '1')));

  // Rotas /internal são só para os serviços conversarem entre si.
  // O gateway nunca deixa passar.
  app.use('/internal', (_req: Request, res: Response) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });

  // Saúde do MS1 pelo gateway: GET /ms1/health -> MS1_URL/health.
  // Só esse método e esse caminho exatos. A query string é mantida.
  const saudeMs1 = proxy.criarEncaminhador(
    config.getOrThrow<string>('MS1_URL'),
    '/health',
  );
  app.use('/ms1/health', (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && req.path === '/') {
      void saudeMs1(req, res);
      return;
    }
    next();
  });

  // Limite de cadastros: vale só para POST /doadores.
  const limitarCadastro = rateLimit({
    windowMs: CADASTRO_JANELA_MS,
    limit: CADASTRO_MAXIMO,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
  });
  app.use('/doadores', (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === '/') {
      limitarCadastro(req, res, next);
      return;
    }
    next();
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