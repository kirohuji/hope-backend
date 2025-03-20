import { SyncedCron } from 'meteor/littledata:synced-cron';
import { MessageesStorage } from '../fileServer/message';

// Configure SyncedCron
SyncedCron.config({
  collectionName: 'cron:history',
});

// Add scheduled task
SyncedCron.add({
  name: 'Clean chat file records',
  schedule(parser) {
    return parser.text('at 00:00');
  },
  job() {
    console.log('Starting to clean chat file records...');
    // 获取当前时间的三天前
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    // 批量删除 `createdAt` 在三天前的文件记录
    const result = MessageesStorage.remove({
      createdAt: { $lt: threeDaysAgo },
    });
    console.log('Finished cleaning chat file records!');
  },
});

// Start the scheduled tasks
SyncedCron.start();
