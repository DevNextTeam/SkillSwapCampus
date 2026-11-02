# SkillSwap Campus

SkillSwap Campus is a peer-to-peer learning community for university students. Students can share skills they can teach, discover skills they want to learn, connect with other students, and arrange learning sessions.

## Main features

- Student registration, login, and persistent PHP sessions
- Student profiles with profile-photo uploads
- Create, edit, delete, search, and browse skill posts
- Skill exchange requests with accept, reject, and completion states
- Session scheduling with meeting locations and confirmation by the other student
- Friend requests and private messaging
- Image and document attachments in conversations
- Notifications for friend requests, messages, exchanges, and schedule proposals
- Live campus map with opt-in location sharing and student profile markers
- Dashboard overview and recently shared skills

## Technology

- Frontend: React, Vite, JavaScript, CSS
- Backend: PHP 8+
- Database: MySQL / MariaDB
- Local development: XAMPP (Apache and MySQL)
- Frontend quality checks: ESLint and Vite production build
- Backend quality checks: PHP syntax validation in GitHub Actions

## Local development

### Requirements

- Windows with XAMPP (Apache and MySQL enabled)
- PHP with PDO MySQL, Fileinfo, and image metadata support enabled
- Node.js and npm
- The project folder placed at `C:\\xampp\\htdocs\\skillswap-campus`

### Start the backend

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Confirm the `skillswap_campus` database and the application's tables are present in phpMyAdmin.
3. Open the API health endpoint in a browser:

   `http://localhost/skillswap-campus/backend/index.php`

4. Keep Apache and MySQL running while using the app.

The local PHP database defaults are in `backend/db.php`. For production, set `APP_ENV=production` and provide `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` through the server environment. Never commit production credentials.

### Start the frontend

Open PowerShell in the project directory and run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The frontend calls the PHP API at `http://localhost/skillswap-campus/backend` by default. To use a different API host or deployment path, copy `.env.local.example` to `.env.local`, set `VITE_API_BASE_URL` to the full PHP API base URL, and restart Vite. If the frontend is accessed from another development device or origin, configure `APP_ALLOWED_ORIGINS` in PHP with the exact comma-separated origins that should be trusted. Do not use a wildcard when credentials are enabled.

### Verify changes

After pulling the latest `ui-redesign` branch:

```powershell
git pull origin ui-redesign
npm.cmd run lint
npm.cmd run build
```

GitHub Actions also validates frontend lint/build and PHP syntax on pushes and pull requests to `ui-redesign`.

## Install SkillSwap Campus on a phone (PWA)

The frontend includes a web app manifest, app icons, an install prompt for supported browsers, and a service worker. To install it as an app rather than a browser bookmark:

1. Deploy the frontend on a domain with **HTTPS**. Service workers and installable PWAs require a secure context (localhost is the development exception).
2. Open the HTTPS website on the phone. On Android, use Chrome and tap **Install** when the SkillSwap prompt appears, or use the browser menu and choose **Install app**. On iPhone/iPad, open the site in Safari, tap **Share**, then **Add to Home Screen**.
3. Launch SkillSwap Campus from the new home-screen icon. The manifest requests standalone display, so it opens without the normal browser address bar.

The service worker caches the app shell and safe static assets for a limited offline shell experience. It deliberately does not cache PHP API calls or authenticated JSON responses. Login, messaging, maps, uploads, and other live features still require the PHP API and database to be reachable.

For phone testing on a real network, do not use `localhost` as the API host: on a phone, localhost means the phone itself. Configure `VITE_API_BASE_URL` to a reachable HTTPS API URL and configure the PHP allowed origins and secure session cookies for that deployment. Keep production credentials out of the frontend.

## Two-student workflow testing

Use two separate browser sessions (for example, a normal window and a private window) so each student has an independent PHP login session. Follow the checklist in [docs/TWO_STUDENT_WORKFLOW_TEST.md](docs/TWO_STUDENT_WORKFLOW_TEST.md).

## Security notes

- Passwords are stored using PHP's password hashing API.
- Authenticated state-changing API requests use a session-bound CSRF token.
- API responses disable caching and set basic security headers.
- Skill, exchange, schedule, and messaging operations verify the signed-in student and relevant ownership/relationship.
- Uploaded files are type-checked, stored under randomized names, and upload directories deny script execution.
- Production deployment still requires HTTPS, production database credentials, exact allowed origins, backups, and a review of server upload limits and PHP configuration.

## Current development branch

`ui-redesign`
