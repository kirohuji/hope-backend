# 订阅系统API使用示例

## 完整订阅流程示例

### 1. 首次订阅流程

#### 步骤1：创建订阅订单
```javascript
// 前端调用
const response = await fetch('/api/orders/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token' // 需要用户登录
  },
  body: JSON.stringify({
    membershipTypeId: "64a1b2c3d4e5f6789abcdef0", // 会员类型ID
    billingCycle: "monthly", // monthly 或 yearly
    paymentMethod: "stripe" // 支付方式
  })
});

const orderData = await response.json();
console.log(orderData);
// 返回结果：
// {
//   orderId: "64a1b2c3d4e5f6789abcdef1",
//   orderNumber: "SUB24123012345",
//   price: 99,
//   billingCycle: "monthly",
//   effectiveDate: "2024-12-30T10:00:00.000Z",
//   periodEnd: "2025-01-30T10:00:00.000Z"
// }
```

#### 步骤2：处理支付
```javascript
// 集成支付网关（以Stripe为例）
const stripe = Stripe('pk_test_...');

// 创建支付意图
const paymentIntent = await stripe.confirmPayment({
  amount: orderData.price * 100, // Stripe使用分为单位
  currency: 'cny',
  metadata: {
    orderId: orderData.orderId
  }
});
```

#### 步骤3：完成支付确认
```javascript
// 支付成功后调用
const confirmResponse = await fetch(`/api/orders/${orderData.orderId}/subscriptions/complete-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    transactionId: paymentIntent.id // 支付网关返回的交易ID
  })
});

const membershipData = await confirmResponse.json();
console.log(membershipData);
// 返回结果：
// {
//   membershipId: "64a1b2c3d4e5f6789abcdef2",
//   status: "active"
// }
```

### 2. 获取当前订阅信息

```javascript
const response = await fetch('/api/subscriptions/current', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-auth-token'
  }
});

const subscription = await response.json();
console.log(subscription);
// 返回结果：
// {
//   _id: "64a1b2c3d4e5f6789abcdef2",
//   userId: "64a1b2c3d4e5f6789abcdef3",
//   membershipTypeId: "64a1b2c3d4e5f6789abcdef0",
//   status: "active",
//   currentPeriodStart: "2024-12-30T10:00:00.000Z",
//   currentPeriodEnd: "2025-01-30T10:00:00.000Z",
//   autoRenew: true,
//   nextRenewalDate: "2025-01-30T10:00:00.000Z",
//   billingCycle: "monthly",
//   currentPrice: 99,
//   currency: "CNY",
//   membershipType: {
//     name: "专业版",
//     identifier: "pro"
//   },
//   daysUntilRenewal: 31,
//   daysUntilExpiry: 31
// }
```

## 🚀 智能订阅变更（推荐使用）

### 3. 智能订阅变更 - 一键处理升级/降级

这是**新增的最强大接口**，只需传入目标会员类型和计费周期，系统自动判断是升级、降级还是立即生效：

```javascript
// 智能订阅变更 - 系统自动判断操作类型
const response = await fetch('/api/subscriptions/change', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    membershipTypeId: "64a1b2c3d4e5f6789abcdef4", // 目标会员类型ID
    billingCycle: "yearly", // 目标计费周期
    paymentMethod: "stripe" // 支付方式
  })
});

const changeResult = await response.json();
console.log(changeResult);

// 升级情况的返回结果：
// {
//   action: "upgrade",
//   effectiveImmediately: true,
//   effectiveDate: "2024-12-30T10:30:00.000Z",
//   prorationAmount: 150, // 需要补缴的金额
//   orderId: "64a1b2c3d4e5f6789abcdef5",
//   message: "已升级到专业版",
//   details: {
//     currentType: "基础版",
//     newType: "专业版",
//     currentBillingCycle: "monthly",
//     newBillingCycle: "yearly",
//     priceChange: 300
//   }
// }

// 降级情况的返回结果：
// {
//   action: "downgrade",
//   effectiveImmediately: false,
//   effectiveDate: "2025-01-30T10:00:00.000Z",
//   prorationAmount: 0,
//   message: "已安排降级到基础版，将在当前周期结束后生效",
//   details: {
//     currentType: "专业版",
//     newType: "基础版",
//     currentBillingCycle: "yearly",
//     newBillingCycle: "monthly",
//     priceChange: -200
//   }
// }

// 无变更情况的返回结果：
// {
//   action: "no_change",
//   message: "订阅无需变更",
//   currentSubscription: { ... }
// }
```

### 4. 订阅变更预览

在实际变更前，可以先预览变更效果：

```javascript
const response = await fetch('/api/subscriptions/preview-change', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    membershipTypeId: "64a1b2c3d4e5f6789abcdef4",
    billingCycle: "yearly"
  })
});

const preview = await response.json();
console.log(preview);
// 返回结果：
// {
//   changeType: "upgrade",
//   effectiveImmediately: true,
//   effectiveDate: "2024-12-30T10:30:00.000Z",
//   prorationAmount: 150,
//   currentSubscription: {
//     type: "基础版",
//     billingCycle: "monthly",
//     price: 99
//   },
//   newSubscription: {
//     type: "专业版",
//     billingCycle: "yearly",
//     price: 999
//   },
//   priceChange: 900,
//   savings: -900 // 负数表示额外费用，正数表示节省
// }
```

## 传统订阅管理（仍然支持）

### 5. 手动升级订阅（立即生效）

```javascript
const response = await fetch('/api/subscriptions/upgrade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    membershipId: "64a1b2c3d4e5f6789abcdef2",
    newMembershipTypeId: "64a1b2c3d4e5f6789abcdef4" // 更高级的会员类型
  })
});

const upgradeResult = await response.json();
console.log(upgradeResult);
// 返回结果：
// {
//   orderId: "64a1b2c3d4e5f6789abcdef5",
//   prorationAmount: 50, // 需要补缴的金额
//   effectiveDate: "2024-12-30T10:30:00.000Z"
// }
```

### 6. 手动降级订阅（周期结束生效）

```javascript
const response = await fetch('/api/subscriptions/downgrade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    membershipId: "64a1b2c3d4e5f6789abcdef2",
    newMembershipTypeId: "64a1b2c3d4e5f6789abcdef6" // 更低级的会员类型
  })
});

const downgradeResult = await response.json();
console.log(downgradeResult);
// 返回结果：
// {
//   effectiveDate: "2025-01-30T10:00:00.000Z", // 当前周期结束后生效
//   newMembershipType: "基础版"
// }
```

### 7. 取消订阅（周期结束失效）

```javascript
const response = await fetch('/api/orders/subscriptions/64a1b2c3d4e5f6789abcdef2/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    reason: "用户主动取消" // 可选
  })
});

const cancelResult = await response.json();
console.log(cancelResult);
// 返回结果：
// {
//   orderId: "64a1b2c3d4e5f6789abcdef7",
//   effectiveDate: "2025-01-30T10:00:00.000Z" // 当前周期结束失效
// }
```

## 订单管理API

### 1. 获取用户订单列表

```javascript
const response = await fetch('/api/orders/info', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-auth-token'
  }
});

const orders = await response.json();
console.log(orders);
// 返回订单数组，每个订单包含订单项信息
```

### 2. 获取订单详情

```javascript
const response = await fetch('/api/orders/64a1b2c3d4e5f6789abcdef1', {
  method: 'GET'
});

const orderDetail = await response.json();
console.log(orderDetail);
// 返回详细的订单信息，包括客户信息、会员类型、订单历史等
```

### 3. 取消未支付订单

```javascript
const response = await fetch('/api/orders/64a1b2c3d4e5f6789abcdef1/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    reason: "用户取消" // 可选
  })
});

const result = await response.json();
console.log(result);
// 返回：{ success: true, message: '订单已取消' }
```

### 4. 下载订单PDF

```javascript
// 直接在浏览器中打开或下载
window.open('/api/orders/64a1b2c3d4e5f6789abcdef1/pdf');

// 或者用fetch下载
const response = await fetch('/api/orders/64a1b2c3d4e5f6789abcdef1/pdf');
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'order.pdf';
a.click();
```

### 5. 订单分页查询（管理员）

```javascript
const response = await fetch('/api/orders/pagination', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer admin-auth-token'
  },
  body: JSON.stringify({
    selector: {
      status: "completed", // 查询条件
      type: "subscription"
    },
    options: {
      limit: 20,
      skip: 0,
      sort: { createdAt: -1 }
    }
  })
});

const paginationResult = await response.json();
console.log(paginationResult);
// 返回：
// {
//   data: [...], // 订单列表
//   total: 100   // 总数
// }
```

## React组件使用示例

### 智能订阅变更组件（推荐）

```jsx
import React, { useState, useEffect } from 'react';

const SmartSubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('monthly');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchMembershipTypes();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setSubscription(data);
      if (data) {
        setSelectedType(data.membershipTypeId);
        setSelectedCycle(data.billingCycle);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    }
  };

  const fetchMembershipTypes = async () => {
    // 假设有获取会员类型列表的接口
    // const response = await fetch('/api/membership-types');
    // const types = await response.json();
    // setMembershipTypes(types);
  };

  // 预览变更
  const handlePreviewChange = async () => {
    if (!selectedType || !selectedCycle) return;

    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/preview-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          membershipTypeId: selectedType,
          billingCycle: selectedCycle
        })
      });

      const previewData = await response.json();
      setPreview(previewData);
    } catch (error) {
      console.error('预览变更失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 执行智能变更
  const handleSmartChange = async () => {
    if (!selectedType || !selectedCycle) return;

    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          membershipTypeId: selectedType,
          billingCycle: selectedCycle,
          paymentMethod: 'stripe'
        })
      });

      const result = await response.json();
      
      if (result.action === 'no_change') {
        alert('订阅无需变更');
      } else if (result.effectiveImmediately && result.prorationAmount > 0) {
        // 需要支付额外费用
        const confirmPay = confirm(`需要支付额外费用 ¥${result.prorationAmount}，是否继续？`);
        if (confirmPay) {
          // 处理支付逻辑
          await handleUpgradePayment(result.orderId, result.prorationAmount);
        }
      } else {
        alert(result.message);
      }

      // 刷新订阅信息
      fetchCurrentSubscription();
      setPreview(null);
    } catch (error) {
      console.error('变更失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePayment = async (orderId, amount) => {
    // 集成支付逻辑
    console.log('处理升级支付:', orderId, amount);
  };

  // 当选择变更时自动预览
  useEffect(() => {
    if (selectedType && selectedCycle && subscription) {
      if (selectedType !== subscription.membershipTypeId || 
          selectedCycle !== subscription.billingCycle) {
        handlePreviewChange();
      } else {
        setPreview(null);
      }
    }
  }, [selectedType, selectedCycle, subscription]);

  if (!subscription) return <div>暂无订阅</div>;

  return (
    <div className="smart-subscription-manager">
      <h2>智能订阅管理</h2>
      
      <div className="current-subscription">
        <h3>当前订阅</h3>
        <p>套餐: {subscription.membershipType?.name}</p>
        <p>计费周期: {subscription.billingCycle === 'monthly' ? '月付' : '年付'}</p>
        <p>价格: ¥{subscription.currentPrice}</p>
        <p>状态: {subscription.status}</p>
      </div>

      <div className="change-subscription">
        <h3>变更订阅</h3>
        
        <div className="form-group">
          <label>选择套餐:</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {membershipTypes.map(type => (
              <option key={type._id} value={type._id}>
                {type.name} - 月付¥{type.monthlyPrice} / 年付¥{type.yearlyPrice}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>计费周期:</label>
          <select 
            value={selectedCycle} 
            onChange={(e) => setSelectedCycle(e.target.value)}
          >
            <option value="monthly">月付</option>
            <option value="yearly">年付</option>
          </select>
        </div>

        {preview && (
          <div className="preview-box">
            <h4>变更预览</h4>
            <p>操作类型: {preview.changeType}</p>
            <p>生效时间: {preview.effectiveImmediately ? '立即生效' : '周期结束后生效'}</p>
            <p>价格变化: ¥{preview.priceChange}</p>
            {preview.prorationAmount > 0 && (
              <p className="highlight">需要支付: ¥{preview.prorationAmount}</p>
            )}
            {preview.savings > 0 && (
              <p className="highlight">将节省: ¥{preview.savings}</p>
            )}
          </div>
        )}

        <button 
          onClick={handleSmartChange} 
          disabled={loading || !preview || preview.changeType === 'no_change'}
        >
          {loading ? '处理中...' : '确认变更'}
        </button>
      </div>
    </div>
  );
};

export default SmartSubscriptionManager;
```

### 订阅管理组件

```jsx
import React, { useState, useEffect } from 'react';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newMembershipTypeId) => {
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          membershipId: subscription._id,
          newMembershipTypeId
        })
      });
      
      const result = await response.json();
      
      if (result.prorationAmount > 0) {
        // 处理升级付款
        await processUpgradePayment(result.orderId, result.prorationAmount);
      }
      
      // 刷新订阅信息
      fetchCurrentSubscription();
    } catch (error) {
      console.error('升级失败:', error);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/orders/subscriptions/${subscription._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          reason: "用户主动取消"
        })
      });
      
      const result = await response.json();
      alert(`订阅将在 ${new Date(result.effectiveDate).toLocaleDateString()} 失效`);
      
      // 刷新订阅信息
      fetchCurrentSubscription();
    } catch (error) {
      console.error('取消失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!subscription) return <div>暂无订阅</div>;

  return (
    <div className="subscription-manager">
      <h2>我的订阅</h2>
      <div className="subscription-info">
        <p>当前套餐: {subscription.membershipType?.name}</p>
        <p>状态: {subscription.status}</p>
        <p>计费周期: {subscription.billingCycle === 'monthly' ? '月付' : '年付'}</p>
        <p>当前周期: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
        <p>自动续订: {subscription.autoRenew ? '已开启' : '已关闭'}</p>
        {subscription.daysUntilRenewal && (
          <p>距离续订: {subscription.daysUntilRenewal} 天</p>
        )}
      </div>
      
      <div className="subscription-actions">
        <button onClick={() => handleUpgrade('pro-plan-id')}>
          升级到专业版
        </button>
        <button onClick={handleCancel} className="cancel-btn">
          取消订阅
        </button>
      </div>
    </div>
  );
};

export default SubscriptionManager;
```

### 订阅创建组件

```jsx
import React, { useState } from 'react';

const CreateSubscription = ({ membershipTypes, onSuccess }) => {
  const [selectedType, setSelectedType] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 创建订阅订单
      const orderResponse = await fetch('/api/orders/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          membershipTypeId: selectedType,
          billingCycle,
          paymentMethod: 'stripe'
        })
      });

      const orderData = await orderResponse.json();

      // 2. 处理支付（这里简化处理）
      const paymentSuccess = await processPayment(orderData);

      if (paymentSuccess) {
        // 3. 确认支付
        const confirmResponse = await fetch(`/api/orders/${orderData.orderId}/subscriptions/complete-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            transactionId: paymentSuccess.transactionId
          })
        });

        const membershipData = await confirmResponse.json();
        onSuccess(membershipData);
      }
    } catch (error) {
      console.error('创建订阅失败:', error);
      alert('创建订阅失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (orderData) => {
    // 这里集成具体的支付处理逻辑
    // 返回 { transactionId: 'xxx' } 或 false
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ transactionId: 'mock_transaction_' + Date.now() });
      }, 2000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-subscription">
      <h2>选择订阅套餐</h2>
      
      <div className="membership-types">
        {membershipTypes.map(type => (
          <label key={type._id} className="membership-option">
            <input
              type="radio"
              value={type._id}
              checked={selectedType === type._id}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            <div className="type-info">
              <h3>{type.name}</h3>
              <p>月付: ¥{type.monthlyPrice}</p>
              <p>年付: ¥{type.yearlyPrice}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="billing-cycle">
        <label>
          <input
            type="radio"
            value="monthly"
            checked={billingCycle === 'monthly'}
            onChange={(e) => setBillingCycle(e.target.value)}
          />
          月付
        </label>
        <label>
          <input
            type="radio"
            value="yearly"
            checked={billingCycle === 'yearly'}
            onChange={(e) => setBillingCycle(e.target.value)}
          />
          年付（2个月免费）
        </label>
      </div>

      <button type="submit" disabled={!selectedType || loading}>
        {loading ? '处理中...' : '立即订阅'}
      </button>
    </form>
  );
};

export default CreateSubscription;
```

## 错误处理

所有API都可能返回错误，建议统一处理：

```javascript
const handleApiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '请求失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    // 显示用户友好的错误信息
    alert(error.message);
    throw error;
  }
};

// 使用示例
const subscription = await handleApiCall('/api/subscriptions/current', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
```

## 主要API端点总结

### 智能订阅管理（推荐）
```javascript
POST /api/subscriptions/change          // 智能订阅变更
POST /api/subscriptions/preview-change  // 预览订阅变更
```

### 基础订阅管理
```javascript
POST /api/orders/subscriptions                         // 创建订阅
POST /api/orders/:orderId/subscriptions/complete-payment // 完成支付
GET  /api/subscriptions/current                        // 获取当前订阅
POST /api/subscriptions/upgrade                        // 手动升级
POST /api/subscriptions/downgrade                      // 手动降级
POST /api/orders/subscriptions/:membershipId/cancel   // 取消订阅
```

### 订单管理
```javascript
GET  /api/orders/info           // 用户订单列表
GET  /api/orders/:id            // 订单详情
POST /api/orders/:id/cancel     // 取消订单
GET  /api/orders/:id/pdf        // 下载PDF
POST /api/orders/pagination     // 订单分页查询
```

**推荐使用智能订阅变更接口 `/api/subscriptions/change`，它会自动判断操作类型并执行相应逻辑，大大简化前端开发！** 