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

// Helper functions
async function getAmount(route) {
  const getResponse = await api.get(`/api/${route}`);
  return getResponse.body.length;
}

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
describe("the Users POST route", () => {
  beforeEach(async () => {
    // Remove all users before each test
    await User.truncate({ restartIdentity: true, cascade: true });
  });

  test("a new user can be added", async () => {
    const user = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Remove the password from the original object
    const { password, ...otherFields } = user;

    // Select only the necessary fields from the POST response
    const { username, name, ...postFields } = response.body;

    // Assert the object data is correct
    assert.deepStrictEqual(otherFields, { username, name });

    // Get the current amount of objects
    const currentAmount = await getAmount("users");

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);
  });

  test("a newly created user should have no blogs", async () => {
    const user = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("users");

    // Get the newly created user data
    const getResponse = await api
      .get(`/api/users/${response.body.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Assert the user has no blogs
    assert(getResponse.body.blogs, []);
  });

  test("a newly created user should contain both timestamps fields", async () => {
    const user = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the current amount of objects
    const currentAmount = await getAmount("users");

    // Assert the number of objects has increased
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Assert both fields are present inside the returned object
    assert.ok("createdAt" in response.body);
    assert.ok("updatedAt" in response.body);
  });

  test("missing the username field should return a proper error message", async () => {
    // Remove the username field
    const { username, ...otherFields } = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create the user
    const response = await api
      .post("/api/users")
      .send(otherFields)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the response error message
    assert.ok(response.body.error.includes("Username is required"));

    // Assert the number of objects has not changed
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("missing the name field should return a proper error message", async () => {
    // Remove the name field
    const { name, ...otherFields } = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create the user
    const response = await api
      .post("/api/users")
      .send(otherFields)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the response error message
    assert.ok(response.body.error.includes("Name is required"));

    // Assert the number of objects has not changed
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("missing the password field should return a proper error message", async () => {
    // Remove the password field
    const { password, ...otherFields } = initialUsers[0];

    // Get the initial amount of objects
    const initialAmount = await getAmount("users");

    // Create the user
    const response = await api
      .post("/api/users")
      .send(otherFields)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert the response error message
    assert.ok(response.body.error.includes("Password is required"));

    // Assert the number of objects has not changed
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("an already existing username should return a proper error message", async () => {
    const newUser = initialUsers[0];

    // Create a new user
    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Try to add an already existing username
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.match(response.body.error, /username must be unique/i);

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the username must be a valid email address", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      username: "admin@admin",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(response.body.error.includes("Invalid email address"));

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the username cannot be below the min value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      username: "a",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "The username must be between 5 and 32 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the username cannot exceed the max value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      username: "a_very_long_email_address@very_long_email_provider_name.com",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "The username must be between 5 and 32 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the name cannot be below the min value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      name: "a",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "The user's name must be between 3 and 32 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the name cannot exceed the max value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      name: "A very long user name to exceed the maximum permitted character length",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "The user's name must be between 3 and 32 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the password cannot be below the min value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      password: "a",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "Password length must be between 5 and 64 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("the password cannot exceed the max value length", async () => {
    // Get the initial users length
    const initialAmount = await getAmount("users");

    // Generate invalid data
    const newUser = {
      ...initialUsers[0],
      password:
        "abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123",
    };

    // Create a new user
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(
      response.body.error.includes(
        "Password length must be between 5 and 64 chars long",
      ),
    );

    // Assert a new user has not been added
    const currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });
});
