// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import Blog from "../../../src/models/blog.js";
import initialBlogs from "../../data/initialBlogs.js";
import initialUsers from "../../data/initialUsers.js";

const api = supertest(app);

// Global variables
let loggedUser;

// Helper functions
async function getAmount(route) {
  const getResponse = await api.get(`/api/${route}`);
  return getResponse.body.length;
}

// Reset all data on the database tables
before(async () => {
  await setupDb();
  await api.post("/api/reset");

  // Create a new user for the tests
  const user = initialUsers[0];

  await api
    .post("/api/users")
    .send(user)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  // Log in the user and store the auth token
  const loginResponse = await api
    .post("/api/login")
    .send({ username: user.username, password: user.password })
    .expect(200)
    .expect("Content-Type", /application\/json/);

  loggedUser = loginResponse.body;
});

// Close the database connection after all tests have been finished
after(async () => {
  await dbCleanup();
});

// Tests
describe("the Blogs DELETE route", () => {
  beforeEach(async () => {
    // Remove all blogs before each test
    await Blog.truncate({ restartIdentity: true, cascade: true });
  });

  test("a blog can be removed", async () => {
    const blog = initialBlogs[0];

    // Store the initial blogs length
    const initialAmount = await getAmount("blogs");

    // Add a blog to be removed
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Confirm the blogs length has increased
    let currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Remove the blog
    await api
      .delete(`/api/blogs/${Number(postResponse.body.id)}`)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(204);

    // Assert the blogs length has decreased
    currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a user cannot remove another user's blog", async () => {
    const blog = initialBlogs[0];

    // Add a blog to be removed
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Store the initial blogs length
    const initialAmount = await getAmount("blogs");

    // Create a new user
    const anotherUser = initialUsers[1];

    await api
      .post("/api/users")
      .send(anotherUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Log in the user and store the auth token
    const loginResponse = await api
      .post("/api/login")
      .send({ username: anotherUser.username, password: anotherUser.password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Remove the blog
    const deleteResponse = await api
      .delete(`/api/blogs/${Number(postResponse.body.id)}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.strictEqual(
      deleteResponse.body.error,
      "Only the user who added the blog can remove it",
    );

    // Assert no blogs have been removed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a non-existing id should return a proper status code", async () => {
    await api
      .delete("/api/blogs/0")
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(404);
  });

  test("an invalid ID format should return a proper error message", async () => {
    const response = await api
      .delete("/api/blogs/my_blog")
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(response.body.error.includes("Invalid ID format"));
  });

  test("a negative ID should return a proper error message", async () => {
    const response = await api
      .delete("/api/blogs/-1")
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(response.body.error.includes("Invalid ID format"));
  });

  test("a non-authorized user should not be able to delete a blog", async () => {
    const blog = initialBlogs[0];

    // Store the initial blogs length
    const initialAmount = await getAmount("blogs");

    // Add a blog to be removed
    await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Confirm the blogs length has increased
    let currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Try to delete a blog
    const response = await api
      .delete("/api/blogs/1")
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.strictEqual(response.body.error, "token missing");

    // Confirm the blogs length has not changed
    currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount + 1, currentAmount);
  });
});
