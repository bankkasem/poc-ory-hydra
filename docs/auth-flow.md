# Authentication flow

[ดู Multi-app sequence diagram](./diagrams/multi-app-auth-flow.mmd)

ระบบนี้มีผู้เกี่ยวข้องหลักหกส่วน:

- **Auth App** แสดงหน้า Login และ Consent แต่ไม่ใช่ OAuth client และไม่รับ token
- **Main App** เป็น OAuth client และเป็นแอปหลักที่ผู้ใช้เปิดก่อน
- **Member App** เป็น OAuth client แยกต่างหาก เปิดจากเมนูใน Main App
- **Backend** ตรวจตัวตนของผู้ใช้และติดต่อ Hydra Admin API
- **Hydra** จัดการ OAuth/OIDC flow และออก token แต่ไม่เก็บ user หรือรหัสยืนยัน
- **MySQL** เก็บข้อมูล user ของระบบเดิม

Main App ที่ `localhost:3002` และ Member App ที่ `localhost:3003` เป็น OAuth client คนละตัว แต่ใช้ Auth App, Backend และ Hydra ร่วมกัน Token ของแต่ละ client แยกจากกันและห้ามนำไปแชร์ระหว่างแอป

เมื่อล็อกอินผ่าน Main App Backend จะขอให้ Hydra จำ Login Session ไว้หนึ่งชั่วโมง หากเปิด Member App ระหว่างที่ session ยังอยู่ Hydra จะส่งข้อมูลผู้ใช้เดิมกลับมาและ Auth App เดิน flow ต่อให้อัตโนมัติ ผู้ใช้จึงไม่ต้องกรอกเบอร์โทรและรหัสซ้ำ ทั้งสองแอปเป็น first-party client ที่ระบบเชื่อถือ จึง accept consent ให้อัตโนมัติด้วย

## ขั้นตอน

### 1. ผู้ใช้เริ่ม Login

Main App หรือ Member App สร้าง `code_verifier` และ `code_challenge` สำหรับ PKCE จากนั้น redirect browser ไปที่ Hydra `/oauth2/auth`

### 2. Hydra เริ่ม OAuth flow

Hydra ตรวจ `client_id`, `redirect_uri`, response type และ PKCE challenge แต่ยังไม่รู้ว่าผู้ใช้คือใคร จึง redirect browser ไปที่:

```text
http://localhost:3000/login?login_challenge=...
```

`login_challenge` เป็นค่าอ้างอิง OAuth request รอบนี้ ไม่ใช่ token

### 3. Auth App ตรวจ Login Session

Auth App ส่ง `login_challenge` ไปให้ backend ตรวจ หาก Hydra มี Login Session เดิม backend จะ accept login ด้วย subject เดิมและ redirect ต่อทันที ผู้ใช้จึงไม่เห็นแบบฟอร์ม Login

หากยังไม่มี Login Session Auth App จะแสดงแบบฟอร์ม Login

ผู้ใช้กรอกเบอร์โทรและรหัสหกหลัก จากนั้น Auth App ส่งข้อมูลพร้อม `loginChallenge` ไปที่ backend:

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

Hydra ตอบ `redirect_to` เพื่อให้ browser เดิน flow ต่อ Auth App ต้อง redirect ไปยัง URL นี้โดยไม่แก้ไขเอง

### 7. Hydra เริ่ม Consent flow

Hydra redirect browser ไปที่:

```text
http://localhost:3000/consent?consent_challenge=...
```

Login และ consent มีหน้าที่ต่างกัน:

- **Login** ยืนยันว่าผู้ใช้คือใคร
- **Consent** ขออนุญาตว่า OAuth client เข้าถึง scope ใดได้บ้าง

### 8. Backend Accept Consent

Auth App ส่ง `consent_challenge` ไป backend จากนั้น backend อ่าน requested scopes จาก Hydra และ accept scopes ชุดนั้นกลับไป โดยไม่เชื่อ scopes ที่ browser ส่งมาเอง Main App และ Member App ตั้งค่า `skip_consent` เพราะเป็น first-party client จึงไม่ต้องให้ผู้ใช้กดอนุญาต

### 9. Hydra ออก Authorization Code

เมื่อ login และ consent สำเร็จ Hydra redirect browser กลับไปยัง callback ของ OAuth client ที่เริ่ม flow เช่น Main App:

```text
http://localhost:3002/callback?code=...&state=...
```

Authorization code มีอายุสั้นและใช้ได้ครั้งเดียว

### 10. BFF แลก Code เป็น Token

Callback ของ Main App หรือ Member App ส่ง authorization code และ `code_verifier` ไป Backend จากนั้น Backend แลก Code กับ Hydra หาก verifier ตรงกับ challenge ที่ส่งไว้ตอนเริ่ม flow Hydra จะออก:

- **ID token** บอก OAuth client ว่าผู้ใช้คือใคร
- **Access token** ใช้เรียก protected backend API
- **Refresh token** ใช้ขอ Access Token ชุดใหม่โดยไม่ต้อง Login ซ้ำ

Backend เก็บ Token ทั้งหมดไว้ใน App Session ที่ MySQL และคืนเฉพาะ Session ID ให้ BFF จากนั้น BFF เก็บ Session ID ใน `HttpOnly` cookie ซึ่ง browser JavaScript อ่านไม่ได้

### 11. BFF เรียก Protected API

BFF อ่าน Session ID จาก cookie แล้วเรียก Backend:

```http
GET /auth/oauth/session
Authorization: Session <session-id>
```

### 12. Backend ตรวจ Access Token

Backend โหลด Token จาก App Session หาก Access Token หมดอายุจะใช้ Refresh Token ขอ Token ชุดใหม่และแทนที่ Refresh Token เดิมที่ถูกหมุน จากนั้นจึง introspect Access Token กับ Hydra โหลดข้อมูล user จาก MySQL และส่งกลับ BFF

Auth App จะไม่เรียก Hydra Admin API โดยตรง และระบบจริงไม่ควรเปิด introspection endpoint ให้ browser หรือ public internet เข้าถึง
