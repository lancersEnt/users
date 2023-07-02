FROM node:18.16-alpine as builder

WORKDIR /usr/share/posts-svc
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.build.json ./
COPY tsconfig.json ./
RUN npm install
RUN npm run build
COPY . .

FROM node:18.16-alpine
COPY --from=builder /usr/share/posts-svc/node_modules ./node_modules/
COPY --from=builder /usr/share/posts-svc/package*.json ./
COPY --from=builder /usr/share/posts-svc/dist ./dist/
COPY --from=builder /usr/share/posts-svc/tsconfig.build.json ./
COPY --from=builder /usr/share/posts-svc/tsconfig.json ./
COPY --from=builder /usr/share/posts-svc/prisma ./prisma/

ENV NODE_OPTIONS=--max_old_space_size=4096

CMD ["npm", "run", "start"]