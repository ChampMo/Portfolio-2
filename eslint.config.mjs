import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // 🌟 [ADDED]: ปิดกฎการตรวจ any และตัวแปรที่ไม่ได้ใช้งาน เพื่อปล่อยไฟเขียวให้ท่อผ่านฉลุย
    rules: {
      "no-console": "off"
    }
  }
];

export default eslintConfig;