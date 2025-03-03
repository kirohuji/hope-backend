import Model, { BpmnCollection } from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import {
  execute,
  getState,
  resumeProcess,
  continueInstance,
  pagination,
  deletePersistentEntry,
  deleteAll,
  getPending,
} from "./service";
import _ from "lodash";

Api.addCollection(BpmnCollection);

Constructor("bpmns", Model);

Api.addRoute("bpmns/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/execute", {
  post: function () {
    try {
      return execute.call(this, {
        ...this.bodyParams,
        userId: this.userId,
        Api,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/getState/:instanceId", {
  get: function () {
    try {
      return getState({
        instanceId: this.urlParams.instanceId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/resumeProcess/:instanceId", {
  get: function () {
    try {
      return resumeProcess({
        instanceId: this.urlParams.instanceId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/stopInstance/:instanceId", {
  get: function () {
    try {
      return resumeProcess({
        instanceId: this.urlParams.instanceId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/deletePersistentEntry/:instanceId", {
  get: function () {
    try {
      return deletePersistentEntry({
        instanceId: this.urlParams.instanceId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/getPending/:instanceId", {
  get: function () {
    try {
      return getPending({
        instanceId: this.urlParams.instanceId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/continueInstance", {
  post: function () {
    try {
      return continueInstance(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("bpmns/deleteAll", {
  get: function () {
    try {
      return deleteAll();
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
