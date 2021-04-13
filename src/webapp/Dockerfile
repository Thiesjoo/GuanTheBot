ARG ALPINE_VERSION=3.12
ARG NODE_VERSION=14.15.4
ARG WORKINGDIR=src/webapp

# Cached dependencies
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as builder
ARG WORKINGDIR

WORKDIR /usr/builder
COPY . . 
RUN echo "Installing in: $WORKINGDIR"
RUN cd "$WORKINGDIR" && npm ci 
RUN cd "$WORKINGDIR" && npm run build

# Production image with only the necessary files and directories to run the application.
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as production
ARG WORKINGDIR

WORKDIR /usr/src

RUN chown node:node /usr/src && \
  apk add --no-cache dumb-init mongodb-tools wget
 
# Mongodb extra certs
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

COPY ${WORKINGDIR}/package.json .
COPY ${WORKINGDIR}/package-lock.json .
COPY --from=builder --chown=node:node /usr/builder/${WORKINGDIR}/dist ./dist
RUN npm ci --only=production

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/forever", "dist/main.js"]