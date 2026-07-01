/* eslint-disable no-unused-vars */

// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import { User } from "../../../src/models/index.js";

// Test data
import initialBlogs from "../data/initialBlogs.js";
import initialUsers from "../data/initialUsers.js";

const api = supertest(app);

// Global variables
let loggedUser;

// Reset all data on the database tables
before(async () => {
  await setupDb();
  await api.post("/api/reset");
});

// Close the database connection after all tests have been finished
after(async () => {
  await dbCleanup();
});

// Tests
describe("the Users GET route", () => {
  beforeEach(async () => {
    // Remove all users before each test
    await User.truncate({ restartIdentity: true, cascade: true });

    // Stores all initial users into the database
    for (const user of initialUsers) {
      await api
        .post("/api/users")
        .send(user)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    }
  });

  test("users are returned as json", async () => {
    await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all users are returned", async () => {
    const response = await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the correct total number of users
    assert.strictEqual(response.body.length, initialUsers.length);
  });

  test("a user can be fetch through its id value", async () => {
    // Get the first user from the initial list
    const userToView = initialUsers[0];

    const response = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Remove all unnecessary field from the returned user
    const { username, name, createdAt, updatedAt, ...otherFields } =
      response.body;

    // Remove the password field from the original user
    const { password, ...userFields } = userToView;

    // Assert the data is correct
    assert.deepStrictEqual(
      {
        username,
        name,
        createdAt,
        updatedAt,
      },
      {
        ...userFields,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      },
    );
  });

  test("the list of blogs should be included within the returned user", async () => {
    const user = initialUsers[0];

    // Log in the retrieved user
    const loginResponse = await api
      .post("/api/login")
      .send({ username: user.username, password: user.password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    loggedUser = loginResponse.body;

    // Stores all initial blogs
    for (const blog of initialBlogs) {
      await api
        .post("/api/blogs")
        .send(blog)
        .set("Authorization", `Bearer ${loggedUser.token}`)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    }

    // Fetch the user data
    const response = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert all blogs are included within the response
    assert.strictEqual(initialBlogs.length, response.body.blogs.length);
  });

  test("a non-existing id should return a proper status code", async () => {
    await api.get("/api/users/0").expect(404);
  });

  test("the password field is not returned when fetching all users", async () => {
    const response = await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const users = response.body;

    for (const user of users) {
      assert.ok(!("passwordHash" in user));
    }
  });

  test("the password field is not returned when fetching a single user", async () => {
    const response = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const user = response.body;

    assert.ok(!("passwordHash" in user));
  });

  test("an empty users list should be properly returned", async () => {
    // Empty the table before the test
    await User.truncate({ restartIdentity: true, cascade: true });

    // Fetch the list of users
    const response = await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert it is empty
    assert.deepStrictEqual(response.body, []);
  });
});
