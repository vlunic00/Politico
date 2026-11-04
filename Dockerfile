FROM node:24-trixie-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_APP_NAME="Croatia Political Observatory"
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
RUN STANDALONE=1 npm run build

# Offline maintenance tools are deliberately separate from the web image.
FROM build AS maintenance
USER root
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils postgresql-client && rm -rf /var/lib/apt/lists/*
USER node
CMD ["npm", "run", "ops:status"]

FROM node:24-trixie-slim AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
