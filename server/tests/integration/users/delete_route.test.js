// Test dependencies
import { test, beforeEach, describe, before, after } from "node:test";
import assert from "node:assert";
import supertest from "supertest";
import { setupDb, dbCleanup } from "../setup.js";

// Blogs List app
import app from "../../../src/app.js";

// Models
import User from "../../../src/models/user.js";
import initialUsers from "../../data/initialUsers.js";

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
describe("the Users DELETE route", () => {
  beforeEach(async () => {
    // Remove all users before each test
    await User.truncate({ restartIdentity: true, cascade: true });
  });

  test("a user can be removed", async () => {
    const user = initialUsers[0];

    // Store the initial users length
    const initialAmount = await getAmount("users");

    // Add a user to be removed
    const postResponse = await api
      .post("/api/users")
      .send(user)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    // Confirm the users length has increased
    let currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount + 1, currentAmount);

    // Remove the user
    await api.delete(`/api/users/${Number(postResponse.body.id)}`).expect(204);

    // Assert the users length has decreased
    currentAmount = await getAmount("users");
    assert.strictEqual(initialAmount, currentAmount);
  });

  test("a non-existing id should return a proper status code", async () => {
    await api.delete("/api/users/0").expect(404);
  });

  test("an invalid ID format should return a proper error message", async () => {
    const response = await api
      .delete("/api/users/newuser")
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(response.body.error.includes("Invalid ID format"));
  });

  test("a negative ID should return a proper error message", async () => {
    const response = await api
      .delete("/api/users/-1")
      .expect(400)
      .expect("Content-Type", /application\/json/);

    // Assert an error message is within the response
    assert.ok(response.body.error.includes("Invalid ID format"));
  });
});
