const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

const { List, Task, User, Chat, UserSignUpForm, LekarzSignUpForm } = require('./DB/models');
const { mongoose } = require('./DB/mongoose');
//const { mongoose } = require('mongoose');
//const config = require('./config/database');
const jwt = require('jsonwebtoken');

var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => res.send('hello!'));
var allClients = {};

var fileRoutes = require('./routes/file');
app.use('/file', fileRoutes);

var multer = require('multer');
var path = require('path');

var store = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.' + file.originalname);
    }
});

var upload = multer({ storage: store }).single('file');

app.post('/upload', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return res.status(501).json({ error: err });
        }
        return res.json({ originalname: req.file.originalname, uploadname: req.file.filename });
    });
});

app.post('/download', function (req, res, next) {
    filepath = path.join(__dirname, '../uploads') + '/' + req.body.filename;
    res.sendFile(filepath);
});

io.on('connection', (socket) => {
    socket.on('create', function (room) {
        if (allClients[room] = (allClients[room] || 0) + 1 < 2);
            socket.join(room);
    });

    socket.on('leave', function (room) {
        console.log("Left" + room)
        socket.leave(room);
    })

    socket.on('message', (msg, sender, receiver, room) => {
        let chatMessage = new Chat({ message: msg, sender: sender, receiver: receiver, room: room});
        chatMessage.save();

        socket.broadcast.in(room).emit('message-broadcast', chatMessage);
    });

    socket.on('userforms', (data, sender, receiver, room) => {
        socket.broadcast.in(room).emit('userforms-broadcast', data);
    });

    socket.on('disconnect', () => {
    });
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});

let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            res.status(401).send(err);
        } else {
            req.user_id = decoded._id;
            next();
        }
    });
}

let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-refresh-token');
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            next();
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

app.get('/userForms', authenticate, (req, res) => {
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.post('/userForm', authenticate, (req, res) => {

    let weight_start = req.body.weight_start;
    let body_temperature = req.body.body_temperature;
    let sbp = req.body.sbp;
    let dbp = req.body.dbp;
    let dia_temp_value = req.body.dia_temp_value;
    let conductivity = req.body.conductivity;
    let uf = req.body.uf;
    let blood_flow = req.body.blood_flow;
    let dialysis_time = req.body.dialysis_time;
    let datetime = req.body.datetime;
    let result_sbp = req.body.result_sbp;
    let result_dbp = req.body.result_dbp;

    let newList = new List({
        weight_start,
        body_temperature,
        sbp,
        dbp,
        dia_temp_value,
        conductivity,
        uf,
        blood_flow,
        dialysis_time,
        datetime,
        result_sbp,
        result_dbp,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        res.send(listDoc);
    }).catch((e) => {
        console.log(e);
        res.status(400).send(e);
    });
});

app.patch('/lists/:id', authenticate, (req, res) => {
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id},  {
        weight_start: 0,
        datetime: 0,
        sbp: 0,
        dbp: 0,
        dia_temp_value: 0,
        conductivity: 0,
        uf: 0,
        blood_flow: 0,
        dialysis_time: 0,
        datetime: 0,
        result_sbp: 0,
        result_dbp: 0,
    }).then(() => {
        res.send({ 'message': 'updated successfully' });
    });
});

app.delete('/lists/:id', authenticate, (req, res) => {

    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);
        deleteTasksFromList(removedListDoc._id);
    })
});

app.get('/userSignUpForm', authenticate, (req, res) => {
    UserSignUpForm.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.get('/lekarzSignUpForm', authenticate, (req, res) => {
    LekarzSignUpForm.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.post('/userSignUpForm', authenticate, (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let gender = req.body.gender;
    let birthday = req.body.birthday;
    let firstDialysis = req.body.firstDialysis;
    let diabetes = req.body.diabetes;
    let patient = req.body.patient;
    let lekarz = req.body.lekarz;
    let cityOfInterest = req.body.cityOfInterest;
    let dayOfInterest = req.body.dayOfInterest;

    let newUserSignUpForm = new UserSignUpForm({
        email,
        password,
        gender,
        birthday,
        firstDialysis,
        diabetes,
        patient,
        lekarz,
        cityOfInterest,
        dayOfInterest,
        _userId: req.user_id
    });
    newUserSignUpForm.save().then((listDoc) => {
        res.send(listDoc);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.post('/lekarzSignUpForm', authenticate, (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let gender = req.body.gender;
    let birthday = req.body.birthday;
    let patient = req.body.patient;
    let patientsList = req.body.patientsList;
    let cityOfInterest = req.body.cityOfInterest;
    let dayOfInterest = req.body.dayOfInterest;

    let newLekarzSignUpForm = new LekarzSignUpForm({
        email,
        password,
        gender,
        birthday,
        patient,
        patientsList,
        cityOfInterest,
        dayOfInterest,
        _userId: req.user_id
    });
    newLekarzSignUpForm.save().then((listDoc) => {
        res.send(listDoc);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.patch('/userSignUpForm/:id', authenticate, (req, res) => {
    UserSignUpForm.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'User updated successfully' });
    });
});

app.patch('/lekarzSignUpForm/:id', authenticate, (req, res) => {
    LekarzSignUpForm.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'Lekarz updated successfully' });
    });
});

app.post('/users', (req, res) => {
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        return newUser.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
 })

app.get('/usersList', function (req, res) {
    User.find({}, function (err, users) {
        var userMap = {};

        users.forEach(function (user) {
            userMap[user._id] = user.email + " " + user.password + " " + user.patient;
        });

        res.send(userMap);
    });
});

app.get('/doctorsList/:id', function (req, res) {
    var lekarzMap = []
    if (req.params.id == 1) {
        LekarzSignUpForm.find({
        }).then((lists) => {
            lists.forEach(function (lekarz) {
                lekarzMap.push({
                    id: lekarz.id,
                    email: lekarz.email
                });
            });

            res.send(lekarzMap);
        }).catch((e) => {
            res.send(e);
        });
    }
    else {
        UserSignUpForm.find({
        }).then((lists) => {
            lists.forEach(function (lekarz) {
                lekarzMap.push({
                    id: lekarz.id,
                    email: lekarz.email,
                    gender: lekarz.gender,
                    birthday: lekarz.birthday,
                    firstDialysis: lekarz.firstDialysis,
                    diabetes: lekarz.diabetes,
                });
            });

            res.send(lekarzMap);
        }).catch((e) => {
            res.send(e);
        });
    }
});

app.get('/messagesList2', function (req, res) {
    Chat.find({}, function (err, msgs) {
        var msgMap = {};

        msgs.forEach(function (msg) {
            msgMap[msg.message] += msg.sender + " " + msg.receiver;
        });

        res.send(msgMap);
    });
});

app.get('/messagesList/:room', (req, res, sender) => {
    Chat.find({
        room: req.params.room
    }).then(chat => {
       res.json(chat);
   });
});

app.get('/userFormList/:userEmail', (req, res, sender) => {
    Chat.find({
        room: req.params.room
    }).then(chat => {
        res.json(chat);
    });
});

app.delete('/usersList', (req, res) => {
    User.deleteMany().then(() => {
        res.send("All users were deleted");
    });
});

app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            
            return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
        console.log("Error in /users/login");
    });
})

app.patch('/user/:id', authenticate, (req, res) => {

    let costFactor = 10;

    bcrypt.genSalt(costFactor, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            req.body.password = hash;

    User.findOneAndUpdate({ _id: req.params.id}, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': req.body });
    });

        })
    })
});


app.get('/users/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})


let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from " + _listId + " were deleted!");
    })
}


port = process.env.PORT || 8080;
http.listen(port, () => {
    console.log('listening on: ' + port);
});


  //require('dotenv').config();
  /*mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
    .then(() => console.log('DB connected'))
    .catch(err => console.log(err));*/