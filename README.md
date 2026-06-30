# BlogList

## Table of Contents

- [Setup](#setup)
- [ENV variables](#env-variables)
- [Usage](#usage)
- [Docker](#docker)
- [CRUD operations](#crud-operations)
- [Tests](#tests)
- [ESLint](#eslint)


## Setup

Install the server dependencies
```bash
cd ./server && npm install
```

Install the client dependencies
```bash
cd ./client && npm install
```


## ENV variables

The `.env` file must contain the following variables scheme
```conf
DATABASE_URL=postgres://<username>:<password>@<hostname>:<port>/blogslist
TEST_DATABASE_URL=postgres://<username>:<password>@<hostname>:<port>/test_blogslist
E2E_DATABASE_URL=postgres://<username>:<password>@<hostname>:<port>/e2e_blogslist
PORT=3001
SECRET=<insert_your_secret_passphrase_here>
DATABASE_SSL=true
```

- `DATABASE_SSL` should only be set to `false` inside of Docker networks.


## Usage

Start the Express server
```bash
cd ./server && npm run start
```

Start the Vite server
```bash
cd ./client && npm run dev
```

- API requests on http://localhost:3001/api
- Web UI access on http://localhost:5173

### CLI

Print all available Blogs on the CLI (does not require to start the server)
```bash
npm run cli
```


## Docker

Docker Composer orchestration using Nginx as a reverse proxy for the frontend and backend.

### Development build

Features:

- Hot reloading of files for both frontend and backend.

- Containerized PostgreSQL database, with persistent data stored inside `/psql-data`.

Start the orchestration
```bash
docker compose -f ./docker-compose.dev.yml up --build
```

- API requests on http://localhost:8000/api
- Web UI access on http://localhost:8000

Cleanup
```bash
docker compose -f ./docker-compose.dev.yml down -v
```

#### Database access via Client UI

Access the database with the following credentials

- Username: `admin`
- Password: `admin`
- Database: `blogslist`
- Port: `5432`
- Disable the SSL connection if using tools such as **pgAdmin**

#### Database access via psql

Enter the container
```bash
docker exec -it blogslist-dev-db bash
```

Access psql
```bash
psql -U admin -W -d blogslist
```

- Password: `admin`

### Integration tests

**Note**: the test data is stored temporarily inside a PostgreSQL container.

Run all tests
```bash
docker compose -f ./docker-compose.test.yml up --build --abort-on-container-exit
```

Cleanup
```bash
docker compose -f ./docker-compose.test.yml down -v
```


## CRUD operations

**Note**: when running the Docker orchestration, use proxied Nginx port `8000` for all HTTP requests.

### GET

- Fetch all blogs
  ```bash
  curl -X GET http://localhost:3001/api/blogs
  ```

- Fetch all users
  ```bash
  curl -X GET http://localhost:3001/api/users
  ```

- Server health check
  ```bash
  curl -X GET http://localhost:3001/api/health
  ```

- Test route to check the server (**Not available** on the Docker orchestration)
  ```bash
  curl -X GET http://localhost:3001
  ```

#### Search

- Search by the **blog title**
  ```bash
  curl -X GET http://localhost:3001/api/blogs?title=<search_term>
  ```

- Search by the **author's name**
  ```bash
  curl -X GET http://localhost:3001/api/blogs?author=<search_term>
  ```

- Search by **both** the blog title and author's name
  ```bash
  curl -X GET http://localhost:3001/api/blogs?search=<search_term>
  ```

- Filter the reading list entries based on the read status (`true` or `false`)
  ```bash
  curl -X GET http://localhost:3001/api/users/<id>?read=true
  ```

#### Authors

- Get the number of blogs and total likes per author
  ```bash
  curl -X GET http://localhost:3001/api/authors
  ```


### POST

- Create a new blog (likes and year fields are **optional**)
  ```bash
  curl -X POST http://localhost:3001/api/blogs -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{ "title":"My blog", "author":"The blogger", "url":"https://myblog.com", "year": 2000, "likes":10 }'
  ```

  - The year must be between **1991** and the **current** year.

- Create a new user
  ```bash
  curl -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d '{ "username":"admin", "name":"Administrator", "password":"admin" }'
  ```

- Logging in
  ```bash
  curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{ "username":"admin", "password":"admin" }'
  ```

- Adding a blog to your reading list (a user can only modify its own reading list)
  ```bash
  curl -X POST http://localhost:3001/api/readinglists -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{ "userId":1, "blogId":1 }'
  ```

### DELETE

- Delete a blog
  ```bash
  curl -X DELETE http://localhost:3001/api/blogs/<id> -H "Authorization: Bearer <token>"
  ```

- Delete a user
  ```bash
  curl -X DELETE http://localhost:3001/api/users/<id>
  ```

- Logout
  ```bash
  curl -X DELETE http://localhost:3001/api/logout
  ```

### PUT

- Update the number of likes of a blog
  ```bash
  curl -X PUT http://localhost:3001/api/blogs/<id> -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{ "likes":10 }'
  ```

- Modify the read status for a reading list entry (a user can only modify its own reading list)
  ```bash
  curl -X PUT http://locahost:3001/api/readinglists/<id> -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{ "read":true }'
  ```

- Enable or disable a user from logging in (**admins only**)
  ```bash
  curl -X PUT http://localhost:3001/api/users/<username>/disabled -H "Content-Type: application/json"  -H "Authorization: Bearer <token>" -d '{ "disabled":true }'
  ```


## Tests

### Integration tests

Features:

- Implemented using the standard Node.js testing library with Supertest.

- Covers all major valid, invalid and edge-case inputs relevant to the course's exercise requirements.

Enter the server folder
```bash
cd ./server
```

Run all tests
```bash
npm run test
```

Run only the Blogs routes test suites
```bash
npm run test -- ./tests/integration/blogs/*
```

Run only the Users routes test suites
```bash
npm run test -- ./tests/integration/users/*
```

Run only the Login route test suite
```bash
npm run test -- ./tests/integration/login_route.test.js
```


## ESLint

Enter the server folder
```bash
cd ./server
```

Run ESLint
```bash
npm run lint
```
