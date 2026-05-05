const { Hono } = require('hono');

const app = new Hono();

app.get('/', (c) => {
  return c.json({ message: 'Hello from Hono.js!' });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
console.log(`Hono server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
}; 