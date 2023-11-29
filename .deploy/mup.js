module.exports = {
  servers: {
    one: {
      // TODO: set host address, username, and authentication method
      host: '85.31.235.82',
      username: 'root',
      // pem: './path/to/pem'
      password: 'Zyd1362848650#'
      // or neither for authenticate from ssh-agent
    }
  },
  // proxy: {
  //   domains: 'lourd.top',
  //   ssl: {
  //     forceSSL: true,
  //     // Enable let's encrypt to create free certificates.
  //     // The email is used by Let's Encrypt to notify you when the
  //     // certificates are close to expiring.
  //     letsEncryptEmail: 'z1309014381@gmail.com'
  //   }
  // },
  app: {
    // TODO: change app name and path
    name: 'hope-backend',
    path: '../',

    servers: {
      one: {
        env: {
          PORT: 5000
        }
      },
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      // TODO: Change to your app's url
      // If you are using ssl, it needs to start with https://
      ROOT_URL: 'http://124.221.67.248:5000',
      MONGO_URL: 'mongodb://meteor:meteor@124.221.67.248:27017/meteor',
      // MONGO_URL: 'mongodb://mongodb/meteor',
      // MONGO_OPLOG_URL: 'mongodb://mongodb/local',
    },

    docker: {
      image: 'zodern/meteor:root',
      useBuildKit: true,
      prepareBundle: true,
      buildInstructions: [
        // 'RUN npm config set registry https://registry.npm.taobao.org',
        // 'RUN npm config set disturl https://npm.taobao.org/mirrors/node/',
        // 'RUN npm config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs/',
        // // 'USER root',
        // 'RUN curl -o- https://ghproxy.com/https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash',
        // 'RUN nvm | bash',
        // // 'USER app'
        // 'USER root',
        // 'RUN apt-get update && apt-get install -y imagemagick graphicsmagick',
        // 'USER app'
      ],
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    // enableUploadProgressBar: true
  },
  // mongo: {
  //   version: '4.4.12',
  //   servers: {
  //     one: {}
  //   }
  // }
  // (Optional)
  // Use the proxy to setup ssl or to route requests to the correct
  // app when there are several apps

  // proxy: {
  //   domains: 'mywebsite.com,www.mywebsite.com',

  //   ssl: {
  //     // Enable Let's Encrypt
  //     letsEncryptEmail: 'email@domain.com'
  //   }
  // }
};
