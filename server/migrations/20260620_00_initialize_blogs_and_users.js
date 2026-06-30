import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Invalid email address",
        },
        len: {
          args: [5, 32],
          msg: "The username must be between 5 and 32 chars long",
        },
        notNull: {
          msg: "Username is required",
        },
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The user's name must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Name is required",
        },
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.createTable("blogs", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The title must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Title is required",
        },
      },
    },
    author: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: "The author's name must be between 3 and 32 chars long",
        },
        notNull: {
          msg: "Author is required",
        },
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: {
          msg: "Invalid URL format",
        },
        notNull: {
          msg: "URL is required",
        },
      },
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: "The likes counter must be a valid number",
        },
        min: {
          args: [0],
          msg: "The likes counter must be a positive number",
        },
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("blogs");
  await queryInterface.dropTable("users");
}
