require("dotenv").config();

const PORT = Number(process.env.PORT || 3000);
const EVAL_ACCESS_TOKEN = process.env.EVAL_ACCESS_TOKEN || "";

module.exports = {
  PORT,
  EVAL_ACCESS_TOKEN,
};
