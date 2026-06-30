import { useState } from "react";

export default function AddBlogForm({ addBlog }) {
  const [newBlog, setNewBlog] = useState({
    title: "",
    author: "",
    url: "",
    year: 1991,
  });

  const createBlog = async (event) => {
    event.preventDefault();
    const result = await addBlog({
      ...newBlog,
    });

    if (result) {
      setNewBlog({ title: "", author: "", url: "", year: 1991 });
    }
  };

  return (
    <div className="container">
      <form onSubmit={createBlog}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
          ></input>
        </div>
        <div>
          <label htmlFor="author">Author</label>
          <input
            id="author"
            type="text"
            value={newBlog.author}
            onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
          ></input>
        </div>
        <div>
          <label htmlFor="url">URL</label>
          <input
            id="url"
            type="text"
            value={newBlog.url}
            onChange={(e) => setNewBlog({ ...newBlog, url: e.target.value })}
          ></input>
        </div>
        <div>
          <label htmlFor="year">Year</label>
          <input
            id="year"
            type="number"
            value={newBlog.year}
            onChange={(e) =>
              setNewBlog({ ...newBlog, year: Number(e.target.value) })
            }
          ></input>
        </div>
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}
