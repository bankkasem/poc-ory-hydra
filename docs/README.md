# Documentation

- [Authentication flow](./auth-flow.md) — อธิบาย login, consent, token และ protected API ทีละขั้น

## Diagrams

- [Authentication flow](./diagrams/auth-flow.mmd) — ลำดับตั้งแต่ Login จนเรียก Protected API
- [Multi-app authentication flow](./diagrams/multi-app-auth-flow.mmd) — เข้า Main App แล้วเปิด Member App ผ่าน SSO
- [Two-app authentication flow](./diagrams/two-app-auth-flow.mmd) — เข้า New App แล้วใช้ Auth App สำหรับ Login และ Consent
- [PKCE](./diagrams/pkce.mmd) — วิธีป้องกัน Authorization Code ที่ถูกขโมย
