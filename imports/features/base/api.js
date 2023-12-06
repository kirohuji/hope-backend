import Api from "../../api";
const continue100 = (body = 'No Content') => {
  return {
    statusCode: 100,
    status: 'success',
    body
  }
};

const success200 = (body = {}) => {
  return {
    statusCode: 200,
    status: 'success',
    body
  };
};

const success201 = (body = 'Created') => {
  return {
    statusCode: 201,
    status: 'success',
    body
  }
};

const success205 = (body = 'No Content') => {
  return {
    statusCode: 205,
    status: 'success',
    body
  }
};

const badRequest400 = (body = 'Bad Request') => {
  return {
    statusCode: 400,
    status: 'fail',
    body
  };
};

const unauthorized401 = (body = 'Unauthorized') => {
  return {
    statusCode: 401,
    status: 'fail',
    body
  }
};

const forbidden403 = (body = 'Forbidden') => {
  return {
    statusCode: 403,
    status: 'fail',
    body
  }
};

const notFound404 = (body = 'Not Found') => {
  return {
    statusCode: 404,
    status: 'fail',
    body
  };
};

const notAllowed405 = (body = 'Not Allowed') => {
  return {
    statusCode: 405,
    status: 'fail',
    body
  };
};

const unsupported415 = (body = 'Unsupported') => {
  return {
    statusCode: 415,
    status: 'fail',
    body
  };
};

export const serverError500 = (body = 'Server Error') => {
  return {
    statusCode: 500,
    status: 'fail',
    body
  };
};

const tooManyRequests429 = (body = 'Too Many Requests') => {
  return {
    statusCode: 429,
    status: 'fail',
    body
  };
};

export default function Constructor (route, Model) {
  Api.addRoute(route, {
    post: {
      authRequired: true,
      action: function () {
        try {
          let model = new Model({
            ...this.bodyParams,
            createdBy: this.userId
          })
          model.save();
          return success201(model);
        } catch (e) {
          console.log(e)
          return badRequest400('Not Created');
        }
      }
    },
    get: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.find().fetch()
          return success200(model);
        } catch (e) {
          return success205('No Content');
        }
      }
    }
  });
  Api.addRoute(`${route}/:_id`, {
    get: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.findOne(this.urlParams.id)
          return success200(model);
        } catch (e) {
          return success205('No Content');
        }
      }
    },
    put: {
      authRequired: true,
      action: function () {
        try {
          Model.update({ _id: this.urlParams.id },  this.bodyParams);
          let model = Model.findOne(this.urlParams.id)
          return success200(model);
        } catch (e) {
          return badRequest400('Not Updated');
        }
      }
    },
    patch: {
      authRequired: true,
      action: function () {
        try {
          Model.update({ _id: this.urlParams.id },  {
            $set: this.bodyParams
          });
          let model = Model.findOne(this.urlParams.id)
          return success200(model);
        } catch (e) {
          return badRequest400('Not Updated');
        }
      }
    },
    delete: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.findOne(this.urlParams.id)
          model.remove()
          return success200(model);
        } catch (e) {
          return badRequest400('Not Updated');
        }
      }
    },
  });


}