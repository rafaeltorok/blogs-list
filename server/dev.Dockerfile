FROM node:24-alpine

WORKDIR /usr/src/app/server

# Install curl for the healthcheck
RUN apk add --no-cache curl

# Install dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 3001

USER node

CMD ["npm", "run", "dev"]
