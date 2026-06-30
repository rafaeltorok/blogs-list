CREATE TABLE blogs(
	id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT,
	url TEXT NOT NULL,
	likes INTEGER DEFAULT 0
);

INSERT INTO blogs(title,author,url) VALUES('My first blog','Myself','https://example.com');
INSERT INTO blogs(title,author,url,likes) VALUES('The Gamer''s Den','The Gamer','https://gamersden.com',9001);