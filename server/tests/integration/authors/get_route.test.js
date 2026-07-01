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
describe("the Authors GET route", () => {
  beforeEach(async () => {
    // Remove all blogs and users before each test
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

  test("author's info should be returned as json", async () => {
    await api
      .get("/api/authors")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the correct total number of authors
    assert.strictEqual(response.body.length, 3);
  });

  test("all author's info fields should be present", async () => {
    // Get the author's information
    const response = await api
      .get("/api/authors")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert each field is present on the response data
    for (const author of response.body) {
      assert.ok("author" in author);
      assert.ok("blogs" in author);
      assert.ok("likes" in author);
    }
  });

  test("the amount of blogs and total likes should be valid numbers", async () => {
    // Get the author's information
    const response = await api
      .get("/api/authors")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert both fields are valid and positive numbers
    for (const author of response.body) {
      const blogs = Number(author.blogs);
      const likes = Number(author.likes);

      assert.ok(isFinite(blogs) && blogs >= 0);
      assert.ok(isFinite(likes) && likes >= 0);
    }
  });
});
