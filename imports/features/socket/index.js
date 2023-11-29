import moment from "moment";
import { SocketUserCollection, NotificationtCollection, NotificationUserCollection } from '../notifications/collection'
import { BroadcastCollection, BroadcastUserCollection } from '../broadcasts/collection'
import _ from 'lodash'

import http from 'http';
import socket_io from 'socket.io';

const PORT = 5500;
const server = http.createServer();
const io = socket_io(server, {
    cors: {
        origin: "*",
    }
});

io.on('connection', Meteor.bindEnvironment(function (socket) {
    console.log('socket',socket.id)
    io.on('disconnect', Meteor.bindEnvironment(() => {
        console.log('A user disconnected');
    }));
    socket.on('upsert', Meteor.bindEnvironment((data) => {
        Meteor.call('upsert', { socketId: socket.id, data })
    }));
    socket.on('notification', Meteor.bindEnvironment((data) => {
        const broadcastsUsers = BroadcastUserCollection.find({
            broadcast_id: data
        }).fetch()
        const broadcast = BroadcastCollection.findOne({
            broadcast_id: data
        })
        NotificationtCollection.insert(broadcast);
        const socketUsers = SocketUserCollection.find({
            user_id: {
                $in: broadcastsUsers.map(item => item.user_id)
            }
        }).fetch()
        socketUsers.forEach(item => {
            if(socket.id === item.socket_id){
                socket.emit("hello",broadcast);
            } else {
                socket.to(item.socket_id).emit("hello", broadcast);
            }
        })
        // socket.to().emit("hello", "world");
        // Meteor.call('notification')
    }));
}));

Meteor.methods({
    upsert: function ({ socketId, data }) {
        if(data){
            const reponse = SocketUserCollection.upsert({
                user_id: data._id
            }, {
                socket_id: socketId,
                user_id: data._id
            })
            console.log('reponse', reponse)   
        }
    }
})
try {
    server.listen(PORT);
} catch (e) {
    console.error(e);
}