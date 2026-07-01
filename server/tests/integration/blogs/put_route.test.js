/* eslint-disable no-unused-vars */

// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import Blog from "../../../src/models/blog.js";

// Test data
import initialBlogs from "../data/initialBlogs.js";
import initialUsers from "../data/initialUsers.js";

const api = supertest(app);

// Global variables
let postResponse;
let loggedUser;

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
describe("the Blogs PUT route", () => {
  beforeEach(async () => {
    // Remove all blogs before each test
    await Blog.truncate({ restartIdentity: true, cascade: true });

    // Create a new blog to be updated
    const blogData = initialBlogs[0];

    postResponse = await api
      .post("/api/blogs")
      .send(blogData)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);
  });

  test("the amount of likes can be updated", async () => {
    // Update the amount of likes
    await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: 1000 })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the likes counter has been correctly updated
    const updatedBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(updatedBlog.body.likes, 1000);
  });

  test("zero is a valid amount", async () => {
    // Update the amount of likes
    await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: 0 })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the likes counter has been correctly updated
    const updatedBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(updatedBlog.body.likes, 0);
  });

  test("other fields should be ignored when updating", async () => {
    const updatedData = {
      title: "New title",
      author: "New author",
      url: "http://newurl.com",
      likes: 1,
      year: 1991,
    };

    // Update the amount of likes
    await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send(updatedData)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the updated info from the database
    const updatedBlog = await api.get(`/api/blogs/${postResponse.body.id}`);

    // Remove the userId and user fields
    const { userId, ...postResponseFields } = postResponse.body;
    const { user, ...updatedBlogFields } = updatedBlog.body;

    // Assert the only the likes field has been updated
    assert.deepStrictEqual(updatedBlogFields, {
      ...postResponseFields,
      likes: 1,
      createdAt: updatedBlogFields.createdAt,
      updatedAt: updatedBlogFields.updatedAt,
    });
  });

  test("only the updatedAt field should be updated", async () => {
    // Get the original data
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);

    // Update the amount of likes
    await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: 1 })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the updated info from the database
    const updatedBlog = await api.get(`/api/blogs/${postResponse.body.id}`);

    // Remove the userId and user fields
    const { userId, ...postResponseFields } = postResponse.body;
    const { user, ...updatedBlogFields } = updatedBlog.body;

    // Assert the createdAt field remains the same
    assert.deepStrictEqual(
      originalBlog.body.createdAt,
      updatedBlogFields.createdAt,
    );

    // Assert the updatedAt field has changed
    assert.notStrictEqual(
      originalBlog.body.updatedAt,
      updatedBlogFields.updatedAt,
    );
  });

  test("a negative amount should return a proper error message", async () => {
    // Update the amount of likes
    const putResponse = await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: -1 })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      putResponse.body.error.includes(
        "The likes counter must be a positive number",
      ),
    );

    // Assert the original likes counter has not been updated
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(postResponse.body.likes, originalBlog.body.likes);
  });

  test("a non-numeric amount should return a proper error message", async () => {
    // Update the amount of likes
    const putResponse = await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: "likes" })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      putResponse.body.error.includes(
        "The likes counter must be a valid number",
      ),
    );

    // Assert the original likes counter has not been updated
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(postResponse.body.likes, originalBlog.body.likes);
  });

  test("an infinite amount should return a proper error message", async () => {
    // Update the amount of likes
    const putResponse = await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: Infinity })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      putResponse.body.error.includes(
        "The likes counter must be a valid number",
      ),
    );

    // Assert the original likes counter has not been updated
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(postResponse.body.likes, originalBlog.body.likes);
  });

  test("an empty amount should return a proper error message", async () => {
    // Update the amount of likes
    const putResponse = await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({})
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      putResponse.body.error.includes(
        "The likes counter must be a valid number",
      ),
    );

    // Assert the original likes counter has not been updated
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(postResponse.body.likes, originalBlog.body.likes);
  });

  test("a non-existing blog should return a proper status code", async () => {
    await api
      .put("/api/blogs/0")
      .send({ likes: 1 })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(404);
  });

  test("a non-authorized user should not be able to update a blog", async () => {
    // Update the amount of likes
    const putResponse = await api
      .put(`/api/blogs/${postResponse.body.id}`)
      .send({ likes: 1 })
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.match(putResponse.body.error, /token missing/i);

    // Assert the original likes counter has not been updated
    const originalBlog = await api.get(`/api/blogs/${postResponse.body.id}`);
    assert.strictEqual(postResponse.body.likes, originalBlog.body.likes);
  });
});
