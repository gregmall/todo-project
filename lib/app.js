const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this protected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/todos', async(req, res) => {
  const userId = req.userId;


  const data = await client.query(`
        SELECT * from todos WHERE owner_id =${userId}`);
  

  res.json(data.rows);
});

app.use(require('./middleware/error'));

app.post('/api/todos', async(req, res) => {
  try {
    const userId = req.userId;
    const todo = {
      todo: req.body.todo,
      completed: req.body.completed
    };

    console.log(userId, todo);

    const data = await client.query(`
        INSERT INTO todos (todo, completed, owner_id)
        VALUES ($1, $2, $3)
        RETURNING * 
        `, [todo.todo, todo.completed, userId]);
  

    res.json(data.rows);
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/todos/:id', async(req, res) => {
  const todosId = req.params.id;
  const userId = req.userId;
  const data = await client.query(`
      SELECT * FROM todos
      WHERE todos.id =$1 AND todos.owner_id =$2
      `, [todosId, userId]);

  res.json(data.rows[0]);
});

app.delete('/api/todos/:id', async(req, res) => {

  const todosId = req.params.id;
  const userId = req.userId;
  const data = await client.query(`
    DELETE FROM todos
    WHERE todos.id =$1 AND todos.owner_id =$2
    `, [todosId, userId]);
  res.json(data.rows[0]);
});


app.put('/api/todos/:id', async(req, res) => {
  try {
    const todoId = req.params.id;
    const userId = req.userId;
    const updateTodo = {
      todo: req.body.todo,
      completed: req.body.completed

    };

    const data = await client.query(`
      UPDATE todos
        SET todo=$1, completed=$2
        WHERE todos.id = $3 AND todos.owner_id = $4
        RETURNING * 
        `,  [updateTodo.todo, updateTodo.completed, todoId, userId]);
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }

});


module.exports = app;
