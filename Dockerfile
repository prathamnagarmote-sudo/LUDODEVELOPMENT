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

# Store the compiled module at /opt/ — completely outside /nakama/ and immune to
# any Railway volume mount that may mask /nakama/data/ or /nakama/modules/.
COPY --from=node-builder /app/nakama/data/modules/index.js /opt/ludo_module.js

# Also bake into both possible runtime directories as a build-time fallback
# (these may be masked by volume mounts at runtime, but the entrypoint copies
# from /opt/ to fix that).
RUN mkdir -p /nakama/data/modules /nakama/modules
COPY --from=node-builder /app/nakama/data/modules/index.js /nakama/data/modules/index.js
COPY --from=node-builder /app/nakama/data/modules/index.js /nakama/modules/index.js

# Create a startup script that:
# 1. Copies the module from /opt/ to BOTH default and custom runtime directories
# 2. Verifies the files exist
# 3. Runs migration
# 4. Starts Nakama with explicit runtime path
RUN printf '#!/bin/sh\nset -e\necho "[STARTUP] Copying ludo module from /opt/ to runtime directories..."\nmkdir -p /nakama/data/modules /nakama/modules\ncp /opt/ludo_module.js /nakama/data/modules/index.js\ncp /opt/ludo_module.js /nakama/modules/index.js\necho "[STARTUP] Module files:"\nls -la /opt/ludo_module.js /nakama/data/modules/index.js /nakama/modules/index.js\necho "[STARTUP] First 3 lines of module:"\nhead -3 /nakama/data/modules/index.js\necho "[STARTUP] Running migration..."\n/nakama/nakama migrate up --database.address ${NAKAMA_DATABASE_ADDRESS}\necho "[STARTUP] Starting Nakama..."\nexec /nakama/nakama --name nakama1 --database.address ${NAKAMA_DATABASE_ADDRESS} --logger.level INFO\n' > /usr/local/bin/start-nakama.sh && chmod +x /usr/local/bin/start-nakama.sh

EXPOSE 7349 7350 7351

# NOTE: We intentionally do NOT specify --runtime.path here so Nakama uses its
# default: /nakama/data/modules. The startup script copies the module there.
ENTRYPOINT ["/usr/local/bin/start-nakama.sh"]
