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

## Deploy on Render

This project is a Docker web service because Express serves both the website and its REST API.

1. Push this repository to GitHub and sign in to [Render](https://render.com/).
2. Choose **New + > Web Service**, connect the `student-task-manager` GitHub repository, and select the `main` branch.
3. Set **Language** to **Docker**. Leave **Root Directory** empty when the `Dockerfile` and `package.json` are at the repository root. If this project is inside a larger repository, set Root Directory to this project's folder (for example, `Practical 4`).
4. Select a compute plan. The free instance is enough to demonstrate the website, but free instances spin down when idle and do not support persistent disks. Because this app stores tasks in a JSON file, tasks on a free Render instance may be lost after a restart or redeploy.
5. To preserve tasks on Render, use a paid web service with a persistent disk mounted at `/app/data`, and set the environment variable `DATA_FILE` to `/app/data/tasks.json`.
6. Create the service. After deployment completes, open its `onrender.com` URL and verify the app and `/api/health` endpoint.

Render can automatically rebuild and redeploy when new commits are pushed to the connected branch. Make code changes locally, commit them, and push to GitHub; the updated site appears after deployment finishes. Changes that have not been pushed are not included in the live site.

For the practical demonstration, show the local Docker container, create and update tasks, then show the Render URL and health endpoint. If deploying on the free plan, mention that cloud file storage is temporary; the local Docker Compose named volume remains persistent on the computer.

