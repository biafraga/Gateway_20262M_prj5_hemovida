import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly http: HttpService) {}

  // Devolve uma função que recebe o pedido do front, repassa para o serviço de destino
  // e devolve a resposta dele. Nada é alterado no caminho: nem corpo, nem status.
  criarEncaminhador(urlBase: string) {
    return async (req: Request, res: Response): Promise<void> => {
      // originalUrl guarda o caminho COMPLETO (/doadores/1?page=2), com a query string.
      const destino = new URL(req.originalUrl, urlBase).toString();

      // Só repassamos o que os serviços precisam. O Authorization vai exatamente como chegou.
      const cabecalhos: Record<string, string> = {};
      for (const nome of ['authorization', 'content-type', 'content-length', 'accept', 'x-gestor-id']) {
        const valor = req.headers[nome];
        if (typeof valor === 'string') cabecalhos[nome] = valor;
      }

      const temCorpo = !['GET', 'HEAD'].includes(req.method);

      try {
        const resposta = await firstValueFrom(
          this.http.request({
            url: destino,
            method: req.method,
            headers: cabecalhos,
            data: temCorpo ? req : undefined, // o corpo segue como veio (stream)
            responseType: 'stream',
            validateStatus: () => true, // 400, 401, 404, 409... NÃO são erro para o gateway
            maxRedirects: 0, // se o serviço mandar um 301/302, repassamos sem seguir
          }),
        );

        res.status(resposta.status);
        const tipo = resposta.headers['content-type'];
        if (typeof tipo === 'string') res.set('content-type', tipo);
        (resposta.data as NodeJS.ReadableStream).pipe(res);
      } catch (erro) {
        // Só cai aqui se o serviço não respondeu (desligado, fora do ar, rede).
        this.logger.error(`Falha ao acessar ${urlBase}: ${(erro as Error).message}`);
        if (!res.headersSent) {
          res.status(502).json({ erro: 'Serviço de destino indisponível.' });
        }
      }
    };
  }
}