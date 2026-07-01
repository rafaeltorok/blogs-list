// Test Dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import ReadingLists from "../../../src/models/readingList.js";
import User from "../../../src/models/user.js";

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
    .send({
      username: initialUsers[0].username,
      password: initialUsers[0].password,
    })
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
describe("the Reading Lists DELETE route", () => {
  beforeEach(async () => {
    await ReadingLists.truncate({ restartIdentity: true });

    const blogToAdd = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the user to add a new entry to the reading list
    const userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Add the blog to the currently logged user's reading list
    const newEntry = { userId: userData.body.id, blogId: blogToAdd.body.id };
    await addEntry(
      api,
      newEntry,
      loggedUser.token,
      200,
    );
  });

  test("a reading list entry can be removed", async () => {
    // Get the original amount of entries
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const originalEntriesLength = userData.body.readings.length;

    // Remove an entry from the reading list
    await api
      .delete(`/api/readinglists/${userData.body.readings[0].id}`)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(204);

    // Get the user updated reading list
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of entries
    const currentEntriesLength = userData.body.readings.length;

    // Confirm the blog has been removed from the reading list
    assert.strictEqual(userData.body.readings[0], undefined);
    assert.notStrictEqual(originalEntriesLength, currentEntriesLength);
  });

  test("a user should not be able to remove another user's entry", async () => {
    const loginResponse = await api
      .post("/api/login")
      .send({
        username: initialUsers[1].username,
        password: initialUsers[1].password,
      });

    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const originalEntriesLength = userData.body.readings.length;

    const deleteResponse = await api
      .delete(`/api/readinglists/${userData.body.readings[0].id}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Get the current user data
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const currentEntriesLength = userData.body.readings.length;

    // Assert no entries have been removed
    assert.strictEqual(originalEntriesLength, currentEntriesLength);

    // Assert there is an error within the response
    assert.match(deleteResponse.body.error, /you cannot modify another user's reading list/i);
  });

  test("a non-existing entry id should return a proper status code", async () => {
    // Assert the correct status code is returned
    await api
      .delete("/api/readinglists/0")
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(404);
  });

  test("a non-logged user should return a proper error message", async () => {
    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const originalEntriesLength = userData.body.readings.length;

    const deleteResponse = await api
      .delete(`/api/readinglists/${userData.body.readings[0].id}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Get the current user data
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const currentEntriesLength = userData.body.readings.length;

    // Assert no entries have been removed
    assert.strictEqual(originalEntriesLength, currentEntriesLength);

    // Assert there is an error within the response
    assert.match(deleteResponse.body.error, /token missing/i);
  });

  test("an expired token should return a proper error message", async () => {
    // Login
    const loginResponse = await api
      .post("/api/login")
      .send({
        username: initialUsers[1].username,
        password: initialUsers[1].password,
      });

    // Get a blog to add to the user's reading list
    const blogToAdd = await api
      .get("/api/blogs/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the user to add a new entry to the reading list
    const userFromDatabase = await User.findOne({
      where: {
        username: loginResponse.body.username,
      },
    });

    // Add the blog to the user's reading list
    await api
      .post("/api/readinglists")
      .send({ userId: userFromDatabase.id, blogId: blogToAdd.body.id })
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Logout the user to expire the current auth token
    await api
      .delete("/api/logout")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200);

    // Get the original amount of entries
    let userData = await api
      .get("/api/users/2")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const originalEntriesLength = userData.body.readings.length;

    // Remove an entry from the reading list
    const deleteResponse = await api
      .delete(`/api/readinglists/${userData.body.readings[0].id}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Get the user updated reading list
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of entries
    const currentEntriesLength = userData.body.readings.length;

    // Confirm no entry has been removed
    assert.strictEqual(originalEntriesLength, currentEntriesLength);

    // Assert there is an error within the response
    assert.match(deleteResponse.body.error, /token expired/i);
  });
});
