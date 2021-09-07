const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    //console.log(token);
    const payload = jwt.verify(token, process.env.JWT);
    // console.log(payload);
    const user = await User.findByPk(payload.id);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.beforeCreate(async (user) => {
  const hashed = await bcrypt.hash(user.password, 5);
  user.password = hashed;
})

User.authenticate = async ({ username, password }) => {
  const hashed = await bcrypt.hash(password, 5);
  const correct = bcrypt.compare(password, hashed);
  console.log(password);
  const user = await User.findOne({
    where: {
      username,
      //password,
    },
  });
  
  if (correct) {
    const token = jwt.sign({ id: user.id }, process.env.JWT);

    return token;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};


const syncAndSeed = async () => {
  await conn.sync({ force: true });
  let hashed = await bcrypt.hash('password', 5);
  console.log(hashed);
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
