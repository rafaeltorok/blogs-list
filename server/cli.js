import { QueryTypes } from "sequelize";
import sequelize from "./src/utils/connectdb.js";

function printInfo(blogs) {
  for (const blog of blogs) {
    console.log(`${blog.author}: '${blog.title}', ${blog.likes} like(s)`);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    const blogs = await sequelize.query("SELECT * FROM blogs", {
      type: QueryTypes.SELECT,
    });
    printInfo(blogs);
    sequelize.close();
  } catch (err) {
    console.error(err);
  }
}

main();
