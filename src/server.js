import express from "express";
import cluster from "node:cluster";
import "dotenv/config";
import "./config/db.js";
import "./config/redis.js";
import User from "./models/User.model.js";
// import os from "node:os";
// import morgan from "morgan";
import redis from "./config/redis.js";
import compression from "compression";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use(compression());

// if (process.env.NODE_ENV == "development") {
//   app.use(morgan("dev"));
// }

app.get("/", (req, res) => {
  return res.status(200).json({
    "Server Name": process.env.serverName,
    PORT,
  });
});

app.get("/users", async (req, res) => {
  try {
    const cache = await redis.get("users");
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const data = JSON.parse(cache || "[]");
    const paginationOfCache = data.slice(skip, skip + limit - 1);

    if (cache) {
      return res.status(200).json({
        message: "Cache Data!",
        users: paginationOfCache,
      });
    }

    const users = await User.find().skip(skip).limit(limit).lean();

    await redis.set("users", JSON.stringify(users));

    return res.status(200).json({
      message: "MongoDB Data!",
      users,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: `Failed to fetch users: ${error.message}`,
    });
  }
});

// if (cluster.isPrimary) {
//   const cpuCount = 2;
//   //   const cpuCount = os.availableParallelism();
//   console.log(cpuCount);

//   //   console.log(`Primary PID: ${process.pid}`);
//   //   console.log(`Starting ${cpuCount} workers...`);

//   for (let i = 0; i < cpuCount; i++) {
//     cluster.fork();
//   }
// } else {
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
// }
