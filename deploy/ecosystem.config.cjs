module.exports = {
  apps: [
    {
      name: "yonyou-red",
      script: "dist/server.cjs",
      cwd: __dirname + "/..",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        BASE_PATH: "/Yonyou_red",
      },
    },
  ],
};
