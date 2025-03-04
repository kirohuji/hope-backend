import { BpmnCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { ServiceContext } from "./engine/serviceContext";
import _ from "lodash";
import Bpmn from "./engine/engine";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda.json";
const { EventEmitter } = require("events");

// 分页查询数据
export function pagination(bodyParams) {
  if (bodyParams.selector && bodyParams.selector.status == "all") {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["status"]));
  }
  if (bodyParams.selector && bodyParams.selector.category.length === 0) {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["category"]));
  } else if (bodyParams.selector && bodyParams.selector.category.length > 0) {
    bodyParams.selector = {
      ..._.pickBy(bodyParams.selector),
      category: {
        $in: bodyParams.selector.category,
      },
    };
  }
  let curror = BpmnCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, "createdBy");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.createdBy]; // 使用字典查找用户信息
    return {
      ...item,
      createdUser: user && user.realName, // 假设你要显示用户的 name
    };
  });
  return {
    data: enhancedData,
    total: curror.count(),
  };
}

function ServiceExpressionFn(activity) {
  const { type: atype, behaviour, environment } = activity;
  const { extensionElements } = behaviour;
  const inputParameters = extensionElements.values[0]?.inputParameters || [];
  const expression = behaviour.expression;

  const type = `${atype}:expression`;

  return {
    type,
    expression,
    execute,
  };

  function execute(executionMessage, callback) {
    // console.log("ServiceTask Inputs:", executionMessage);
    const serviceFn = environment.resolveExpression(
      expression,
      executionMessage
    );
    const parameters = inputParameters.reduce((acc, param) => {
      acc[param.name] = param.value;
      return acc;
    }, {});
    const mergedExecutionMessage = { ...executionMessage, parameters };
    serviceFn.call(activity, mergedExecutionMessage, (err, result) => {
      callback(err, result);
    });
  }
}

export function execute({ source, variables, userId, Api }) {
  const engine = new Bpmn.Engine(
    {
      source,
      moddleOptions: {
        camunda: camundaModdle,
      },
      services: {
        rest(scope, callback) {
          const route = _.find(Api._routes, ["path", "bpmns/pagination"]);
          // this.bodyParams = {
          //   selector: {
          //     scope: "KtTLuJQbpe3ixKfLq",
          //     category: [],
          //     status: "all",
          //   },
          //   options: {
          //     skip: 0,
          //     limit: 10,
          //   },
          // };
          // const result = route.endpoints.post.action.call(this);
          // console.log("result", result);
          callback(null, result);
        },
      },
      extensions: {
        camundaServiceTask(activity) {
          if (activity.behaviour.expression) {
            activity.behaviour.Service = ServiceExpressionFn;
          }
          if (activity.behaviour.resultVariable) {
            activity.on("end", (api) => {
              activity.environment.output[activity.behaviour.resultVariable] =
                api.content.output;
            });
          }
        },
      },
    },
    (err) => {
      console.log("EngineErr", err);
    }
  );

  const listener = new EventEmitter();

  listener.on("error", (err, displayErr) => {
    console.error(err);
  });
  engine.on("error", (err, displayErr) => {
    console.error(err);
  });
  engine.execute(
    {
      userId: userId,
      listener,
      variables: Object.assign(
        {},
        {
          startedBy: userId,
        },
        variables
      ),
    },
    (err, execution) => {
      console.log(execution.environment.output);
    }
  );
  return true;
}

export function getState({ instanceId }) {
  if (!Bpmn.instances.has(instanceId)) {
    throw new Error("no instance");
  }
  const instance = Bpmn.instances.get(instanceId);
  return JSON.stringify(instance.getState(), null, 2);
}

export function resumeProcess({ instanceId }) {
  const processInstanceDoc = Bpmn.persistence.collection.findOne({
    instanceId,
  });
  const persistenceDoc = Bpmn.persistence.load(processInstanceDoc._id);

  console.log(persistenceDoc.state);

  Bpmn.Engine.resume(persistenceDoc.state, {
    instanceId: persistenceDoc.instanceId,
    persistenceId: persistenceDoc.persistenceId,
  });
}

export function stopInstance({ instanceId }) {
  const instance = Bpmn.instances.get(instanceId);
  instance.stop();
  console.log(
    instanceId,
    Bpmn.instances.collection.findOne({ instanceId }),
    !!Bpmn.instances.get(instanceId)
  );
}

export function continueInstance({ instanceId, elementId }) {
  if (!Bpmn.instances.has(instanceId)) {
    throw new Error("no instance");
  }
  const instance = Bpmn.instances.get(instanceId);
  return instance.signal(elementId);
}

export function deletePersistentEntry({ instanceId }) {
  const instance = Bpmn.instances.get(instanceId);
  if (instance) instance.stop();
  Bpmn.processes.collection.remove({ instanceId });
  Bpmn.persistence.collection.remove({ instanceId });
  Bpmn.history.collection.remove({ instanceId });
}

export function deleteAll({ instanceId }) {
  Bpmn.instances.clear();
  Bpmn.processes.collection.remove({});
  Bpmn.persistence.collection.remove({});
  Bpmn.history.collection.remove({});
}

export function getPending({ instanceId }) {
  if (!Bpmn.instances.has(instanceId)) {
    throw new Error("no instance");
  }

  const instance = Bpmn.instances.get(instanceId);
  return instance.getPendingActivities();
}
