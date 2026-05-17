# ใช้ Node.js เป็น Base Image
FROM node:20-alpine AS builder

WORKDIR /app

# คัดลอกไฟล์ dependencies และติดตั้ง
COPY package.json package-lock.json ./
RUN npm install

# คัดลอกโค้ดทั้งหมดแล้ว Build Project (Next.js)
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner
WORKDIR /app

# ตั้งค่าเป็นโหมด Production
ENV NODE_ENV production

# ก๊อปปี้ไฟล์ที่ Build เสร็จแล้วมาจาก Stage แรก
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# รันเซิร์ฟเวอร์
CMD ["npm", "start"]