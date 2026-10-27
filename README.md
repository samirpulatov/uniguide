**English** | [Deutsch](README.de.md)

# UniGuide

UniGuide is a web platform for international students in Germany, with a focus on the University of Siegen. It collects practical, moderated guides on everyday student life (bureaucracy, studies, housing, healthcare and more) and adds a community forum, housing listings, a job board and a personal dashboard.

The project is a full-stack pet project: a Spring Boot REST API with JWT authentication and a React + TypeScript single-page app.

## Features

**Guides**
- Users write guides; every new or edited guide goes to `PENDING` and must be approved by an admin before it becomes public.
- Admins see all guides in a moderation view and approve or reject them (with a rejection reason).
- Filters by city, category and university. Authors see their own guides, including pending and rejected ones.

**Forum**
- Discussion threads with categories, filterable by city, university and category.
- Nested replies (a reply can answer another reply, forming a tree).
- Deleted replies are soft-deleted: the text is replaced and the author is hidden, so the reply tree stays intact. Deleting a thread removes it together with its replies.
- No moderation, posts appear immediately.

**Dashboard**
- Personal to-do list (create, edit, complete, delete).
- Personal feed with the latest guides and forum threads for the city and university set in your profile.

**Housing**
- Listings for WG rooms, apartments and dorm rooms, filterable by city, type, warm rent and area.
- Photo upload per listing (JPEG, PNG or WebP, up to 8 MB per file). Photos are stored on the local file system, metadata in the database.

**Jobbörse (job board)**
- Job vacancies (Minijob, Praktikum, Werkstudent, part-time), filterable by city, job type and minimum hourly wage.

**Account**
- Registration and login with a JWT access token and a refresh token.
- Profile page: edit profile data (including city and university) and change the password.

### Public vs. login-only

Based on `SecurityConfig`:

| Area | Without login | Login required |
|---|---|---|
| Auth (`/auth/**`), Swagger UI | everything | – |
| Guides | read published guides | create, edit, delete, "my guides" |
| Forum | read threads and replies | create threads/replies, edit, delete, "my threads" |
| Jobs | read vacancies | create, edit, delete, "my vacancies" |
| Housing | – | everything (listings contain addresses) |
| To-dos, profile | – | everything |
| Admin (`/admin/**`) | – | `ADMIN` role only |

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | Java 21, Spring Boot 4.0 (Web MVC, Data JPA, Security, Validation), Maven Wrapper |
| Auth | JWT with jjwt 0.13 (stateless access token + DB-backed refresh token), BCrypt |
| Database | PostgreSQL, schema managed by Hibernate (`ddl-auto=update`) |
| API docs | springdoc-openapi (Swagger UI) |
| Other | Lombok |
| Frontend | React 19, TypeScript, Vite, React Router 7, Axios |
| Tests | JUnit 5 + Mockito (service layer), ESLint for the frontend |

## Project structure

```
uniguide/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/samir/uniguide/
│   │   │   ├── config/        # Swagger / OpenAPI config
│   │   │   ├── controller/    # REST controllers
│   │   │   ├── dto/           # request and response DTOs
│   │   │   ├── exception/     # custom exceptions + global handler
│   │   │   ├── model/         # JPA entities and enums
│   │   │   ├── repository/    # Spring Data repositories + Specifications (filters)
│   │   │   ├── security/      # SecurityConfig, JWT filter, error handlers
│   │   │   └── service/       # business logic, JWT, file storage
│   │   └── resources/
│   │       └── application.properties
│   └── test/java/...          # unit tests for the services
└── frontend/
    ├── vite.config.ts
    └── src/
        ├── api/               # Axios client and API modules
        ├── components/        # reusable UI components
        ├── context/           # auth context
        ├── pages/             # one component per route
        ├── styles/            # design tokens and shared styles
        └── types/             # TypeScript types matching the DTOs
```

## Getting started

### Prerequisites

- JDK 21 (Maven is not required, the project ships the Maven Wrapper)
- PostgreSQL
- Node.js 20.19+ or 22.12+ (required by Vite 8; `package.json` does not pin a version) and npm

### 1. Create the database

```sql
CREATE DATABASE uniguide;
```

Tables are created automatically on the first start (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Configure the backend

`application.properties` sets `spring.profiles.active=local` and reads the database credentials and the JWT secret from environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). For local development, create `src/main/resources/application-local.properties` instead (it is gitignored) and override these values:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/uniguide
spring.datasource.username=<your-db-user>
spring.datasource.password=<your-db-password>

jwt.secret=<base64-encoded-256-bit-secret>
```

The JWT secret must be a Base64-encoded key of at least 256 bits. Generate one with:

```bash
openssl rand -base64 32
```

These keys already have defaults in `application.properties` and can be overridden in the same file if needed:

| Key | Default | Meaning |
|---|---|---|
| `jwt.expiration` | `1800000` | access token lifetime in ms (30 min) |
| `storage.local.dir` | `uploads` | folder for uploaded housing photos (relative to the working directory) |
| `server.port` | `8081` | backend port |

Refresh tokens are valid for 7 days (set in `AuthService`).

### 3. Run the backend

```bash
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

- API: http://localhost:8081
- Swagger UI: http://localhost:8081/swagger-ui/index.html

New accounts are created with the `STUDENT` role. There is no endpoint to create an admin, so promote a user directly in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = '<your-username>';
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173). In development, Vite proxies every request to `/api/*` to `http://localhost:8081` and strips the `/api` prefix, so no CORS setup is needed.

## Tests and checks

```bash
# backend
./mvnw test                                   # all tests
./mvnw test -Dtest=GuideServiceTest           # one test class
./mvnw test -Dtest=GuideServiceTest#method    # one test method

# frontend (inside frontend/)
npm run lint
npm run build                                 # type check + production build
```

The service tests use Mockito and do not need a database. `UniguideApplicationTests` starts the full Spring context and therefore needs a reachable PostgreSQL and a valid configuration.

## API overview

All endpoints are documented in Swagger UI. Protected endpoints expect `Authorization: Bearer <access-token>`.

| Base path | Purpose |
|---|---|
| `/auth` | register, login, refresh the access token |
| `/users/me` | read and update the own profile, change the password |
| `/guides` | list and filter published guides, own guides, create/edit/delete |
| `/admin/guides` | moderation: list all guides, approve or reject (`ADMIN`) |
| `/forum/threads` | threads: list/filter, own threads, create/edit/delete, add replies |
| `/forum/replies/{id}` | soft-delete a reply |
| `/todos` | personal to-do list (CRUD) |
| `/housing` | housing listings: list/filter, own listings, CRUD |
| `/housing/{id}/photos`, `/housing/photos/{id}` | upload, list, download and delete listing photos |
| `/jobs` | job vacancies: list/filter, own vacancies, CRUD |

## Status and roadmap

UniGuide is in active development and currently runs locally only.

Planned next:
- Deployment with Docker (backend, frontend and PostgreSQL) – not done yet.

## Author

Samir Pulatov
