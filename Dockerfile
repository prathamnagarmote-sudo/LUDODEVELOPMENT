# Build TypeScript code
FROM node:18-alpine AS node-builder

WORKDIR /app/nakama

COPY nakama/package.json ./
RUN apk add --no-cache git && npm install

COPY nakama/tsconfig.json ./
COPY nakama/*.ts ./
RUN npm run build

# Run Nakama
FROM heroiclabs/nakama:3.21.1

# Store the compiled module OUTSIDE /nakama/ so Railway volume mounts cannot mask it.
# /opt is a standard system directory never used by Railway volume configuration.
COPY --from=node-builder /app/nakama/data/modules/index.js /opt/ludo_module.js

EXPOSE 7349 7350 7351

# At every container startup:
# 1. Copy the baked-in module from /opt/ to the runtime path (always fresh, bypasses volumes)
# 2. Confirm the file is there
# 3. Run DB migration
# 4. Start Nakama with runtime path pointing to the module directory
ENTRYPOINT ["/bin/sh", "-ecx", "\
  mkdir -p /nakama/modules && \
  cp /opt/ludo_module.js /nakama/modules/index.js && \
  echo '[STARTUP] Ludo module installed:' && \
  ls -la /nakama/modules/ && \
  /nakama/nakama migrate up --database.address ${NAKAMA_DATABASE_ADDRESS} && \
  exec /nakama/nakama --name nakama1 --database.address ${NAKAMA_DATABASE_ADDRESS} --runtime.path /nakama/modules"]
