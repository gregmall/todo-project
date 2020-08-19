require('dotenv').config();
const { execSync } = require('child_process');
const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');
describe('routes', () => {
  let token;
  const todo = {
    id: 4,
    todo: 'car wash',
    completed: true,
    owner_id: 2,
  };
  beforeAll(async done => {
    execSync('npm run setup-db');
    client.connect();
    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'white@red.com',
        password: '1234'
      });
    token = signInData.body.token;
    return done();
  });
  afterAll(done => {
    return client.end(done);
  });
  test('returns a new todo when creating new todo', async(done) => {
    const data = await fakeRequest(app)
      .post('/api/todos')
      .send(todo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(todo);
    done();
  });
  test('returns all todos for the user when hitting GET /todos', async(done) => {
    const expected = [
      {
        todo: 'car wash',
        completed: true,
        id: 4,
        owner_id: 2,
        
      },
    ];
    const data = await fakeRequest(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });
  test('returns a single todo for the user when hitting GET /todos/:id', async(done) => {
    const expected = {
      todo: 'car wash',
      completed: true,
      id: 4,
      owner_id: 2,
      
    };
    const data = await fakeRequest(app)
      .get('/api/todos/25')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });
  test('updates a single todo for the user when hitting PUT /todo/:id', async(done) => {
    const todo = {

      todo: 'car wash',
      completed: true,
      id: 4,
      owner_id: 2,
    };
    const expectedTodos = [{
      todo: 'car wash',
      completed: true,
      id: 4,
      owner_id: 2,
    }];
    const data = await fakeRequest(app)
      .put('/api/todos/25')
      .send(todo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    const todos = await fakeRequest(app)
      .get('/api/todos')
      .send(todo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(todo);
    expect(todos.body).toEqual(expectedTodos);
    done();
  });
  test('delete a single todo for the user when hitting DELETE /todos/:id', async(done) => {
    await fakeRequest(app)
      .delete('/api/todos/25')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    const data = await fakeRequest(app)
      .get('/api/todos/')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual([]);
    done();
  });
});