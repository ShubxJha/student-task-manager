# Practical 4 - Dockerized Student Task Management

A responsive task manager built with Node.js and Express. Tasks are persisted to a JSON file; the included Compose named volume keeps them across container restarts.

## Run locally

Requires Node.js 20 or newer.

```powershell
npm install
npm start
```

Open `http://localhost:3000`. Data is saved in `data/tasks.json`; set `PORT` or `DATA_FILE` to change the defaults.

## Run with Docker

Requires Docker Desktop with Compose.

```powershell
docker compose up --build -d
docker compose ps
```

Open `http://localhost:3000`. Check `http://localhost:3000/api/health`. To stop the container without removing saved tasks, run:

```powershell
docker compose down
```

## REST API

Requests and responses use JSON. A task includes `id`, `title`, `description`, `dueDate`, `priority`, `completed`, `createdAt`, and `updatedAt`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Read one task |
| POST | `/api/tasks` | Create (201) |
| PUT | `/api/tasks/:id` | Replace task fields |
| PATCH | `/api/tasks/:id` | Update selected fields |
| DELETE | `/api/tasks/:id` | Delete a task |

Example create body:

```json
{
  "title": "Review database lecture",
  "description": "Summarize joins and indexes",
  "dueDate": "2026-10-25",
  "priority": "high",
  "completed": false
}
```

Invalid input returns 400, unknown task IDs return 404, and unexpected errors return 500.

## Build and run an image

```powershell
docker build -t student-task-manager .
docker run --rm -p 3000:3000 -v task-data:/app/data student-task-manager
```

## Cloud deployment

Push the Practical 4 source to GitHub, create a Docker-based web service from that repository on Render, Azure, AWS, or another compatible host, and select the included `Dockerfile`. The server listens on `0.0.0.0` and uses the host-provided `PORT`. Attach persistent storage at `/app/data` and set `DATA_FILE=/app/data/tasks.json`; a container's temporary filesystem may be cleared during redeployment. Open the host's public URL and verify `/api/health`.

