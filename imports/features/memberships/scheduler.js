import { SyncedCron } from 'meteor/littledata:synced-cron';
import { processAutoRenewal, processPendingChanges } from './service';
import { MembershipCollection } from './collection';

// 自动续订定时任务 - 每小时执行一次
SyncedCron.add({
  name: 'Process Auto Renewals',
  schedule: function(parser) {
    // 每小时的第0分钟执行
    return parser.text('every 1 hour');
  },
  job: async function() {
    console.log('开始处理自动续订...');
    
    try {
      // 查找需要续订的会员
      const now = new Date();
      const membershipsToRenew = MembershipCollection.find({
        status: "active",
        autoRenew: true,
        nextRenewalDate: { $lte: now }
      }).fetch();
      
      console.log(`找到 ${membershipsToRenew.length} 个需要续订的会员`);
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const membership of membershipsToRenew) {
        try {
          const result = await processAutoRenewal(membership._id);
          if (result) {
            successCount++;
            console.log(`会员 ${membership._id} 续订成功`);
          }
        } catch (error) {
          failedCount++;
          console.error(`会员 ${membership._id} 续订失败:`, error.message);
          
          // 可以在这里添加失败处理逻辑，比如发送通知邮件
          // 或者更新会员状态为 past_due
          MembershipCollection.update(membership._id, {
            $set: {
              status: "past_due",
              updatedAt: new Date()
            }
          });
        }
      }
      
      console.log(`自动续订完成: 成功 ${successCount}, 失败 ${failedCount}`);
      
      return {
        success: true,
        processed: membershipsToRenew.length,
        successCount,
        failedCount
      };
      
    } catch (error) {
      console.error('处理自动续订时出错:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// 处理待生效变更定时任务 - 每30分钟执行一次
SyncedCron.add({
  name: 'Process Pending Changes',
  schedule: function(parser) {
    // 每30分钟执行一次
    return parser.text('every 30 minutes');
  },
  job: async function() {
    console.log('开始处理待生效变更...');
    
    try {
      const changesProcessed = await processPendingChanges();
      
      console.log(`处理了 ${changesProcessed} 个待生效变更`);
      
      return {
        success: true,
        processed: changesProcessed
      };
      
    } catch (error) {
      console.error('处理待生效变更时出错:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// 清理过期订单定时任务 - 每天执行一次
SyncedCron.add({
  name: 'Cleanup Expired Orders',
  schedule: function(parser) {
    // 每天凌晨2点执行
    return parser.text('at 2:00 am');
  },
  job: function() {
    console.log('开始清理过期订单...');
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // 清理7天前的待支付订单
      const { OrderCollection } = require('./orders/collection');
      const result = OrderCollection.update(
        {
          status: "pending",
          createdAt: { $lt: sevenDaysAgo }
        },
        {
          $set: {
            status: "cancelled",
            cancelReason: "订单超时自动取消",
            cancelledAt: new Date(),
            updatedAt: new Date()
          }
        },
        { multi: true }
      );
      
      console.log(`清理了 ${result} 个过期订单`);
      
      return {
        success: true,
        cleaned: result
      };
      
    } catch (error) {
      console.error('清理过期订单时出错:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// 会员到期提醒定时任务 - 每天执行一次
SyncedCron.add({
  name: 'Membership Expiry Reminder',
  schedule: function(parser) {
    // 每天上午10点执行
    return parser.text('at 10:00 am');
  },
  job: function() {
    console.log('开始发送会员到期提醒...');
    
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      // 查找即将到期的会员（3天内到期）
      const membershipsExpiringSoon = MembershipCollection.find({
        status: "active",
        autoRenew: false,
        currentPeriodEnd: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        }
      }).fetch();
      
      // 查找需要续订提醒的会员（7天内需要续订）
      const membershipsNeedingRenewal = MembershipCollection.find({
        status: "active",
        autoRenew: true,
        nextRenewalDate: {
          $gte: new Date(),
          $lte: sevenDaysFromNow
        }
      }).fetch();
      
      console.log(`找到 ${membershipsExpiringSoon.length} 个即将到期的会员`);
      console.log(`找到 ${membershipsNeedingRenewal.length} 个需要续订提醒的会员`);
      
      // 这里可以集成邮件服务发送提醒邮件
      // 比如使用 Meteor 的 Email 包或第三方邮件服务
      
      let remindersSent = 0;
      
      // 发送到期提醒
      for (const membership of membershipsExpiringSoon) {
        try {
          // 发送到期提醒邮件的逻辑
          // await sendExpiryReminderEmail(membership);
          remindersSent++;
        } catch (error) {
          console.error(`发送到期提醒失败 (${membership._id}):`, error);
        }
      }
      
      // 发送续订提醒
      for (const membership of membershipsNeedingRenewal) {
        try {
          // 发送续订提醒邮件的逻辑
          // await sendRenewalReminderEmail(membership);
          remindersSent++;
        } catch (error) {
          console.error(`发送续订提醒失败 (${membership._id}):`, error);
        }
      }
      
      console.log(`发送了 ${remindersSent} 个提醒`);
      
      return {
        success: true,
        remindersSent
      };
      
    } catch (error) {
      console.error('发送会员到期提醒时出错:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// 启动定时任务（需要在服务器启动时调用）
export function startScheduler() {
  if (Meteor.isServer) {
    SyncedCron.start();
    console.log('订阅管理定时任务已启动');
  }
}

// 停止定时任务
export function stopScheduler() {
  if (Meteor.isServer) {
    SyncedCron.stop();
    console.log('订阅管理定时任务已停止');
  }
} 