# Test Credentials for Gorecory Inventory Tracker

## Demo User (pre-seeded, bcrypt-hashed on startup)
- Email: demo@gorecory.com
- Password: demo123

## New Registration
- Use POST /api/register to create any new user
- Duplicate email returns HTTP 409

## SMTP (Email Alerts)
- Pre-configured in backend/.env
- Sender: siddarthkoppurapu2006@gmail.com
- Recipient: siddarthkoppurapu2006@gmail.com

## URLs
- Frontend (external): https://7c883149-4270-480d-acda-2786d92bdadc.preview.emergentagent.com
- Backend (external): https://7c883149-4270-480d-acda-2786d92bdadc.preview.emergentagent.com/api
- Backend (local):    http://localhost:8001

## Notes
- Legacy plain-text passwords are auto-upgraded to bcrypt on first successful login.
- Client-side auth guard only (localStorage token check); backend endpoints are not token-enforced per spec.
