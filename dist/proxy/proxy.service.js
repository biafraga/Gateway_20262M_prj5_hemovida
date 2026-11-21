"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let ProxyService = ProxyService_1 = class ProxyService {
    http;
    logger = new common_1.Logger(ProxyService_1.name);
    constructor(http) {
        this.http = http;
    }
    criarEncaminhador(urlBase) {
        return async (req, res) => {
            const destino = new URL(req.originalUrl, urlBase).toString();
            const cabecalhos = {};
            for (const nome of ['authorization', 'content-type', 'content-length', 'accept']) {
                const valor = req.headers[nome];
                if (typeof valor === 'string')
                    cabecalhos[nome] = valor;
            }
            const temCorpo = !['GET', 'HEAD'].includes(req.method);
            try {
                const resposta = await (0, rxjs_1.firstValueFrom)(this.http.request({
                    url: destino,
                    method: req.method,
                    headers: cabecalhos,
                    data: temCorpo ? req : undefined,
                    responseType: 'stream',
                    validateStatus: () => true,
                    maxRedirects: 0,
                }));
                res.status(resposta.status);
                const tipo = resposta.headers['content-type'];
                if (typeof tipo === 'string')
                    res.set('content-type', tipo);
                resposta.data.pipe(res);
            }
            catch (erro) {
                this.logger.error(`Falha ao acessar ${urlBase}: ${erro.message}`);
                if (!res.headersSent) {
                    res.status(502).json({ erro: 'Serviço de destino indisponível.' });
                }
            }
        };
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map