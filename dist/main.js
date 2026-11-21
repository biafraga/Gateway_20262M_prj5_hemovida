"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const rotas_1 = require("./config/rotas");
const proxy_service_1 = require("./proxy/proxy.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    const config = app.get(config_1.ConfigService);
    const proxy = app.get(proxy_service_1.ProxyService);
    for (const rota of rotas_1.ROTAS) {
        const destino = config.getOrThrow(rota.destinoEnv);
        app.use(rota.prefixo, proxy.criarEncaminhador(destino));
        common_1.Logger.log(`${rota.prefixo} -> ${destino}`, 'Rotas');
    }
    const porta = config.get('PORT', 7501);
    await app.listen(porta);
    common_1.Logger.log(`Gateway no ar em http://localhost:${porta}`, 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map