# Library front end (no backend needed yet)

Best way to open it: start the backend and visit http://localhost:3000.
Demo mode (USE_MOCK true) also works by double-clicking index.html.

- Home:          index.html (choose Member or Staff)
- Members:       member/login.html (sign up or log in with any email and a password)
- Admin log in:  admin/login.html
- Admin sign up: admin/signup.html (needs the admin access code)

js/config.js has these settings:
- USE_MOCK     true = fake books, members and admins saved in your browser (js/mock-api.js)
- ADMIN_CODE   demo mode only (LIBRARY-ADMIN). The real code lives in backend/.env
- API_BASE     your backend address

In demo mode any email and password logs in. If the email was used for an admin sign up, that admin's name is shown.

## Background images (images folder, JPEG, 1920x1200)
member-login-bg.jpg   landing page, member log in and sign up
member-bg.jpg         member library page
admin-login-bg.jpg    admin log in and admin sign up
admin-bg.jpg          admin dashboard
Your first set is kept in images/old-originals. To use your own photos, replace the files above using the same names.
A dark tint is added in css/style.css so text stays readable.

## Backend
The real backend is in the `backend` folder next to this one. See the main README.md for how to run it.
config.js now has USE_MOCK set to false. Set it back to true for the browser-only demo mode.
