import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
export declare class ProxyService {
    private readonly http;
    private readonly logger;
    constructor(http: HttpService);
    criarEncaminhador(urlBase: string): (req: Request, res: Response) => Promise<void>;
}
