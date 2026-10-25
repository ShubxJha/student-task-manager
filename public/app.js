const state = { tasks: [], filter: 'all', query: '', editing: null };
const $ = (selector) => document.querySelector(selector);
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again.');
  return result;
}
function safe(value = '') { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2400); }
function render() {
  const today = new Date().toISOString().slice(0, 10);
  const done = state.tasks.filter((task) => task.completed).length;
  $('#total-stat').textContent = state.tasks.length;
  $('#today-stat').textContent = state.tasks.filter((task) => !task.completed && task.dueDate === today).length;
  $('#done-stat').textContent = done;
  $('#heading-count').textContent = state.tasks.length;
  $('#nav-count').textContent = state.tasks.length - done;
  const progress = state.tasks.length ? Math.round(done / state.tasks.length * 100) : 0;
  $('#progress-label').textContent = `${progress}% complete`;
  $('#progress-bar').style.width = `${progress}%`;
  const query = state.query.toLowerCase();
  const tasks = state.tasks.filter((task) => (state.filter === 'all' || (state.filter === 'completed' ? task.completed : !task.completed)) && `${task.title} ${task.description}`.toLowerCase().includes(query));
  $('#task-list').innerHTML = tasks.map((task) => {
    const overdue = task.dueDate && task.dueDate < today && !task.completed;
    const date = task.dueDate ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T00:00:00`)) : 'No due date';
    return `<article class="task-row ${task.completed ? 'completed' : ''}" data-id="${safe(task.id)}"><button class="check ${task.completed ? 'checked' : ''}" data-action="toggle" aria-label="Toggle completion">${task.completed ? '✓' : ''}</button><div class="task-content"><strong>${safe(task.title)}</strong>${task.description ? `<small>${safe(task.description)}</small>` : ''}</div><div class="task-meta"><span class="due ${overdue ? 'overdue' : ''}">${overdue ? 'Overdue · ' : ''}${date}</span><span class="priority ${safe(task.priority)}">${safe(task.priority)}</span><button class="row-action" data-action="edit" aria-label="Edit">✎</button><button class="row-action delete" data-action="delete" aria-label="Delete">×</button></div></article>`;
  }).join('');
  $('#empty-state').hidden = tasks.length > 0;
}
async function refresh() { try { state.tasks = await api('/api/tasks'); render(); } catch (error) { toast(error.message); } }
function openDialog(task) {
  state.editing = task || null;
  $('#dialog-title').textContent = task ? 'Edit your task' : 'Add a task';
  $('#save-task').textContent = task ? 'Save changes →' : 'Save task →';
  $('#title').value = task?.title || ''; $('#description').value = task?.description || '';
  $('#dueDate').value = task?.dueDate || ''; $('#priority').value = task?.priority || 'medium'; $('#form-error').textContent = '';
  $('#task-dialog').showModal(); $('#title').focus();
}
function closeDialog() { $('#task-dialog').close(); state.editing = null; }
$('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
$('#add-task').addEventListener('click', () => openDialog(null));
$('#empty-add').addEventListener('click', () => openDialog(null));
$('#close-dialog').addEventListener('click', closeDialog);
$('#cancel-dialog').addEventListener('click', closeDialog);
$('#task-dialog').addEventListener('click', (event) => { if (event.target === $('#task-dialog')) closeDialog(); });
$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const editing = state.editing;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  data.completed = editing?.completed || false;
  try { await api(editing ? `/api/tasks/${editing.id}` : '/api/tasks', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(data) }); closeDialog(); await refresh(); toast(editing ? 'Task updated.' : 'Task added. You’ve got this!'); }
  catch (error) { $('#form-error').textContent = error.message; }
});
$('.filters').addEventListener('click', (event) => { const button = event.target.closest('[data-filter]'); if (!button) return; state.filter = button.dataset.filter; document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button)); render(); });
$('#search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('#task-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const task = state.tasks.find((item) => item.id === button.closest('[data-id]').dataset.id);
  try {
    if (button.dataset.action === 'edit') return openDialog(task);
    if (button.dataset.action === 'delete') { if (!confirm(`Delete “${task.title}”?`)) return; await api(`/api/tasks/${task.id}`, { method: 'DELETE' }); toast('Task removed.'); }
    if (button.dataset.action === 'toggle') await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) });
    await refresh();
  } catch (error) { toast(error.message); }
});
refresh();
