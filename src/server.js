const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataFile = path.resolve(process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'tasks.json'));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

async function readTasks() {
  try {
    const tasks = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
async function writeTasks(tasks) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${process.pid}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
  await fs.rename(temp, dataFile);
}
function validate(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object.';
  if (partial && !['title', 'description', 'dueDate', 'priority', 'completed'].some((key) => Object.hasOwn(body, key))) return 'Provide at least one task field to update.';
  if ((!partial || Object.hasOwn(body, 'title')) && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120)) return 'Title is required and must be 1-120 characters.';
  if (Object.hasOwn(body, 'description') && (typeof body.description !== 'string' || body.description.length > 1000)) return 'Description must be at most 1000 characters.';
  if (Object.hasOwn(body, 'dueDate') && body.dueDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) return 'Due date must use YYYY-MM-DD format.';
  if (Object.hasOwn(body, 'priority') && !['low', 'medium', 'high'].includes(body.priority)) return 'Priority must be low, medium, or high.';
  if (Object.hasOwn(body, 'completed') && typeof body.completed !== 'boolean') return 'Completed must be a boolean.';
  return null;
}
function merge(body, previous = {}) {
  return {
    ...previous,
    title: Object.hasOwn(body, 'title') ? body.title.trim() : previous.title,
    description: Object.hasOwn(body, 'description') ? body.description.trim() : previous.description || '',
    dueDate: Object.hasOwn(body, 'dueDate') ? body.dueDate : previous.dueDate || '',
    priority: Object.hasOwn(body, 'priority') ? body.priority : previous.priority || 'medium',
    completed: Object.hasOwn(body, 'completed') ? body.completed : previous.completed || false,
    updatedAt: new Date().toISOString(),
  };
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/tasks', async (_req, res, next) => {
  try { res.json(await readTasks()); } catch (error) { next(error); }
});
app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const task = (await readTasks()).find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
  } catch (error) { next(error); }
});
app.post('/api/tasks', async (req, res, next) => {
  try {
    const issue = validate(req.body);
    if (issue) return res.status(400).json({ error: issue });
    const tasks = await readTasks();
    const now = new Date().toISOString();
    const task = { id: randomUUID(), ...merge(req.body), createdAt: now };
    tasks.push(task);
    await writeTasks(tasks);
    res.status(201).json(task);
  } catch (error) { next(error); }
});
for (const method of ['put', 'patch']) {
  app[method]('/api/tasks/:id', async (req, res, next) => {
    try {
      if (method === 'put' && !['title', 'description', 'dueDate', 'priority', 'completed'].every((key) => Object.hasOwn(req.body || {}, key))) {
        return res.status(400).json({ error: 'PUT requires title, description, dueDate, priority, and completed.' });
      }
      const issue = validate(req.body, method === 'patch');
      if (issue) return res.status(400).json({ error: issue });
      const tasks = await readTasks();
      const index = tasks.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Task not found.' });
      tasks[index] = { ...merge(req.body, tasks[index]), id: tasks[index].id, createdAt: tasks[index].createdAt };
      await writeTasks(tasks);
      res.json(tasks[index]);
    } catch (error) { next(error); }
  });
}
app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const remaining = tasks.filter((item) => item.id !== req.params.id);
    if (remaining.length === tasks.length) return res.status(404).json({ error: 'Task not found.' });
    await writeTasks(remaining);
    res.json({ message: 'Task deleted.' });
  } catch (error) { next(error); }
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});
app.listen(port, '0.0.0.0', () => console.log(`Task Manager listening on port ${port}`));
