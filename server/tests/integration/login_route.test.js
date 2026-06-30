/* eslint-disable no-unused-vars */

// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "./setup.js";

// Blogs List app
import app from "../../src/app.js";

// Models
import Blog from "../../src/models/blog.js";
import User from "../../src/models/user.js";
import initialBlogs from "../data/initialBlogs.js";
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
describe("the Login route", () => {
  beforeEach(async () => {
    const newUser = initialUsers[0];

    // Reset the users list before each test
    await User.truncate({ restartIdentity: true, cascade: true });

    // Create a new user for testing
    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);
  });

  test("a user can successfully login", async () => {
    const { username, password } = initialUsers[0];

    // Login with the correct credentials
    const response = await api
      .post("/api/login")
      .send({ username: username, password: password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert a token is returned within the response
    assert.ok("token" in response.body);

    // Assert both the username and name are returned within the response
    assert.ok("username" in response.body);
    assert.ok("name" in response.body);
  });

  test("the user's password is not returned within the login response", async () => {
    const { username, password } = initialUsers[0];

    // Login
    const response = await api
      .post("/api/login")
      .send({ username: username, password: password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    // Assert the password field is not present within the response
    assert.ok(!("passwordHash" in response.body));
  });

  test("missing the username should return a proper error message", async () => {
    const { username, password } = initialUsers[0];

    // Login
    const response = await api
      .post("/api/login")
      .send({ password: password })
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.strictEqual(response.body.error, "Missing credentials");

    // Assert the token is not present within the response
    assert.ok(!("token" in response.body));
  });

  test("missing the password should return a proper error message", async () => {
    const { username, password } = initialUsers[0];

    // Login
    const response = await api
      .post("/api/login")
      .send({ username: username })
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.strictEqual(response.body.error, "Missing credentials");

    // Assert the token is not present within the response
    assert.ok(!("token" in response.body));
  });

  test("an invalid password should return a proper error message", async () => {
    const invalidCredentials = {
      ...initialUsers[0],
      password: "wrong_password",
    };

    // Login
    const response = await api
      .post("/api/login")
      .send({
        username: invalidCredentials.username,
        password: invalidCredentials.password,
      })
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert the error message is within the response
    assert.strictEqual(response.body.error, "Invalid username or password");
  });

  test("a non-existing user should return a proper error message", async () => {
    // Login
    const response = await api
      .post("/api/login")
      .send({ username: "non_existing_user", password: "password" })
      .expect(401)
      .expect("Content-Type", /application\/json/);

    // Assert the error message is within the response
    assert.strictEqual(response.body.error, "Invalid username or password");
  });

  test("a disabled user should not be allowed to login", async () => {
    // Get a user to be disabled
    const disabledUser = await User.findOne({
      where: {
        username: initialUsers[0].username,
      },
    });

    // Store the updated user on the database
    disabledUser.disabled = true;
    await disabledUser.save();

    // Login
    const loginResponse = await api
      .post("/api/login")
      .send({
        username: initialUsers[0].username,
        password: initialUsers[0].password,
      })
      .expect(403)
      .expect("Content-Type", /application\/json/);

    // Assert the error message is within the response
    assert.strictEqual(
      loginResponse.body.error,
      "Your account has been disabled, please contact an admin",
    );
  });
});
