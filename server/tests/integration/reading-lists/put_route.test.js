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
describe("the Reading Lists PUT route", () => {
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

  test("the read status can be updated", async () => {
    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the original read status from the entry
    const originalStatus = userData.body.readings[0].reading_list.read;

    // Update the read status
    await api
      .put(`/api/readinglists/${userData.body.readings[0].id}`)
      .send({ read: true })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);


    // Get the updated reading list entry
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const updatedStatus = userData.body.readings[0].reading_list.read;

    // Confirm the read status has been updated
    assert.notStrictEqual(originalStatus, updatedStatus);
  });

  test("only the read status should be updated when sending extra fields", async () => {
    const updateData = {
      title: "New Blog title",
      author: "New author name",
      url: "http://newurl.com",
      year: 1991,
      likes: 1000,
      read: true
    };

    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Store the original entry
    const originalEntry = userData.body.readings[0];

    // Update the read status
    await api
      .put(`/api/readinglists/${userData.body.readings[0].id}`)
      .send(updateData)
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the updated reading list entry
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the current entry
    const currentEntry = userData.body.readings[0];

    // Confirm only the read status has been updated
    assert.deepStrictEqual(currentEntry, {
      ...originalEntry,
      reading_list: {
        ...originalEntry.reading_list,
        read: true
      },
    });
    assert.notStrictEqual(originalEntry.reading_list.read, currentEntry.reading_list.read);
  });

  test("a user should not be able to modify another user's read status", async () => {
    // Get the user to add a new entry to the reading list
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Store the original entry
    const originalEntry = userData.body.readings[0];

    // Login as another user
    const loginResponse = await api
      .post("/api/login")
      .send({ username: initialUsers[1].username, password: initialUsers[1].password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update the read status
    const updateResponse = await api
      .put(`/api/readinglists/${userData.body.readings[0].id}`)
      .send({ read: true })
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Get the updated reading list entry
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Get the current entry
    const currentEntry = userData.body.readings[0];

    // Confirm the read status has not changed
    assert.deepStrictEqual(originalEntry, currentEntry);

    // Assert there is an error within the response
    assert.match(updateResponse.body.error, /you cannot modify another user's reading list/i);
  });

  test("a non-existing entry should return a proper status code", async () => {
    // Assert the correct status code is returned
    await api
      .post("/api/readinglists/0")
      .send({ read: true })
      .set("Authorization", `Bearer ${loggedUser.token}`)
      .expect(404);
  });

  test("an expired token should return a proper error message", async () => {
    let userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const originalStatus = userData.body.readings[0].reading_list.read;

    // Login
    const loginResponse = await api
      .post("/api/login")
      .send({
        username: initialUsers[0].username,
        password: initialUsers[0].password,
      });

    // Logout the user to expire the current auth token
    await api
      .delete("/api/logout")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200);

    // Update the read status
    const updateResponse = await api
      .put(`/api/readinglists/${userData.body.readings[0].id}`)
      .send({ read: true })
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Get the current status
    userData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const currentStatus = userData.body.readings[0].reading_list.read;

    // Assert the read status has not changed
    assert.strictEqual(originalStatus, currentStatus);

    // Assert there is an error within the response
    assert.match(updateResponse.body.error, /token expired/i);
  });
});
