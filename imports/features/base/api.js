import Api from "../../api";
import { ProfilesCollection } from "meteor/socialize:user-profile";
const continue100 = (body = "No Content") => {
  return {
    statusCode: 100,
    status: "success",
    body,
  };
};

export const success200 = (body = {}) => {
  return {
    statusCode: 200,
    status: "success",
    body,
  };
};

export const success201 = (body = "Created") => {
  return {
    statusCode: 201,
    status: "success",
    body,
  };
};

const success205 = (body = "No Content") => {
  return {
    statusCode: 205,
    status: "success",
    body,
  };
};

export const badRequest400 = (body = "Bad Request") => {
  return {
    statusCode: 400,
    status: "fail",
    body,
  };
};

const unauthorized401 = (body = "Unauthorized") => {
  return {
    statusCode: 401,
    status: "fail",
    body,
  };
};

const forbidden403 = (body = "Forbidden") => {
  return {
    statusCode: 403,
    status: "fail",
    body,
  };
};

export const notFound404 = (body = "Not Found") => {
  return {
    statusCode: 404,
    status: "fail",
    body,
  };
};

const notAllowed405 = (body = "Not Allowed") => {
  return {
    statusCode: 405,
    status: "fail",
    body,
  };
};

const unsupported415 = (body = "Unsupported") => {
  return {
    statusCode: 415,
    status: "fail",
    body,
  };
};

export const serverError500 = (body = "Server Error") => {
  return {
    statusCode: 500,
    status: "fail",
    body,
  };
};

const tooManyRequests429 = (body = "Too Many Requests") => {
  return {
    statusCode: 429,
    status: "fail",
    body,
  };
};

export default function Constructor(route, Model) {
  Api.addRoute(`${route}/model`, {
    get: function () {
      return {
        fields: Model.schema.fields,
        fieldsNames: Model.schema.fieldsNames,
      };
    },
  });

  Api.addRoute(route, {
    post: {
      authRequired: true,
      action: function () {
        try {
          let model = new Model({
            ...this.bodyParams,
            createdBy: this.userId,
          });
          model.save();
          return success201(model);
        } catch (e) {
          console.log(e);
          return badRequest400("Not Created");
        }
      },
    },
    get: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.find().fetch();
          return success200(model);
        } catch (e) {
          return success205("No Content");
        }
      },
    },
  });

  Api.addRoute(`${route}/:_id`, {
    get: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.findOne(this.urlParams._id || this.urlParams.id);
          if (model.createdBy) {
            const profile = ProfilesCollection.findOne({
              _id: model.createdBy,
            });
            model.createdUser = profile;
          }
          return success200(model);
        } catch (e) {
          return success205("No Content");
        }
      },
    },
    put: {
      authRequired: true,
      action: function () {
        try {
          Model.update(
            { _id: this.urlParams._id || this.urlParams.id },
            this.bodyParams
          );
          let model = Model.findOne(this.urlParams._id || this.urlParams.id);
          return success200(model);
        } catch (e) {
          return badRequest400({
            code: 400,
            message: e.message,
          });
        }
      },
    },
    patch: {
      authRequired: true,
      action: function () {
        try {
          console.log(
            "this.urlParams.id",
            this.urlParams._id || this.urlParams.id
          );
          Model.update(
            { _id: this.urlParams._id || this.urlParams.id },
            {
              $set: this.bodyParams,
            }
          );
          let model = Model.findOne(this.urlParams._id || this.urlParams.id);
          return success200(model);
        } catch (e) {
          return badRequest400({
            code: 400,
            message: e.message,
          });
        }
      },
    },
    delete: {
      authRequired: true,
      action: function () {
        try {
          let model = Model.findOne(this.urlParams._id || this.urlParams.id);
          model.remove();
          return success200(model);
        } catch (e) {
          return badRequest400({
            code: 400,
            message: e.message,
          });
        }
      },
    },
  });

  Api.addRoute(`${route}/pagination`, {
    post: {
      authRequired: true,
      action: function () {
        try {
          const result = {
            data: Model.find(
              this.bodyParams.selector || {},
              this.bodyParams.options
            ).fetch(),
            total: Model.find(this.bodyParams.selector || {}).count(),
          };
          return success200(result);
        } catch (e) {
          return serverError500(e.message);
        }
      },
    },
  });
}
