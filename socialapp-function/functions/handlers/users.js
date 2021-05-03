const { db, admin } = require('../util/admin');
const config = require('../util/config');
const {
    validateSignupData,
    validateLoginData,
    reduceUserDetails,
} = require('../util/validators');
const firebase = require('firebase');

firebase.initializeApp(config);
//User SignUp
exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    const { errors, valid } = validateSignupData(newUser);

    if (!valid) {
        return res.status(400).json(errors);
    }

    const noImg =
        'https://firebasestorage.googleapis.com/v0/b/' +
        config.storageBucket +
        '/o/new-tick.png?alt=media';
    let token, userId;
    db.doc('/users/' + newUser.handle)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ handle: ' this handle is already Taken' });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                imageUrl: noImg,
                createdAt: new Date().toISOString(),

                userId,
            };

            return db.doc('/users/' + newUser.handle).set(userCredentials);
        })
        .then((data) => {
            return res.status(201).json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res
                    .status(400)
                    .json({ email: 'Email is already in use' });
            } else {
                return res.status(500).json({
                    general: 'Something went wrong , please try again',
                });
            }
        });
};
//User Login
exports.login = (req, res) => {
    const User = {
        email: req.body.email,
        password: req.body.password,
    };

    const { errors, valid } = validateLoginData(User);

    if (!valid) {
        return res.status(400).json(errors);
    }

    firebase
        .auth()
        .signInWithEmailAndPassword(User.email, User.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return res.json({ token });
        })
        .catch((err) => {
            console.error(err.code);
            res.status(403).json({
                general: 'Wrong credentials,please try again',
            });
        });
};
//Upload Profile Image for user
exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: request.headers });

    let imageToBeUploaded = {};
    let imageFileName;
    busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
        if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
            return response.status(400).json({ error: 'Wrong file type' });
        }
        const imageExtension = filename.split('.')[
            filename.split('.').length - 1
        ];

        imageFileName =
            Math.round(Math.random() * 100000000000) + '.' + imageExtension;

        const filepath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = { filepath, mimeType };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimeType,
                    },
                },
            })
            .then(() => {
                const imageUrl =
                    'https://firebasestorage.googleapis.com/v0/b/' +
                    config.storageBucket +
                    '/o/' +
                    imageFileName +
                    '?alt=media';
                return db
                    .doc('/users/' + request.user.handle)
                    .update({ imageUrl });
            })
            .then(() => {
                return response.json({
                    message: 'Image uploaded successfully',
                });
            })
            .catch((err) => {
                console.error(err);

                return response.status(500).json({ error: err.code });
            });
    });

    busboy.end(request.rawBody);
};
//Add User Details
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);

    db.doc('/users/' + request.user.handle)
        .update(userDetails)
        .then(() => {
            return response.json({ message: 'details add successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};
//Get user details

exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db
                    .collection('likes')
                    .where('userHandle', '==', req.user.handle)
                    .get();
            }
        })
        .then((data) => {
            userData.likes = [];
            data.forEach((doc) => {
                userData.likes.push(doc.data());
            });
            return db
                .collection('notifications')
                .where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        })
        .then((data) => {
            userData.notifications = [];
            data.forEach((doc) => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id,
                });
            });
            return res.json(userData);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};
//Get any  User Details
exports.getOtherUserDetails = (request, response) => {
    let userData = {};
    db.doc('/users/' + request.params.handle)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.user = doc.data();
                return db
                    .collection('screams')
                    .where('userHandle', '==', request.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return response.status(400).json({ error: 'User Not found' });
            }
        })
        .then((data) => {
            userData.screams = [];
            data.forEach((doc) => {
                userData.screams.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    screamId: doc.id,
                });
            });
            return response.json(userData);
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        });
};
//Notification For Backend
exports.markNotificationsRead = (request, response) => {
    let batch = db.batch();

    request.body.forEach((notificationId) => {
        const notification = db.doc('/notifications/' + notificationId);

        batch.update(notification, { read: true });
    });

    batch
        .commit()
        .then(() => {
            return response.json({ message: 'notification makred read' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};
