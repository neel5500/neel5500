# Face Authentication Setup Guide

## Enrollment Flow
1. Admin/Manager logs in with password.
2. Client captures webcam image (JPEG/PNG).
3. Upload multipart image to `POST /api/v1/auth/face/enroll`.
4. Backend stores image bytes (`users.face_template`) or in production, stores S3 object key.

## Login Flow
1. User enters email and captures live face image.
2. Client sends multipart request to `POST /api/v1/auth/login/face`.
3. Backend loads enrolled face image and compares with AWS Rekognition `CompareFaces`.
4. If similarity threshold passed (default 90), issue JWT.

## Recommended Production Improvements
- Store templates in S3 (encrypted) instead of DB bytea.
- Add anti-spoofing/liveness checks before CompareFaces.
- Capture and compare multiple angles on enrollment.
- Rate limit failed attempts and lock account after threshold.
- Add MFA fallback for failed biometric attempts.
