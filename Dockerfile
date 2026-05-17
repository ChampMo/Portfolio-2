FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 🌟 [ADDED]: วางท่อหลอก Next.js ป้องกันระเบิดตอน Build บน GitHub Actions
# (ค่าจริงบนระบบ Render จะวิ่งมาเขียนทับตัวนี้ให้อัตโนมัติในตอนรันครับ)
ENV MONGODB_URI=mongodb://localhost:27017/build_fallback

RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]