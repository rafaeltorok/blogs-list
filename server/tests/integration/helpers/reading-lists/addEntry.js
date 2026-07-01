export default async function addEntry(api, entry, token, statusCode) {
  const newEntryResponse = await api
    .post("/api/readinglists")
    .send(entry)
    .set("Authorization", `Bearer ${token}`)
    .expect(statusCode)
    .expect("Content-Type", /application\/json/);

  return newEntryResponse;
}
