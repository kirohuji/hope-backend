import { SyncedCron } from "meteor/percolate:synced-cron";
SyncedCron.config({
  collectionName: "cron:history",
});
SyncedCron.add({
  name: "test",
  schedule: (parser) => parser.text("at 00:00"),
  job: () => console.log("Cron job executed!"),
});

// 启动定时任务
SyncedCron.start();
