# Authentication Context

ระบบยืนยันตัวตนกลางสำหรับแอป first-party หลายตัว โดยแต่ละแอปมี session และ token ของตัวเอง แต่ใช้ Hydra Login Session ร่วมกัน

## Language

**Auth App**:
แอปกลางที่แสดงหน้า Login และ Consent โดยไม่ใช่ปลายทางของ feature ทางธุรกิจ
_Avoid_: Frontend, Login App

**Main App**:
แอปหลักและจุดเริ่มต้นของผู้ใช้ ซึ่งเชื่อมไปยัง feature ที่อยู่ในแอปอื่น
_Avoid_: New App, Portal

**Member App**:
แอปสำหรับ feature จัดการสมาชิกที่ผู้ใช้เปิดจาก Main App
_Avoid_: Member Module, Member Page

**Hydra Login Session**:
สถานะที่ Hydra จำว่าผู้ใช้ใน browser นี้ยืนยันตัวตนแล้วและใช้ร่วมกันระหว่าง OAuth clients
_Avoid_: App Session, Access Token
