# Imagem Node.js 24
FROM node:24-bookworm-slim

# Diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

# Compilar o projeto e conferir que o main.js foi gerado
RUN npm run build && \
    find dist -name "main.js"

# Configuração da aplicação
ENV NODE_ENV=production
ENV PORT=7501

# Porta da aplicação
EXPOSE 7501

# Inicialização da aplicação
CMD ["npm", "run", "start:prod"]