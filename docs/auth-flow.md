# Authentication flow

[ดู sequence diagram](./diagrams/auth-flow.mmd)

ระบบนี้มีผู้เกี่ยวข้องหลักสี่ส่วน:

- **Frontend** พาผู้ใช้เดินตาม OAuth flow และเก็บ PKCE verifier
- **Backend** ตรวจตัวตนของผู้ใช้และติดต่อ Hydra Admin API
- **Hydra** จัดการ OAuth/OIDC flow และออก token แต่ไม่เก็บ user หรือรหัสยืนยัน
- **MySQL** เก็บข้อมูล user ของระบบเดิม

## ขั้นตอน

### 1. ผู้ใช้เริ่ม Login

Frontend สร้าง `code_verifier` และ `code_challenge` สำหรับ PKCE จากนั้น redirect browser ไปที่ Hydra `/oauth2/auth`

### 2. Hydra เริ่ม OAuth flow

Hydra ตรวจ `client_id`, `redirect_uri`, response type และ PKCE challenge แต่ยังไม่รู้ว่าผู้ใช้คือใคร จึง redirect browser ไปที่:

```text
http://localhost:3000/login?login_challenge=...
```

`login_challenge` เป็นค่าอ้างอิง OAuth request รอบนี้ ไม่ใช่ token

### 3. Frontend แสดงหน้า Login

ผู้ใช้กรอกเบอร์โทรและรหัสหกหลัก จากนั้น frontend ส่งข้อมูลพร้อม `loginChallenge` ไปที่ backend:

```http
POST /auth/login
```

```json
{
  "loginChallenge": "from-hydra",
  "phoneNumber": "0812345678",
  "verificationCode": "123456"
}
```

### 4. Backend ตรวจ request

Zod ตรวจว่า challenge มีค่า เบอร์โทรอยู่ในรูปแบบที่รองรับ และ verification code เป็นตัวเลขหกหลัก หากไม่ผ่าน backend ตอบ `400 Bad Request`

### 5. Backend ตรวจตัวตน

Backend ค้นหา user จาก `app_db.users` แล้วใช้ `Bun.password.verify` เปรียบเทียบรหัสกับ Argon2id hash หาก user ไม่มีอยู่หรือรหัสผิดจะตอบ `401 Unauthorized`

Hydra จะไม่เห็นเบอร์โทรหรือรหัสหกหลัก

### 6. Backend Accept Login

เมื่อยืนยันตัวตนสำเร็จ backend เรียก Hydra Admin API พร้อม `login_challenge` และใช้ user ID เป็น OAuth subject:

```json
{
  "subject": "user-id"
}
```

Hydra ตอบ `redirect_to` เพื่อให้ browser เดิน flow ต่อ Frontend ต้อง redirect ไปยัง URL นี้โดยไม่แก้ไขเอง

### 7. Hydra เริ่ม Consent flow

Hydra redirect browser ไปที่:

```text
http://localhost:3000/consent?consent_challenge=...
```

Login และ consent มีหน้าที่ต่างกัน:

- **Login** ยืนยันว่าผู้ใช้คือใคร
- **Consent** ขออนุญาตว่า OAuth client เข้าถึง scope ใดได้บ้าง

### 8. Backend Accept Consent

Frontend ส่ง scope ที่ผู้ใช้อนุญาตพร้อม `consent_challenge` ไป backend จากนั้น backend แจ้ง Hydra ว่าอนุญาต scope ใดบ้าง

### 9. Hydra ออก Authorization Code

เมื่อ login และ consent สำเร็จ Hydra redirect browser กลับไปยัง callback ของ frontend:

```text
http://localhost:3000/callback?code=...&state=...
```

Authorization code มีอายุสั้นและใช้ได้ครั้งเดียว

### 10. Frontend แลก Code เป็น Token

Frontend ส่ง authorization code และ `code_verifier` ไป Hydra หาก verifier ตรงกับ challenge ที่ส่งไว้ตอนเริ่ม flow Hydra จะออก:

- **ID token** บอก frontend ว่าผู้ใช้คือใคร
- **Access token** ใช้เรียก protected backend API

### 11. Frontend เรียก Protected API

Frontend เรียก backend พร้อม access token:

```http
GET /me
Authorization: Bearer <access-token>
```

### 12. Backend ตรวจ Access Token

Backend introspect token กับ Hydra หาก token ยังใช้งานได้ Hydra จะคืน OAuth subject ซึ่งตรงกับ user ID จากขั้น Accept Login จากนั้น backend โหลดข้อมูล user จาก MySQL และส่งกลับ frontend
