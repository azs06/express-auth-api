import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize";
import bcrypt from "bcryptjs";
import { Role } from "./Role";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_id: {
    type: DataTypes.INTEGER,
    references: { model: "Roles", key: "id" }
  }
});

// Hash password before saving
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

User.belongsTo(Role, { foreignKey: "role_id" });

module.exports = User;