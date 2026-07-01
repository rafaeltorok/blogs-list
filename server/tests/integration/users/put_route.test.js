/* eslint-disable no-unused-vars */

// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import User from "../../../src/models/user.js";

// Test data
import initialUsers from "../data/initialUsers.js";

const api = supertest(app);

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
describe("the Users PUT route", () => {
  beforeEach(async () => {
    // Remove all users before each test
    await User.truncate({ restartIdentity: true, cascade: true });

    // Create a new user to be updated
    const userData = initialUsers[0];

    await api
      .post("/api/users")
      .send(userData)
      .expect(201)
      .expect("Content-Type", /application\/json/);
  });

  test("a user's name can be updated", async () => {
    const newName = "New name";

    // Get a user to be updated
    const getResponse = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${getResponse.body.username}`)
      .send({ name: newName })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Confirm the name has been updated
    assert.strictEqual(putResponse.body.name, newName);
    assert.notStrictEqual(putResponse.body.name, getResponse.body.name);
  });

  test("only the name field should be updated when there are other parameters", async () => {
    const updateData = {
      username: "newusername@example.com",
      name: "New name",
      password: "newpassword",
    };

    // Get a user to be updated
    const getResponse = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${getResponse.body.username}`)
      .send(updateData)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Select only the necessary fields from the GET response
    const { id, username, createdAt, admin, disabled, ...otherFields } =
      getResponse.body;

    // Confirm only the name has been updated
    assert.deepStrictEqual(
      {
        id: putResponse.body.id,
        username: putResponse.body.username,
        name: putResponse.body.name,
        createdAt: putResponse.body.createdAt,
        updatedAt: putResponse.body.updatedAt,
        admin: putResponse.body.admin,
        disabled: putResponse.body.disabled,
      },
      {
        id,
        username,
        createdAt,
        name: updateData.name,
        updatedAt: putResponse.body.updatedAt,
        admin,
        disabled,
      },
    );
    assert.notStrictEqual(putResponse.body.name, getResponse.body.name);
  });

  test("the updateAt field should be updated after a successful request", async () => {
    const newName = "New name";

    // Get a user to be updated
    const getResponse = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${getResponse.body.username}`)
      .send({ name: newName })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Select only the necessary fields from the GET response
    const { id, username, createdAt, admin, disabled, ...otherFields } =
      getResponse.body;

    // Confirm the updateAt field has been updated
    assert.deepStrictEqual(
      {
        id: putResponse.body.id,
        username: putResponse.body.username,
        name: putResponse.body.name,
        createdAt: putResponse.body.createdAt,
        updatedAt: putResponse.body.updatedAt,
        admin: putResponse.body.admin,
        disabled: putResponse.body.disabled,
      },
      {
        id,
        username,
        createdAt,
        name: newName,
        updatedAt: putResponse.body.updatedAt,
        admin,
        disabled,
      },
    );
    assert.notStrictEqual(
      putResponse.body.updatedAt,
      getResponse.body.updatedAt,
    );
  });

  test("the createdAt field should not be updated", async () => {
    const newName = "New name";

    // Get a user to be updated
    const getResponse = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${getResponse.body.username}`)
      .send({ name: newName })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Confirm the createAt field has not changed
    assert.strictEqual(putResponse.body.createdAt, getResponse.body.createdAt);
  });

  test("an empty name should return a proper error message", async () => {
    const newName = "";

    // Get a user to be updated
    const originalUserData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${originalUserData.body.username}`)
      .send({ name: newName })
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Confirm the error message is within the response
    assert.strictEqual(putResponse.body.error, "Invalid user's name");

    const currentUserData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the original name has not been changed
    assert.strictEqual(originalUserData.body.name, currentUserData.body.name);

    // Assert the updatedAt field has not changed
    assert.strictEqual(
      originalUserData.body.updatedAt,
      currentUserData.body.updatedAt,
    );
  });

  test("an undefined parameter should return a proper error message", async () => {
    // Get a user to be updated
    const originalUserData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Update a user
    const putResponse = await api
      .put(`/api/users/${originalUserData.body.username}`)
      .send({})
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Confirm the error message is within the response
    assert.strictEqual(putResponse.body.error, "Invalid user's name");

    const currentUserData = await api
      .get("/api/users/1")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the original name has not been changed
    assert.strictEqual(originalUserData.body.name, currentUserData.body.name);

    // Assert the updatedAt field has not changed
    assert.strictEqual(
      originalUserData.body.updatedAt,
      currentUserData.body.updatedAt,
    );
  });
});
