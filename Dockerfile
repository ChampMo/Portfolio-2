FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# วางท่อหลอก Next.js ป้องกันระเบิดตอน Build บน GitHub Actions
ENV MONGODB_URI=mongodb://localhost:27017/build_fallback

ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER

# 🌟 2. แปลงเป็น Environment ให้ Next.js มองเห็นตอน Build
ENV NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY
ENV NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER

RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 🌟 [FIXED]: แก้ไขจาก next.config.mjs เป็น next.config.ts ให้ตรงกับโครงสร้างจริงของกัปตัน
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]