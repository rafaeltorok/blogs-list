/* eslint-disable no-unused-vars */

// Test Dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import ReadingLists from "../../../src/models/readingList.js";

// Test data
import initialUsers from "../data/initialUsers.js";
import initialBlogs from "../data/initialBlogs.js";

// Helper functions
import addEntry from "../helpers/reading-lists/addEntry.js";

// Constants
let loggedUser;

const api = supertest(app);

// Reset all data on the database tables
before(async () => {
  await setupDb();
  await api.post("/api/reset");

  // Add sample user data
  for (const user of initialUsers) {
    await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);
  }

  // Log in the user and store the auth token
  const loginResponse = await api
    .post("/api/login")
    .send({ username: initialUsers[0].username, password: initialUsers[0].password })
    .expect(200)
    .expect("Content-Type", /application\/json/);

  loggedUser = loginResponse.body;

  // Add sample blogs data
  for (const blog of initialBlogs) {
    await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);
  }
});

// Close the database connection after all tests have been finished
after(async () => {
  await dbCleanup();
});

// Tests
describe("the Reading Lists POST route", () => {
  beforeEach(async () => {
    await ReadingLists.truncate({ restartIdentity: true });
  });

  test("a blog can be added to a user's reading list", async () => {
    const blogToAdd = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Add the blog to the currently logged user's reading list
    const newEntry = { userId: userData.body.id, blogId: blogToAdd.body.id };
    const newEntryResponse = await addEntry(api, newEntry, loggedUser.token, 200);

    // Get the updated user reading list entry
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Confirm the blog is present on the reading list
    assert.deepStrictEqual({
      id: blogToAdd.body.id,
      title: blogToAdd.body.title,
      author: blogToAdd.body.author,
      url: blogToAdd.body.url,
      likes: blogToAdd.body.likes,
    }, {
      id: userData.body.readings[0].id,
      title: userData.body.readings[0].title,
      author: userData.body.readings[0].author,
      url: userData.body.readings[0].url,
      likes: userData.body.readings[0].likes,
    });

    // Confirm the response message has the correct data on it
    assert.strictEqual(
      newEntryResponse.body.message,
      `${blogToAdd.body.title} by ${blogToAdd.body.author} was added to the ${userData.body.name}'s reading list`);
  });

  test("a duplicate entry should not be added", async () => {
    const blogToAdd = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Add the blog to the currently logged user's reading list
    const newEntry = { userId: userData.body.id, blogId: blogToAdd.body.id };
    await addEntry(api, newEntry, loggedUser.token, 200);

    // Get the current amount for the reading list entries
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const entriesLength = userData.body.readings.length;

    // Try to add the same blog again
    const duplicateEntryResponse = await addEntry(api, newEntry, loggedUser.token, 400);

    // Get the updated list entries
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Confirm the entry has been added only once
    assert.strictEqual(userData.body.readings.length, entriesLength);

    // Confirm the error message is present within the response
    assert.strictEqual(
      duplicateEntryResponse.body.error,
      "Blog entry has already been added");
  });
});
