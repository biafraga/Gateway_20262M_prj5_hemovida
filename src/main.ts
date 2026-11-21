import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ROTAS } from './config/rotas';
import { ProxyService } from './proxy/proxy.service';

async function bootstrap(): Promise<void> {
  // bodyParser: false -> o gateway não "abre" o corpo dos pedidos, só repassa como veio.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const config = app.get(ConfigService);
  const proxy = app.get(ProxyService);

  // Para cada linha da tabela de rotas, registra: "caminho começa com X -> encaminha".
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