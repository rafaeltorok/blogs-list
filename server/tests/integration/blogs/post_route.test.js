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

// Constants
import {
  minTitleLength,
  maxTitleLength,
  minAuthorLength,
  maxAuthorLength,
} from "../helpers/minMaxLengths.js";

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
describe("the Blogs POST route", () => {
  beforeEach(async () => {
    // Remove all blogs before each test
    await Blog.truncate({ restartIdentity: true, cascade: true });
  });

  test("a new blog can be added", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const response = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("blogs");

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Remove the id, user and userId fields from the response
    const { id, user, userId, ...responseFields } = response.body;

    // Assert all fields are correct
    assert.deepStrictEqual(responseFields, {
      ...blog,
      createdAt: responseFields.createdAt,
      updatedAt: responseFields.updatedAt,
    });
  });

  test("the user id who created the blog should be within the response", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const response = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("blogs");

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Assert the user's id is present
    assert.ok("userId" in response.body);
  });

  test("the user's name who created the blog should be present", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const response = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("blogs");

    // Get the newly added blog's information
    const getResponse = await api
      .get(`/api/blogs/${response.body.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Assert the user's name is correct
    assert.strictEqual(getResponse.body.user.name, loggedUser.name);
  });

  test("the likes field should default to 0 when not present", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // Remove the likes field
    const { likes, ...otherFields } = blog;

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(otherFields)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Assert the total number of objects has increased
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(currentAmount, initialAmount + 1);

    // Assert the default amount of likes is correct
    assert.strictEqual(postResponse.body.likes, 0);
  });

  test("the HTTP protocol is not required on the URL field", async () => {
    // Get a blog from the initial list
    const blog = {
      ...initialBlogs[0],
      url: "my-blog.com",
    };

    // Get the initial amount of objects
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const response = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("blogs");

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Remove the id, user and userId fields from the response
    const { id, user, userId, ...responseFields } = response.body;

    // Assert all fields are correct
    assert.deepStrictEqual(responseFields, {
      ...blog,
      createdAt: responseFields.createdAt,
      updatedAt: responseFields.updatedAt,
    });
  });

  test("missing the title field should return a proper error message", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // Remove the title field
    const { title, ...otherFields } = blog;

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(otherFields)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.ok(postResponse.body.error.includes("Title is required"));

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("missing the author field should return a proper error message", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // Remove the author field
    const { author, ...otherFields } = blog;

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(otherFields)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.ok(postResponse.body.error.includes("Author is required"));

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("missing the url field should return a proper error message", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // Remove the url field
    const { url, ...otherFields } = blog;

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(otherFields)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.ok(postResponse.body.error.includes("URL is required"));

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a non-numeric amount of likes should return a proper error message", async () => {
    // Get a blog from the initial list
    const blog = {
      ...initialBlogs[0],
      likes: "likes",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.ok(
      postResponse.body.error.includes(
        "The likes counter must be a valid number",
      ),
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a negative amount of likes should return a proper error message", async () => {
    // Get a blog from the initial list
    const blog = {
      ...initialBlogs[0],
      likes: -1,
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.ok(
      postResponse.body.error.includes(
        "The likes counter must be a positive number",
      ),
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a non-authorized user should not be able to add a new blog", async () => {
    // Get a blog from the initial list
    const blog = initialBlogs[0];

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(postResponse.body.error, "token missing");

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the title cannot be below the min length value", async () => {
    const blog = {
      ...initialBlogs[0],
      title: "T",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(
      postResponse.body.error,
      "The title must be between 3 and 32 chars long",
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the title cannot exceed the max length value", async () => {
    const blog = {
      ...initialBlogs[0],
      title: "A very long title that exceeds the max length value",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(
      postResponse.body.error,
      "The title must be between 3 and 32 chars long",
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the author's name cannot be below the min length value", async () => {
    const blog = {
      ...initialBlogs[0],
      author: "A",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(
      postResponse.body.error,
      "The author's name must be between 3 and 32 chars long",
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the author's name cannot exceed the max length value", async () => {
    const blog = {
      ...initialBlogs[0],
      author: "An author with a really long name",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(
      postResponse.body.error,
      "The author's name must be between 3 and 32 chars long",
    );

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("missing the Top-Level Domain on the URL", async () => {
    const blog = {
      ...initialBlogs[0],
      url: "http://my-blog",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(postResponse.body.error, "Invalid URL format");

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("invalid dot syntax on the URL", async () => {
    const blog = {
      ...initialBlogs[0],
      url: "http://my-blogdotcom",
    };

    // Get the initial number of blogs
    const initialAmount = await getAmount("blogs");

    // POST a new blog
    const postResponse = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the error response message
    assert.strictEqual(postResponse.body.error, "Invalid URL format");

    // Assert the total number of objects has not changed
    const currentAmount = await getAmount("blogs");
    assert.strictEqual(initialAmount, currentAmount);
  });
});
