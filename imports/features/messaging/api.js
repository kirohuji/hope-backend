import Api from "../../api";
import _ from 'lodash'
import {
    Conversation,
    ConversationsCollection,
    ParticipantsCollection,
    Message,
    MessagesCollection,
} from 'meteor/socialize:messaging';
import { CollectionHooks } from 'meteor/matb33:collection-hooks'
import { ProfilesCollection } from 'meteor/socialize:user-profile';


/** 会话信息 */
Api.addRoute('messaging/conversations/:_id', {
    get: {
        authRequired: true,
        action: function () {
            let conversation = ConversationsCollection.findOne({ _id: this.urlParams._id })
            return {
                ...conversation,
                messages: [],
                unreadCount: 0,
                type: conversation._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
                participants: ProfilesCollection.find({ _id: { $in: conversation._participants } }).fetch()
            }
        }
    }
});

/** 未读会话 */
Api.addRoute('messaging/unreadConversations', {
    post: {
        authRequired: true,
        action: function () {
            return this.user.unreadConversations(this.bodyParams.options || {}).fetch();
        }
    }
});


/** 最新会话 */
Api.addRoute('messaging/newestConversation', {
    get: {
        authRequired: true,
        action: function () {
            return this.user.newestConversation() || false;
        }
    }
});


Api.addRoute('messaging/isObserving/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return this.user.isObserving(this.urlParams._id)
        }
    }
});

Api.addRoute('messaging/findExistingConversationWithUsers', {
    post: {
        authRequired: true,
        action: function () {
            this.bodyParams.users.push(this.userId)
            const conversation = ConversationsCollection.findOne({ _participants: { $size: this.bodyParams.users.length, $all: this.bodyParams.users } });
            return conversation._id
        }
    }
});


/** 当前用户是否未读 */
Api.addRoute('messaging/conversations/:_id/isUnread', {
    post: {
        authRequired: true,
        action: function () {
            return !!ParticipantsCollection.findOne({ conversationId: this.urlParams._id, userId: this.userId, read: false });
        }
    }
});

/** 当前会话是否只读 */
Api.addRoute('messaging/conversations/:_id/isReadOnly', {
    get: {
        authRequired: true,
        action: function () {
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).isReadOnly()
        }
    }
});

/** 获取会话的消息 */
Api.addRoute('messaging/conversations/:_id/messages', {
    post: {
        authRequired: true,
        action: function () {
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).messages(this.bodyParams.options || {}).map(item => {
                return {
                    ...item,
                    attachments: [],
                    contentType: 'text',
                    senderId: item.userId
                }
            })
        }
    }
});


/** 获取当前会话的最后一条消息 */
Api.addRoute('messaging/conversations/:_id/lastMessage', {
    get: {
        authRequired: true,
        action: function () {
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).lastMessage()
        }
    }
});


/** 发送消息 */
Api.addRoute('messaging/conversations/:_id/sendMessage', {
    post: {
        authRequired: true,
        action: function () {

            // let conversation = ConversationsCollection.findOne({ _id: this.urlParams._id })
            return MessagesCollection
                .insert(new Message({
                    body: this.bodyParams.body,
                    conversationId: this.urlParams._id,
                    inFlight: true
                }), {
                    extendAutoValueContext: {
                        userId: this.userId
                    }
                })
        }
    }
});

/** 更新会话 id 的阅读状态 */
Api.addRoute('messaging/conversations/:_id/updateReadState/:_status', {
    get: {
        authRequired: true,
        action: function () {
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).updateReadState(this.urlParams._status)
        }
    }
});

/** 根据会话 id添加一组参与者 */
Api.addRoute('messaging/conversations/:_id/addParticipants', {
    post: {
        authRequired: true,
        action: function () {
            const users = Meteor.users.find({ _id: { $in: this.bodyParams.participants } }).fetch()
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).addParticipants(users)
        }
    }
});
/** 根据会话 id添加参与者 */
Api.addRoute('messaging/conversations/:_id/addParticipant', {
    post: {
        authRequired: true,
        action: function () {
            const user = Meteor.users.find({ _id: this.bodyParams.participant }).fetch()
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).addParticipant(user)
        }
    }
});
/** 根据会话 id删除参与者 */
Api.addRoute('messaging/conversations/:_id/removeParticipant', {
    post: {
        authRequired: true,
        action: function () {
            const user = Meteor.users.find({ _id: this.bodyParams.participant }).fetch()
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).removeParticipant(user)
        }
    }
});

/** 根据会话 id 获取所有的参与者 */
Api.addRoute('messaging/conversations/:_id/participants', {
    get: {
        authRequired: true,
        action: function () {
            return ConversationsCollection.findOne({ _id: this.urlParams._id }).participants()
        }
    }
});

/** 根据会话 id 获取所有的参与者的信息 */
Api.addRoute('messaging/conversations/:_id/participantsAsUsers', {
    get: {
        authRequired: true,
        action: function () {
            return ProfilesCollection.find({
                _id: {
                    $in:
                        ConversationsCollection
                            .findOne({ _id: this.urlParams._id })
                            .participantsAsUsers()
                            .map(item => item._id)
                }
            })
                .map(item => {
                    return {
                        ...item,
                        status: "busy"
                    }
                })
        }
    }
});

/** 创建一个新会话 */
Api.addRoute('messaging/conversations/room', {
    post: {
        authRequired: true,
        action: function () {
            CollectionHooks.defaultUserId = this.userId
            let convo = new Conversation().save()
            const users = Meteor.users.find({ _id: { $in: this.bodyParams.participants } }).fetch()
            convo.addParticipants(users)
            return convo
        }
    }
});

/** 根据参与者 id 获取对应的会话信息 */
Api.addRoute('messaging/participants/conversation/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return ParticipantsCollection.findOne({ _id: this.urlParams._id }).conversation()
        }
    }
});

/** 根据参与者 id 获取对应的用户信息 */
Api.addRoute('messaging/participants/user/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return ParticipantsCollection.findOne({ _id: this.urlParams._id }).user()
        }
    }
});

/** 获取当前用户的未读会话数量 */
Api.addRoute('messaging/users/numUnreadConversations', {
    get: {
        authRequired: true,
        action: function () {
            return this.user.numUnreadConversations();
        }
    }
});
/** 获取用户的未读会话数量 */
Api.addRoute('messaging/users/numUnreadConversations/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return Meteor.users.findOne({ _id: this.urlParams._id }).numUnreadConversations();
        }
    }
});

/** 根据当前用户获取所有的会话 */
Api.addRoute('messaging/users/conversations', {
    get: {
        authRequired: true,
        action: function () {
            return this.user.conversations().fetch().map(item => {
                return {
                    ...item,
                    messages: [],
                    unreadCount: 0,
                    type: item._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
                    participants: ProfilesCollection.find({ _id: { $in: item._participants } }).fetch()
                }
            })
        }
    }
});
/** 根据用户获取所有的会话 */
Api.addRoute('messaging/users/conversations/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return Meteor.users.findOne({ _id: this.urlParams._id }).conversations().fetch()
        }
    }
});

/** 判断当前用户是否在指定的会话中 */
Api.addRoute('messaging/conversations/:_id/isParticipatingIn', {
    get: {
        authRequired: true,
        action: function () {
            return this.user.isParticipatingIn(this.urlParams._id)
        }
    }
});

/** 判断用户是否在指定的会话中 */
Api.addRoute('messaging/conversations/:_id/isParticipatingIn/:_userId', {
    get: {
        authRequired: true,
        action: function () {
            return Meteor.users.findOne({ _id: this.urlParams._userId }).isParticipatingIn(this.urlParams._id)
        }
    }
});