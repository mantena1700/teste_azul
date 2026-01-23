# Backend Documentation

## Overview
The backend is a Node.js/Express application that serves as the API for the DOM Azul platform. It connects to a PostgreSQL database to manage data for clinics, users, patients, sessions, and financial records.

## Directory Structure
- `server.js`: The main entry point. Contains all API routes, database connection logic, and middleware.
- `Dockerfile`: Configuration for containerizing the backend service.
- `apply_schema.js`: Utility script to apply database schema updates/migrations manually.
- `package.json`: Dependencies and scripts.

## Database
We use **PostgreSQL** as the primary database.
- **Connection**: Managed via `pg` (node-postgres) pool in `server.js`.
- **Schema**: Defined in `../database/schema.sql`.
- **Migrations**: Currently handled manually or via `apply_schema.js`.

### Environment Variables
Ensure the following variables are set (usually in `.env` or Docker environment):
- `DB_HOST`: Database host address.
- `DB_PORT`: Database port (default: 5432).
- `DB_NAME`: Database name (default: domazul).
- `DB_USER`: Database user.
- `DB_PASSWORD`: Database password.
- `PORT`: API server port (default: 3001).

## API Patterns
All routes are defined in `server.js`.
- **Prefix**: All API endpoints start with `/api`.
- **Response Format**: JSON.
  - Success: `{ success: true, data: ... }` or direct array/object.
  - Error: `{ success: false, message: "Error description" }` or `{ error: "Error description" }`.

## Adding New Routes
1.  Open `server.js`.
2.  Locate the relevant section (e.g., `// ==================== NEW MODULE ====================`).
3.  Define the route using `app.get()`, `app.post()`, `app.put()`, or `app.delete()`.
4.  Use `async/await` for database operations `pool.query()`.
5.  Always wrap DB calls in `try/catch` blocks to handle errors gracefully.

### Example
```javascript
app.get('/api/example', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM example_table');
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
```
