# 订阅系统重构说明

## 概述

本次重构完全重新设计了订单系统和会员系统，以支持现代化的自动订阅业务逻辑。新系统支持以下核心功能：

- ✅ 首次订阅立即生效
- ✅ 自动续订周期结束后无缝续订
- ✅ 升级订阅立即生效（按比例计费）
- ✅ 降级订阅当前周期结束后生效
- ✅ 取消订阅当前周期结束失效

## 数据模型变更

### 会员集合 (MembershipCollection)

**新增字段：**
- `currentPeriodStart/End`: 当前订阅周期
- `autoRenew`: 自动续订开关
- `nextRenewalDate`: 下次续订日期
- `billingCycle`: 计费周期（monthly/yearly）
- `pendingChange`: 待处理变更
- `cancelledAt/cancelReason/cancelEffectiveDate`: 取消相关信息

**删除字段：**
- `type`, `startDate`, `endDate`, `discount`, `points`, `orderId`, `createdBy`

### 订单集合 (OrderCollection)

**新增字段：**
- `type`: 订单类型（subscription/renewal/upgrade/downgrade/cancellation）
- `membershipId`: 关联的会员记录ID
- `billingCycle`: 计费周期
- `subtotal/prorationAmount/discountAmount`: 详细价格信息
- `effectiveDate`: 生效日期
- `refundAmount/refundedAt/refundReason`: 退款信息

**删除字段：**
- `value`, `label`, `description`, `taxes`, `totalQuantity`, `createdBy`, `scope`, `action`, `isYearly`

### 会员类型集合 (MembershipTypeCollection)

**重新设计：**
- `monthlyPrice/yearlyPrice`: 分别存储月价格和年价格
- `features`: 功能列表
- `limits`: 使用限制
- `sortOrder/isActive/isPublic`: 显示控制

## API接口变更

### 新增订阅管理接口

```javascript
// 创建订阅
POST /api/subscriptions/create
{
  "membershipTypeId": "xxx",
  "billingCycle": "monthly|yearly",
  "paymentMethod": "stripe|paypal|..."
}

// 完成支付
POST /api/subscriptions/complete-payment
{
  "orderId": "xxx",
  "transactionId": "xxx"
}

// 获取当前订阅
GET /api/subscriptions/current

// 升级订阅（立即生效）
POST /api/subscriptions/upgrade
{
  "membershipId": "xxx",
  "newMembershipTypeId": "xxx"
}

// 降级订阅（周期结束生效）
POST /api/subscriptions/downgrade
{
  "membershipId": "xxx",
  "newMembershipTypeId": "xxx"
}

// 取消订阅（周期结束失效）
POST /api/subscriptions/cancel
{
  "membershipId": "xxx",
  "reason": "用户主动取消"
}
```

### 保留的订单接口

```javascript
// 订单分页查询
POST /api/orders/pagination

// 获取订单详情
GET /api/orders/:id

// 获取用户订单列表
GET /api/orders/my

// 取消订单
POST /api/orders/:id/cancel

// 生成订单PDF
GET /api/orders/:id/pdf
```

### 删除的接口

- `POST /api/orders/change-membership`
- `POST /api/orders/complete-membership-change`
- `POST /api/orders/cancel-membership-change`
- `POST /api/orders/pagination-with-membership`

## 业务流程

### 1. 首次订阅流程

```javascript
// 1. 创建订阅订单
const order = await createSubscription(userId, membershipTypeId, "monthly", "stripe");

// 2. 用户支付

// 3. 支付完成后激活订阅
const membership = await completeSubscriptionPayment(order.orderId, transactionId);
```

### 2. 自动续订流程

自动续订由定时任务处理：

```javascript
// 每小时检查需要续订的会员
// 自动创建续订订单并更新会员周期
await processAutoRenewal(membershipId);
```

### 3. 升级订阅流程（立即生效）

```javascript
// 计算按比例计费，立即生效
const result = await upgradeSubscription(membershipId, newMembershipTypeId);
// result.prorationAmount 为需要补缴的费用
```

### 4. 降级订阅流程（周期结束生效）

```javascript
// 设置待处理变更，不立即生效
const result = await downgradeSubscription(membershipId, newMembershipTypeId);
// result.effectiveDate 为生效日期
```

### 5. 取消订阅流程

```javascript
// 设置取消标记，当前周期结束后失效
const result = await cancelSubscription(membershipId, "用户主动取消");
// result.effectiveDate 为失效日期
```

## 定时任务

系统包含以下定时任务：

### 1. 自动续订处理（每小时）
```javascript
// 处理到期需要续订的会员
SyncedCron.add({
  name: 'Process Auto Renewals',
  schedule: parser => parser.text('every 1 hour'),
  job: async () => { /* 处理逻辑 */ }
});
```

### 2. 待处理变更（每30分钟）
```javascript
// 处理到期的降级/取消操作
SyncedCron.add({
  name: 'Process Pending Changes',
  schedule: parser => parser.text('every 30 minutes'),
  job: async () => { /* 处理逻辑 */ }
});
```

### 3. 过期订单清理（每天）
```javascript
// 清理7天前未支付的订单
SyncedCron.add({
  name: 'Cleanup Expired Orders',
  schedule: parser => parser.text('at 2:00 am'),
  job: () => { /* 清理逻辑 */ }
});
```

### 4. 到期提醒（每天）
```javascript
// 发送会员到期/续订提醒
SyncedCron.add({
  name: 'Membership Expiry Reminder',
  schedule: parser => parser.text('at 10:00 am'),
  job: () => { /* 提醒逻辑 */ }
});
```

## 启动定时任务

在服务器启动时调用：

```javascript
import { startScheduler } from './imports/features/memberships/scheduler';

Meteor.startup(() => {
  startScheduler();
});
```

## 数据迁移

如果从旧系统迁移，需要：

1. **备份现有数据**
2. **创建数据迁移脚本**：
   - 将旧的 membership 数据转换为新格式
   - 将旧的 order 数据转换为新格式
   - 更新 membershipType 数据结构

3. **迁移脚本示例**：

```javascript
// 迁移会员数据
const oldMemberships = MembershipCollection.find({}).fetch();
oldMemberships.forEach(old => {
  MembershipCollection.update(old._id, {
    $set: {
      currentPeriodStart: new Date(old.startDate),
      currentPeriodEnd: new Date(old.endDate),
      autoRenew: old.autoRenew || true,
      nextRenewalDate: new Date(old.endDate),
      billingCycle: old.isYearly ? "yearly" : "monthly",
      currentPrice: old.price
    },
    $unset: {
      startDate: "",
      endDate: "",
      isYearly: ""
    }
  });
});
```

## 注意事项

1. **支付集成**：需要配置支付网关（Stripe、PayPal等）
2. **邮件服务**：配置邮件服务用于发送提醒
3. **错误处理**：添加完善的错误处理和日志记录
4. **测试**：充分测试各种边界情况
5. **监控**：添加系统监控和告警

## 测试建议

1. **单元测试**：测试各个服务函数
2. **集成测试**：测试完整的订阅流程
3. **定时任务测试**：模拟各种时间场景
4. **支付测试**：使用测试支付环境
5. **边界测试**：测试异常情况处理

这个重构后的系统提供了完整的订阅管理功能，支持现代SaaS应用的各种订阅场景。 