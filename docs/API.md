# API Documentation

Base URL: `/api/v1`

## Auth
- `POST /auth/login/password`
  - Body: `{ email, password }`
- `POST /auth/login/face`
  - Multipart: `face` image + `email`
- `POST /auth/face/enroll`
  - Auth required, multipart `face`

## Stock
- `GET /stock`
  - Auth required. Returns inward + dispatched + remaining.
- `POST /stock/inward`
  - Roles: `ADMIN`, `MANAGER`
  - Body fields: `product_name, item_category, quantity, unit, party_name, entry_date, due_date, storage_location, coating_type, remarks, image_urls, status`
- `POST /stock/outward`
  - Roles: `ADMIN`, `MANAGER`
  - Body fields: `inward_id, quantity_dispatched, party_name, dispatch_date, delivery_status, photos_before_dispatch, remarks`

## Admin
- `GET /admin/dashboard`
  - Role: `ADMIN`
- `GET /admin/audit-logs`
  - Role: `ADMIN`
- `POST /admin/users`
  - Role: `ADMIN`
- `PATCH /admin/users/:id/status`
  - Role: `ADMIN`

## Reports
- `GET /reports/search`
  - Query: `party, product, coating_type, start_date, end_date, due_date, location`
- `GET /reports/summary?type=daily|monthly`

## Response and Error Pattern
- Success: JSON payload with requested object/list.
- Error: `{ "message": "..." }` with relevant HTTP status codes.
