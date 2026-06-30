/* eslint-disable no-unused-vars */

// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import { Blog, User } from "../../../src/models/index.js";

// Test data
import initialBlogs from "../../data/initialBlogs.js";
import initialUsers from "../../data/initialUsers.js";

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
describe("the Blogs GET route", () => {
  beforeEach(async () => {
    // Remove all blogs before each test
    await Blog.truncate({ restartIdentity: true, cascade: true });
    await User.truncate({ restartIdentity: true, cascade: true });

    // Add a new user
    const user = initialUsers[0];
    await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Log in the user
    const loginResponse = await api
      .post("/api/login")
      .send({ username: user.username, password: user.password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    loggedUser = loginResponse.body;

    // Stores all initial blogs into the database
    for (const blog of initialBlogs) {
      await api
        .post("/api/blogs")
        .send(blog)
        .set("Authorization", `Bearer ${loggedUser.token}`)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    }
  });

  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the correct total number of blogs
    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  test("all blogs should contain the name of the user who added it", async () => {
    // Get all available blogs
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert each blog contains the respective user's name
    for (const blog of response.body) {
      assert.strictEqual(blog.user.name, loggedUser.name);
    }
  });

  test("fetching a single blog should also contain the user's name", async () => {
    // Get the first blog from the initial list
    const blogToView = initialBlogs[0];

    const response = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Remove the id, createdAt and updatedAt fields from the blog
    const { id, createdAt, updatedAt, ...otherFields } = response.body;

    // Assert the data is correct
    assert.deepStrictEqual(otherFields, {
      ...blogToView,
      user: { name: loggedUser.name },
    });
  });

  test("a blog can be fetch through its id value", async () => {
    // Get the first blog from the initial list
    const blogToView = initialBlogs[0];

    const response = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Remove the id and user fields from the blog
    const { id, user, ...otherFields } = response.body;

    // Assert the data is correct
    assert.deepStrictEqual(otherFields, {
      ...blogToView,
      createdAt: otherFields.createdAt,
      updatedAt: otherFields.updatedAt,
    });
  });

  test("a non-existing id should return a proper status code", async () => {
    await api.get("/api/blogs/0").expect(404);
  });

  test("an empty blogs list should be properly returned", async () => {
    // Empty the table before the test
    await Blog.truncate({ restartIdentity: true, cascade: true });

    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.deepStrictEqual(response.body, []);
  });
});
