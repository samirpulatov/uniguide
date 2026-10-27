[English](README.md) | **Deutsch**

# UniGuide

UniGuide ist eine Webplattform für internationale Studierende in Deutschland, mit Schwerpunkt auf der Universität Siegen. Im Mittelpunkt stehen praxisnahe, moderierte Guides rund um den Studienalltag – von Behördengängen über das Studium bis zu Wohnen und Gesundheit. Dazu kommen ein Community-Forum, Wohnungsanzeigen, eine Jobbörse und ein persönliches Dashboard.

Technisch ist es ein Full-Stack-Projekt: eine REST-API mit Spring Boot und JWT-Authentifizierung sowie eine Single-Page-App mit React und TypeScript.

## Funktionen

**Guides**
- Nutzer schreiben Guides. Jeder neue oder bearbeitete Guide erhält den Status `PENDING` und wird erst nach Freigabe durch einen Admin öffentlich sichtbar.
- Admins sehen alle Guides in einer Moderationsansicht und können sie freigeben oder mit Begründung ablehnen.
- Filter nach Stadt, Kategorie und Hochschule. Unter „Meine Guides“ sehen Autoren auch ihre noch offenen und abgelehnten Beiträge.

**Forum**
- Diskussions-Threads mit Kategorien, filterbar nach Stadt, Hochschule und Kategorie.
- Verschachtelte Antworten: Man kann auch direkt auf eine Antwort antworten, sodass ein Antwortbaum entsteht.
- Gelöschte Antworten werden nur als gelöscht markiert (Soft Delete): Der Text wird ersetzt und der Autor ausgeblendet, der Baum bleibt erhalten. Wird ein Thread gelöscht, verschwinden er und alle Antworten vollständig.
- Keine Moderation – Beiträge erscheinen sofort.

**Dashboard**
- Persönliche To-do-Liste (anlegen, bearbeiten, abhaken, löschen).
- Persönlicher Feed mit den neuesten Guides und Forum-Threads zur Stadt und Hochschule aus dem eigenen Profil.

**Wohnen**
- Anzeigen für WG-Zimmer, Wohnungen und Wohnheimzimmer, filterbar nach Stadt, Wohnform, Warmmiete und Wohnfläche.
- Foto-Upload pro Anzeige (JPEG, PNG oder WebP, max. 8 MB pro Datei). Die Bilder liegen im lokalen Dateisystem, die Metadaten in der Datenbank.

**Jobbörse**
- Stellenangebote für Minijobs, Praktika, Werkstudenten- und Teilzeitstellen, filterbar nach Stadt, Art der Stelle und Mindeststundenlohn.

**Konto**
- Registrierung und Login mit JWT-Access-Token und Refresh-Token.
- Profilseite: Profildaten (inkl. Stadt und Hochschule) ändern und Passwort wechseln.

### Öffentlich oder nur mit Login?

Laut `SecurityConfig` gilt:

| Bereich | Ohne Login | Mit Login |
|---|---|---|
| Auth (`/auth/**`), Swagger UI | alles | – |
| Guides | veröffentlichte Guides lesen | erstellen, bearbeiten, löschen, „Meine Guides“ |
| Forum | Threads und Antworten lesen | Threads/Antworten verfassen, bearbeiten, löschen, „Meine Threads“ |
| Jobbörse | Stellen lesen | erstellen, bearbeiten, löschen, „Meine Stellen“ |
| Wohnen | – | alles (Anzeigen enthalten Adressen) |
| To-dos, Profil | – | alles |
| Admin (`/admin/**`) | – | nur mit Rolle `ADMIN` |

## Tech-Stack

| Ebene | Technologien |
|---|---|
| Backend | Java 21, Spring Boot 4.0 (Web MVC, Data JPA, Security, Validation), Maven Wrapper |
| Authentifizierung | JWT mit jjwt 0.13 (zustandsloser Access-Token + Refresh-Token in der DB), BCrypt |
| Datenbank | PostgreSQL, Schema wird von Hibernate verwaltet (`ddl-auto=update`) |
| API-Doku | springdoc-openapi (Swagger UI) |
| Sonstiges | Lombok |
| Frontend | React 19, TypeScript, Vite, React Router 7, Axios |
| Tests | JUnit 5 + Mockito (Service-Schicht), ESLint im Frontend |

## Projektstruktur

```
uniguide/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/samir/uniguide/
│   │   │   ├── config/        # Swagger-/OpenAPI-Konfiguration
│   │   │   ├── controller/    # REST-Controller
│   │   │   ├── dto/           # Request- und Response-DTOs
│   │   │   ├── exception/     # eigene Exceptions + globaler Handler
│   │   │   ├── model/         # JPA-Entities und Enums
│   │   │   ├── repository/    # Spring-Data-Repositories + Specifications (Filter)
│   │   │   ├── security/      # SecurityConfig, JWT-Filter, Fehler-Handler
│   │   │   └── service/       # Geschäftslogik, JWT, Dateiablage
│   │   └── resources/
│   │       └── application.properties
│   └── test/java/...          # Unit-Tests für die Services
└── frontend/
    ├── vite.config.ts
    └── src/
        ├── api/               # Axios-Client und API-Module
        ├── components/        # wiederverwendbare UI-Komponenten
        ├── context/           # Auth-Context
        ├── pages/             # eine Komponente pro Route
        ├── styles/            # Design-Tokens und gemeinsame Styles
        └── types/             # TypeScript-Typen passend zu den DTOs
```

## Lokal starten

### Voraussetzungen

- JDK 21 (Maven muss nicht installiert sein, der Maven Wrapper ist dabei)
- PostgreSQL
- Node.js 20.19+ oder 22.12+ (Vorgabe von Vite 8; in `package.json` ist keine Version festgelegt) und npm

### 1. Datenbank anlegen

```sql
CREATE DATABASE uniguide;
```

Die Tabellen legt Hibernate beim ersten Start selbst an (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Backend konfigurieren

In `application.properties` ist `spring.profiles.active=local` gesetzt. Zugangsdaten und JWT-Secret werden dort aus Umgebungsvariablen gelesen (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). Für die lokale Entwicklung ist es einfacher, die Datei `src/main/resources/application-local.properties` anzulegen (sie steht in `.gitignore`) und die Werte dort zu überschreiben:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/uniguide
spring.datasource.username=<dein-db-benutzer>
spring.datasource.password=<dein-db-passwort>

jwt.secret=<base64-kodiertes-256-bit-secret>
```

Das JWT-Secret muss ein Base64-kodierter Schlüssel mit mindestens 256 Bit sein, zum Beispiel:

```bash
openssl rand -base64 32
```

Folgende Werte haben bereits Standardwerte in `application.properties` und lassen sich bei Bedarf in derselben Datei überschreiben:

| Schlüssel | Standard | Bedeutung |
|---|---|---|
| `jwt.expiration` | `1800000` | Gültigkeit des Access-Tokens in ms (30 Min.) |
| `storage.local.dir` | `uploads` | Ordner für hochgeladene Wohnungsfotos (relativ zum Arbeitsverzeichnis) |
| `server.port` | `8081` | Port des Backends |

Refresh-Tokens sind 7 Tage gültig (festgelegt in `AuthService`).

### 3. Backend starten

```bash
./mvnw spring-boot:run        # unter Windows: mvnw.cmd spring-boot:run
```

- API: http://localhost:8081
- Swagger UI: http://localhost:8081/swagger-ui/index.html

Neue Konten bekommen die Rolle `STUDENT`. Einen Endpunkt zum Anlegen von Admins gibt es nicht – die Rolle wird direkt in der Datenbank vergeben:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = '<dein-benutzername>';
```

### 4. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Anschließend die von Vite ausgegebene URL öffnen (meist http://localhost:5173). Im Dev-Modus leitet Vite alle Anfragen an `/api/*` an `http://localhost:8081` weiter und entfernt dabei das Präfix `/api` – eine CORS-Konfiguration ist also nicht nötig.

## Tests und Checks

```bash
# Backend
./mvnw test                                   # alle Tests
./mvnw test -Dtest=GuideServiceTest           # eine Testklasse
./mvnw test -Dtest=GuideServiceTest#method    # eine einzelne Testmethode

# Frontend (im Ordner frontend/)
npm run lint
npm run build                                 # Typprüfung + Produktions-Build
```

Die Service-Tests arbeiten mit Mockito und brauchen keine Datenbank. `UniguideApplicationTests` startet dagegen den kompletten Spring-Kontext und setzt eine erreichbare PostgreSQL-Instanz sowie eine gültige Konfiguration voraus.

## API im Überblick

Alle Endpunkte sind in der Swagger UI dokumentiert. Geschützte Endpunkte erwarten den Header `Authorization: Bearer <access-token>`.

| Basispfad | Zweck |
|---|---|
| `/auth` | Registrierung, Login, Access-Token erneuern |
| `/users/me` | eigenes Profil lesen und ändern, Passwort ändern |
| `/guides` | veröffentlichte Guides auflisten und filtern, eigene Guides, anlegen/bearbeiten/löschen |
| `/admin/guides` | Moderation: alle Guides anzeigen, freigeben oder ablehnen (`ADMIN`) |
| `/forum/threads` | Threads auflisten/filtern, eigene Threads, anlegen/bearbeiten/löschen, Antworten schreiben |
| `/forum/replies/{id}` | Antwort als gelöscht markieren |
| `/todos` | persönliche To-do-Liste (CRUD) |
| `/housing` | Wohnungsanzeigen auflisten/filtern, eigene Anzeigen, CRUD |
| `/housing/{id}/photos`, `/housing/photos/{id}` | Fotos hochladen, auflisten, abrufen und löschen |
| `/jobs` | Stellenangebote auflisten/filtern, eigene Stellen, CRUD |

## Stand und Ausblick

UniGuide wird aktiv weiterentwickelt und läuft derzeit nur lokal.

Als Nächstes geplant:
- Deployment mit Docker (Backend, Frontend und PostgreSQL) – noch nicht umgesetzt.

## Autor

Samir Pulatov
