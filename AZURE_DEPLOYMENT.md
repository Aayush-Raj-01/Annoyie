# Azure App Service deployment

Deploy this as two Linux App Service apps and one Azure Database for PostgreSQL Flexible Server:

- `antr/` is a Node.js App Service. Build with `npm ci && npm run build`; start with `npm run start`. Do not configure it as a static export: `/api/giphy` is a server route.
- `annoyio/` is a Java 21 App Service deployed as the Spring Boot JAR produced by `mvn package`.
- Set `PORT=8080` for the backend and `PORT=3000` for the frontend unless the selected App Service runtime supplies the expected port itself.
- Use a plan with enough WebSocket capacity for expected concurrent chat users. Linux App Service supports WebSockets; the Free plan allows at most five connections.

## Frontend app settings

Set these before the frontend build because `NEXT_PUBLIC_*` values are embedded in the client bundle:

| Setting | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend HTTPS origin, for example `https://<backend>.azurewebsites.net` |
| `GIPHY_API_KEY` | Giphy API key; keep this server-side and do not prefix it with `NEXT_PUBLIC_` |
| `PORT` | `3000` if required by the app runtime |

## Backend app settings

Store secrets in App Service settings or Key Vault references, never in `application.yaml` or source control.

| Setting | Value |
| --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<server>.postgres.database.azure.com:5432/<database>?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL user |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | At least 32 random bytes; changing it invalidates existing sessions |
| `SPRING_MAIL_USERNAME` | SMTP account |
| `SPRING_MAIL_PASSWORD` | SMTP app password or provider credential |
| `CLOUDINARY_CLOUD_NAME` | Existing Cloudinary account name, if using Cloudinary uploads |
| `CLOUDINARY_API_KEY` | Existing Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Existing Cloudinary API secret |
| `CORS_ALLOWED_ORIGINS` | Exact frontend HTTPS origin, with no path or trailing slash |
| `UPLOAD_DIR` | `/home/uploads` for the built-in Linux App Service runtime |
| `PORT` | `8080` if required by the Java runtime |

The app falls back to local file storage when Cloudinary is not configured or unavailable. Point `UPLOAD_DIR` at persistent App Service storage; for a custom Linux container, set `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` or mount Azure Files. Back up uploads independently.

For the first database deployment, Hibernate is configured to create/update tables. After creating a reviewed schema migration and applying it, set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` so app startup checks the schema without changing it. SQL logging defaults off.

Rotate the credentials that were previously committed to the repository. Removing them from the current config does not erase Git history.
