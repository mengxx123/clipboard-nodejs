const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// 在线用户
var onlineUsers = {};
// 当前在线人数
var onlineCount = 0;
let chatlog = []
let rooms = {
}

let clipboards = {

}
let clipboardId = 1

app.get('/', function (req, res) {
    res.send('Clipboard API')
})

app.get('/clipboards/:id', function (req, res) {
    res.send('Clipboard API')
})

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create', uuid => {
        console.log('创建')
        let id = '' + clipboardId++
        clipboards[id] = {}
        socket.emit('created', id)
    })

    socket.on('link', obj => {
        console.log('链接')
        console.log(obj)
        let clipboard = clipboards[obj.id]
        if (!clipboard.users) {
            clipboard.users = []
        }
        let user = {
            id: obj.uuid,
            socket: socket
        }
        let isFound = false
        for (let i = 0; i < clipboard.users.length; i++) {
            if (clipboard.users[i].id === obj.uuid) {
                isFound = true
                clipboard.users.splice(i, 1, user)
            }

        }
        if (!isFound) {
            clipboard.users.push({
                id: obj.uuid,
                socket: socket
            })
        }
        
        console.log(clipboards)
    })

    socket.on('text', obj => {
        console.log('文字')
        console.log(obj)
        let clipboard = clipboards[obj.id]
        // if (!clipboard)
        if (!clipboard.users) {
            clipboard.users = []
        }
        // if (!clipboard.users.length
        for (let user of clipboard.users) {
            console.log('发送文字')
            user.socket.emit('text', obj.text)
        }
    })

    // 监听新用户加入
    socket.on('login', function (obj) {
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj.userid;

        //检查在线列表，如果不在里面就加入
        if (!onlineUsers.hasOwnProperty(obj.userid)) {
            onlineUsers[obj.userid] = obj.username;
            //在线人数+1
            onlineCount++;
        }

        //向所有客户端广播用户加入
        io.emit('login', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
        console.log(obj.username + '加入了聊天室');
    });

    //监听用户退出
    socket.on('disconnect', function () {
        console.log('用户退出')
        //将退出的用户从在线列表中删除
        if (onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {userid: socket.name, username: onlineUsers[socket.name]};

            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;

            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
            console.log(obj.username + '退出了聊天室');
        }
    });

    //监听用户发布聊天内容
    socket.on('message', function (obj) {
        console.log(obj)
        if (obj.to_id === '2') {
            console.log('机器人啊');
            //io.emit('debug', io.socket);
            io.emit('message', obj);
            io.sockets.socket(socket).emit('message', {
                from_id: '2',
                username: '机器人',
                to_id: obj.from_id,
                type: 'one',
                content: '这是自动回复，么么哒',
                time: new Date().getTime()
            });
        } else {
            //向所有客户端广播发布的消息
            io.emit('message', obj);
            chatlog.push(obj)
            console.log(obj.username + '说：' + obj.content + '**');
        }

    });

});

http.listen(1333, function () {
    console.log('listening on *:1333')
})