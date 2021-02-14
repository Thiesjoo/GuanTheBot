ARG ALPINE_VERSION=3.12
ARG NODE_VERSION=14.15.4

# Cached dependencies
FROM alpine:${ALPINE_VERSION} AS deps

RUN apk --no-cache add jq openssh

COPY package.json .
COPY package-lock.json .

RUN (jq '{ dependencies, devDependencies, version }') < package.json > deps.json
RUN (jq '.version = "1.0.0"' | jq '.packages."".version = "1.0.0"') < package-lock.json > deps-lock.json

# Production image with only the necessary files and directories to run the application.
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as production

WORKDIR /usr/src

RUN chown node:node /usr/src && \
  apk add --no-cache dumb-init mongodb-tools

COPY --from=deps --chown=node:node deps.json ./package.json
COPY --from=deps --chown=node:node deps-lock.json ./package-lock.json
COPY src/ dist/
COPY dump/ dump/

RUN npm ci --only=production

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/nodemon","dist/"]