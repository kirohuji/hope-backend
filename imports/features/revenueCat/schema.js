import { RevenueCatCollection, RevenueCatUserCollection } from './collection';
import SimpleSchema from 'simpl-schema';

// RevenueCat Webhook Collection Schema
RevenueCatCollection.attachSchema(new SimpleSchema({
  event: {
    type: Object,
    optional: true
  },
  'event.type': {
    type: String,
    allowedValues: [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'NON_RENEWING_PURCHASE',
      'CANCELLATION',
      'BILLING_ISSUE',
      'SUBSCRIPTION_PAUSED',
      'TRANSFER'
    ]
  },
  'event.user_id': String,
  'event.product_id': String,
  'event.purchase_date': Date,
  'event.transaction_id': String,
  'event.app_user_id': String,
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
}));

// RevenueCat User Collection Schema
RevenueCatUserCollection.attachSchema(new SimpleSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  appUserId: {
    type: String,
    unique: true
  },
  entitlements: {
    type: Array,
    optional: true
  },
  'entitlements.$': {
    type: Object
  },
  'entitlements.$.identifier': String,
  'entitlements.$.active': Boolean,
  'entitlements.$.expires_date': {
    type: Date,
    optional: true
  },
  'entitlements.$.product_identifier': String,
  'entitlements.$.purchase_date': Date,
  'entitlements.$.original_purchase_date': Date,
  'entitlements.$.period_type': {
    type: String,
    allowedValues: ['NORMAL', 'INTRO', 'TRIAL']
  },
  'entitlements.$.store': {
    type: String,
    allowedValues: ['APP_STORE', 'PLAY_STORE']
  },
  'entitlements.$.is_sandbox': Boolean,
  'entitlements.$.unsubscribe_detected_at': {
    type: Date,
    optional: true
  },
  'entitlements.$.billing_issues_detected_at': {
    type: Date,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
}));

// Membership Types Collection Schema
export const MembershipTypeCollection = new Mongo.Collection('membership_types');
MembershipTypeCollection.attachSchema(new SimpleSchema({
  name: String,
  identifier: {
    type: String,
    unique: true
  },
  description: String,
  price: Number,
  duration: {
    type: Number,
    min: 1
  },
  durationUnit: {
    type: String,
    allowedValues: ['month', 'year']
  },
  features: {
    type: Array,
    optional: true
  },
  'features.$': String,
  isActive: {
    type: Boolean,
    defaultValue: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
}));

// User Memberships Collection Schema
export const UserMembershipCollection = new Mongo.Collection('user_memberships');
UserMembershipCollection.attachSchema(new SimpleSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  membershipTypeId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  status: {
    type: String,
    allowedValues: ['active', 'expired', 'cancelled', 'pending']
  },
  startDate: Date,
  endDate: Date,
  autoRenew: {
    type: Boolean,
    defaultValue: true
  },
  lastRenewalDate: {
    type: Date,
    optional: true
  },
  nextRenewalDate: {
    type: Date,
    optional: true
  },
  revenueCatTransactionId: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
}));

// Transaction History Collection Schema
export const TransactionHistoryCollection = new Mongo.Collection('transaction_history');
TransactionHistoryCollection.attachSchema(new SimpleSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  membershipTypeId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  type: {
    type: String,
    allowedValues: ['purchase', 'renewal', 'cancellation', 'refund']
  },
  amount: Number,
  currency: {
    type: String,
    defaultValue: 'CNY'
  },
  status: {
    type: String,
    allowedValues: ['success', 'failed', 'pending', 'refunded']
  },
  revenueCatTransactionId: String,
  receiptData: {
    type: Object,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
})); 