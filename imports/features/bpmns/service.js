import { BpmnCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { ServiceContext } from "./engine/serviceContext";
import _ from "lodash";
import Bpmn from "./engine/engine";
import ZeebeModdle from "zeebe-bpmn-moddle/resources/zeebe.json";

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

export function execute({ source, variables }) {
  const engine = new Bpmn.Engine(
    {
      source,
      moddleOptions: {
        zeebe: ZeebeModdle,
      },
    },
    (err) => {
      console.log(err);
    }
  );

  const listener = new EventEmitter();
  listener.on("error", (err, displayErr) => {
    console.error(err);
    console.log(displayErr);
  });

  engine.on("error", (err, displayErr) => {
    console.error(err);
    console.log(displayErr);
  });

  engine.execute(
    {
      userId: this.userId,
      listener,
      variables: Object.assign(
        {},
        {
          startedBy: this.userId,
        },
        variables
      ),
      services: ServiceContext,
    },
    (err) => {
      console.log(err);
    }
  );
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
