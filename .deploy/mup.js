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
      "/avatars": "/avatars/",
      "/storage": "/storage/",
      "/etc/hosts": "/etc/hosts",
      "/etc/resolve.conf": "/etc/resolve.conf",
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
      // bind: "127.0.0.1",
      args: [
        // "-v /etc/hosts:/etc/hosts",
        // linking example
        "--add-host='github.com:140.82.113.4'",
        // "--dns 8.8.8.8",
        // "--build-arg 'HTTP_PROXY=http://172.17.0.1:1087'",
        // "--build-arg 'HTTPS_PROXY=http://172.17.0.1:1087'",
      ],
      buildInstructions: [
        // "USER root",
        // "RUN echo '140.82.113.4 github.com' >> /etc/hosts ",
        // "USER app",
        // "RUN cat /etc/hosts",
        // "RUN npm config set registry http://registry.npmjs.org/",
        // "RUN npm cache clean --force",
        // "RUN yum install git ",
        // "RUN git config --global url.'https://hub.fastgit.org/'.insteadOf 'https://github.com/'",
        // "RUN export ALL_PROXY='socks5://124.221.67.248:1080'",
        // "RUN npm config set proxy http://127.0.0.1:1087",
        // "RUN npm config set https-proxy http://127.0.0.1:1087",
        // "RUN npm config set strict-ssl false",
        // "RUN npm install -g https://github.com/meteor/node-source-map-support/tarball/1912478769d76e5df4c365e147f25896aee6375e",
        // "RUN npm install -g node-gyp",
        // "RUN ping github.com",
        // "RUN cd /built_app/programs/server",
        // "RUN npm config set disturl https://npm.taobao.org/dist",
        // "RUN npm install yarn -g ",
        // "RUN npm config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs/",
        "RUN npm config set registry https://registry.npmmirror.com",
        // "RUN npm config set disturl https://npm.taobao.org/dist ",
        // "RUN npm config set timeout 60000",
        // "RUN npm install -g source-map-support",
        // "RUN npm install -g https://github.com/meteor/node-source-map-support/tarball/1912478769d76e5df4c365e147f25896aee6375e",
        // "RUN yarn",
        // "RUN npm cache clean --force",
        // "RUN npm config set registry https://registry.npmjs.org/",
        // "RUN npm config set disturl https://npm.taobao.org/mirrors/node/",
        // 'USER root',
        // "RUN curl -o- https://ghproxy.com/https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash",
        // "RUN nvm | bash",
        // // 'USER app'
        // 'USER root',
        // 'RUN apt-get update && apt-get install -y imagemagick graphicsmagick',
        // 'USER app'
      ],
    },
    enableUploadProgressBar: true,
  },
};
