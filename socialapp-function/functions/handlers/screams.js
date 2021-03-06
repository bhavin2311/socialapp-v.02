const { db } = require('../util/admin');

exports.getAllScreams = (request, response) => {
    db.collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    commentCount: doc.data().commentCount,
                    likeCount: doc.data().likeCount,
                    userImage: doc.data().userImage,
                });
            });

            return response.json(screams);
        })
        .catch((err) => console.error(err));
};

exports.postOneScream = (request, response) => {
    if (request.body.body.trim() === '') {
        return response.status(400).json({ body: 'body Must not be empty' });
    }

    const newScream = {
        body: request.body.body,
        userHandle: request.user.handle,
        userImage: request.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    };
    db.collection('screams')
        .add(newScream)
        .then((doc) => {
            const responseScream = newScream;
            responseScream.screamId = doc.id;

            response.json(responseScream);
        })
        .catch((err) => {
            response.status(500).json({ error: 'something went wrong' });
            console.error(err);
        });
};
//Get All Scream Data With Comments
exports.getScream = (request, response) => {
    let screamData = {};

    db.doc('/screams/' + request.params.screamId)
        .get()
        .then((data) => {
            if (!data.exists) {
                return response.status(400).json({ error: 'Scream not found' });
            }
            screamData = data.data();
            screamData.screamId = data.id;

            return db
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', request.params.screamId)
                .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data());
            });

            return response.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        });
};
//comment on scream
exports.commentOnScream = (request, response) => {
    if (request.body.body.trim() === '')
        return response
            .status(400)
            .json({ comment: 'Comment must not be null' });

    const newComment = {
        body: request.body.body,
        createdAt: new Date().toISOString(),
        screamId: request.params.screamId,
        userHandle: request.user.handle,
        userImage: request.user.imageUrl,
    };

    db.doc('/screams/' + request.params.screamId)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }
            return doc.ref.update({
                commentCount: doc.data().commentCount + 1,
            });
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            response.json(newComment);
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        });
};
//like on scream
exports.likeScream = (request, response) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId)
        .limit(1);

    const screamDocument = db.doc('/screams/' + request.params.screamId);

    let screamData;

    screamDocument
        .get()
        .then((doc) => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return response.status(400).json({ error: 'scream not found' });
            }
        })
        .then((data) => {
            if (data.empty) {
                return db
                    .collection('likes')
                    .add({
                        screamId: request.params.screamId,
                        userHandle: request.user.handle,
                    })
                    .then(() => {
                        screamData.likeCount++;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    .then(() => {
                        return response.json(screamData);
                    });
            } else {
                return response
                    .status(400)
                    .json({ error: 'scream already like' });
            }
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        });
};

//unlike on scream
exports.unlikeScream = (request, response) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId)
        .limit(1);

    const screamDocument = db.doc('/screams/' + request.params.screamId);

    let screamData;

    screamDocument
        .get()
        .then((doc) => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return response.status(400).json({ error: 'scream not found' });
            }
        })
        .then((data) => {
            if (data.empty) {
                return response
                    .status(400)
                    .json({ error: 'scream not  liked' });
            } else {
                return db
                    .doc('/likes/' + data.docs[0].id)
                    .delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    .then(() => {
                        response.json(screamData);
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

//delete
exports.deleteScream = (request, response) => {
    const document = db.doc('/screams/' + request.params.screamId);

    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }
            if (doc.data().userHandle !== request.user.handle) {
                return response.status(403).json({ error: 'Unauthorized' });
            } else {
                return document.delete();
            }
        })
        .then(() => {
            response.json({ message: 'scream delete successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};
