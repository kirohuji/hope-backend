module.exports = {
  servers: {
    one: {
      host: "124.221.67.248",
      username: "root",
      password: "Zyd1362848650",
    },
  },
  proxy: {
    servers: {
      one: {},
    },
    nginxServerConfig: "./server.conf",
    shared: {
      httpPort: 80,
      httpsPort: 443,
      nginxConfig: "./nginx.conf",
      env: {
        DEFAULT_HOST: "www.lourd.top",
        LETSENCRYPT_HOST: "www.lourd.top",
        LETSENCRYPT_EMAIL: "z1309014381@gmail.com",
      },
    },
    domains: "www.lourd.top",
    ssl: {
      forceSSL: true,
      letsEncryptEmail: "z1309014381@gmail.com",
    },
  },
  app: {
    volumes: {
      "/avatars": "/avatars",
      "/storage": "/storage/",
    },
    name: "hope-backend",
    path: "../",
    servers: {
      one: {
        env: {
          PORT: 80,
        },
      },
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: "https://www.lourd.top",
      MONGO_URL: "mongodb://meteor:meteor@124.221.67.248:27017/meteor",
    },
    docker: {
      image: "zodern/meteor:root",
      useBuildKit: true,
      prepareBundle: true,
      buildInstructions: [
        "RUN npm config set registry https://registry.npm.taobao.org",
        // "RUN npm config set disturl https://npm.taobao.org/mirrors/node/",
        // "RUN npm config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs/",
        // // 'USER root',
        // 'RUN curl -o- https://ghproxy.com/https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash',
        // 'RUN nvm | bash',
        // // 'USER app'
        // 'USER root',
        // 'RUN apt-get update && apt-get install -y imagemagick graphicsmagick',
        // 'USER app'
      ],
    },
    enableUploadProgressBar: true,
  },
};
