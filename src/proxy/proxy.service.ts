import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

// Só esses cabeçalhos do cliente seguem para os serviços.
// O Authorization vai sem alteração: cada serviço confere o token sozinho.
const CABECALHOS_ENVIADOS = [
  'authorization',
  'content-type',
  'content-length',
  'accept',
];

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly http: HttpService) {}

  criarEncaminhador(urlBase: string) {
    return async (req: Request, res: Response): Promise<void> => {
      const url = new URL(req.originalUrl, urlBase);

      const headers: Record<string, string> = {};
      for (const nome of CABECALHOS_ENVIADOS) {
        const valor = req.headers[nome];
        if (typeof valor === 'string') {
          headers[nome] = valor;
        }
      }

      // Repassa o IP de quem chamou, para o limite de tentativas de login
      // do MS4 contar por pessoa e não pelo IP do gateway.
      const ipCliente = req.socket.remoteAddress ?? '';
      const anterior = req.headers['x-forwarded-for'];
      headers['x-forwarded-for'] =
        typeof anterior === 'string' && anterior.length > 0
          ? `${anterior}, ${ipCliente}`
          : ipCliente;

      const temCorpo = req.method !== 'GET' && req.method !== 'HEAD';

      try {
        const resposta = await firstValueFrom(
          this.http.request({
            method: req.method,
            url: url.toString(),
            headers,
            data: temCorpo ? req : undefined,
            responseType: 'stream',
            validateStatus: () => true,
            maxRedirects: 0,
          }),
        );

        res.status(resposta.status);
        const tipo = resposta.headers['content-type'];
        if (typeof tipo === 'string') {
          res.setHeader('content-type', tipo);
        }
        resposta.data.pipe(res);
      } catch (erro) {
        this.logger.error(
          `Falha ao acessar ${url.toString()}: ${(erro as Error).message}`,
        );
        if (!res.headersSent) {
          res.status(502).json({ erro: 'Serviço de destino indisponível.' });
        }
      }
    };
  }
}