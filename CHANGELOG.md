# Changelog

การเปลี่ยนแปลงสำคัญของแต่ละเวอร์ชันจะบันทึกไว้ในไฟล์นี้

## [Unreleased]

### Added

- เพิ่ม Logout ของ Main/Member ตาม Hydra login session ปัจจุบัน โดยไม่กระทบ browser อื่น
- เพิ่มการ revoke token chains รวม token ที่หมุนแล้ว และหน้าออกจากระบบ
- เพิ่ม regression test ผ่าน agent-browser แยกสอง browser
- เพิ่ม Refresh Token และรองรับ token rotation ของ Hydra
- เพิ่ม App Session ที่เก็บ Access Token และ Refresh Token ใน encrypted cookie
- เพิ่ม HttpOnly session cookie สำหรับ Main App และ Member App

### Changed

- แยก Compose ของ App DB และ Hydra เป็นคนละ MySQL server, user, volume และ network
- รวม config ของ Hydra เป็น environment variables ใน `compose.hydra.yaml` สำหรับใช้อ้างอิง ECS
- ย้าย Access/Refresh Token จาก MySQL ไป encrypted HttpOnly cookie แยกแต่ละแอป
- ให้ Next.js BFF แลก Code และ Refresh Token โดยตรง พร้อมอัปเดต cookie หลัง rotation
- คืน Backend เป็น Resource Server ที่ตรวจ Bearer Token ผ่าน `GET /me`
- ยกเลิกการใช้ตาราง `oauth_sessions` และตั้ง Hydra refresh-token grace period 10 วินาที
- เพิ่ม `OAUTH_COOKIE_SECRET` และอายุ App Session สูงสุด 30 วัน
- ยุบเอกสารและ diagram ใน `docs/` เหลือ `auth-flow.mmd` ที่ root สำหรับ flow ล่าสุด
- ย้าย OAuth helpers เข้าแต่ละแอป และรวม setup ใน Taskfile เพื่อลบ `packages/` และ `scripts/`
- ย้าย OAuth callback และการตรวจ session ไปทำฝั่ง Next.js BFF
- Redirect ก่อน render หน้าเมื่อมี Hydra Login Session เพื่อลดหน้ากระพิบ

## [0.3.0] - 2026-09-30

### Added

- เพิ่ม Main App และ Member App เป็น OAuth clients แยกกัน
- เพิ่ม SSO จาก Main App ไป Member App ผ่าน Hydra Login Session
- เพิ่ม auto-accept consent สำหรับ first-party clients

### Changed

- เปลี่ยน New App เป็น Main App
- จำกัด Auth App ให้ทำหน้าที่ Login และ Consent เท่านั้น

## [0.2.0] - 2026-09-30

### Added

- เพิ่ม New App เป็น OAuth client ตัวที่สอง
- เพิ่ม Hydra Login Session เพื่อเข้าแอปที่สองโดยไม่ต้องกรอกรหัสซ้ำ
- เพิ่ม package กลางสำหรับ OAuth Authorization Code flow with PKCE
- เพิ่มการตั้งค่า OAuth clients หลายตัวผ่าน Taskfile

### Changed

- เปลี่ยนชื่อ Frontend เป็น Auth App เพื่อแยกบทบาทให้ชัดเจน

## [0.1.0] - 2026-09-30

### Added

- สร้าง Bun monorepo สำหรับ Next.js frontend และ Bun backend
- เพิ่มการยืนยันตัวตนด้วยเบอร์โทรและรหัสหกหลักจาก MySQL
- เพิ่ม OAuth Authorization Code flow with PKCE
- เพิ่ม Hydra Login, Consent และ Access Token introspection
- เพิ่ม local Hydra และ MySQL stack ด้วย Docker Compose
- เพิ่ม Taskfile สำหรับติดตั้งและเริ่มระบบ local
- เพิ่มเอกสาร Authentication flow และ PKCE

[Unreleased]: https://github.com/bankkasem/poc-ory-hydra/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/bankkasem/poc-ory-hydra/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/bankkasem/poc-ory-hydra/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/bankkasem/poc-ory-hydra/releases/tag/v0.1.0
