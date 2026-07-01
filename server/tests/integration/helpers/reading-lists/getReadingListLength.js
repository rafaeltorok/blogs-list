export default async function getReadingListLength(api, userId) {
  let userData = await api
    .get(`/api/users/${userId}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  return userData.body.readings.length;
}
