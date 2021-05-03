const functions = require('firebase-functions');
const app = require('express')();
const cors = require('cors');
app.use(cors());
const { db } = require('./util/admin');
const {
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream,
} = require('./handlers/screams');
const {
    signUp,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getOtherUserDetails,
    markNotificationsRead,
} = require('./handlers/users');

//Middleware For Authentication
const FBAuth = require('./util/FBAuth');
//Get All Screams
app.get('/screams', getAllScreams);
//Create Scream
app.post('/scream', FBAuth, postOneScream);
//Get All Scream Data with comments
app.get('/scream/:screamId', getScream);
//Comment on Particular Scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
//delete scream
app.delete('/scream/:screamId', FBAuth, deleteScream);
//like a scream
app.get('/scream/:screamId/like', FBAuth, likeScream);
//unlike a scram
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

//Sign up
app.post('/signup', signUp);
//login
app.post('/login', login);
//Uploda Image
app.post('/user/image', FBAuth, uploadImage);
//Add UserDetails like bio,website,location
app.post('/user/', FBAuth, addUserDetails);
//Get All Details of user with likes
app.get('/user', FBAuth, getAuthenticatedUser);

//Get Other user
app.get('/user/:handle', getOtherUserDetails);
//Notification
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);
//Notification on Like
exports.createNotificationOnLike = functions.firestore
    .document('likes/{id}')
    .onCreate((snapshot) => {
        return db
            .doc('/screams/' + snapshot.data().screamId)
            .get()
            .then((doc) => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
                    return db
                        .doc('/notifications/' + snapshot.id)
                        .set({
                            createdAt: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'like',
                            read: 'false',
                            screamId: doc.id,
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                }
            });
    });
//Notification on Unlike
exports.deleteNotificationOnUnlike = functions.firestore
    .document('likes/{id}')
    .onDelete((snapshot) => {
        return db
            .doc('/notifications/' + snapshot.id)
            .delete()

            .catch((err) => {
                console.error(err);
                return;
            });
    });
//Notification on Comment
exports.createNotificationOnComment = functions.firestore
    .document('comments/{id}')
    .onCreate((snapshot) => {
        return db
            .doc('/screams/' + snapshot.data().screamId)
            .get()
            .then((doc) => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
                    return db
                        .doc('/notifications/' + snapshot.id)
                        .set({
                            createdAt: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'comment',
                            read: 'false',
                            screamId: doc.id,
                        })
                        .catch((err) => {
                            console.error(err);
                            return;
                        });
                }
            });
    });

exports.onUserImageChange = functions.firestore
    .document('/users/{userIs}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            let batch = db.batch();
            return db
                .collection('screams')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then((data) => {
                    data.forEach((doc) => {
                        const scream = db.doc('/screams/' + doc.id);
                        batch.update(scream, {
                            userImage: change.after.data().imageUrl,
                        });
                    });
                    return batch.commit();
                });
        } else {
            return true;
        }
    });

exports.onScreamDelete = functions.firestore
    .document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();

        return db
            .collection('comments')
            .where('screamId', '==', screamId)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc('/comments/' + doc.id));
                });
                return db
                    .collection('likes')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc('/likes/' + doc.id));
                });
                return db
                    .collection('notifications')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc('/notifications/' + doc.id));
                });
                return batch.commit();
            })
            .catch((err) => {
                console.error(err);
            });
    });
