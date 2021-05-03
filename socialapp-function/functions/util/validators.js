//Function
//Checking Empty
const isEmpty = (string) => {
    if (string.trim() == '') {
        return true;
    } else {
        return false;
    }
};
//Email valid
const isEmail = (email) => {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (email.match(regex)) {
        return true;
    } else {
        return false;
    }
};

exports.validateSignupData = (newUser) => {
    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Must not empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be valid email address';
    }

    if (isEmpty(newUser.password)) errors.password = 'Must not empty';

    if (isEmpty(newUser.handle)) errors.handle = 'Must not empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

exports.validateLoginData = (user) => {
    let errors = {};
    if (isEmpty(user.email)) {
        errors.email = 'Must not Empty';
    }
    if (isEmpty(user.password)) {
        errors.password = 'Must not Empty';
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if (!isEmpty(data.bio.trim())) {
        userDetails.bio = data.bio;
    }
    if (!isEmpty(data.website.trim())) {
        if (data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = 'https://' + data.website.trim();
        } else {
            userDetails.website = data.website;
        }
    }
    if (!isEmpty(data.location.trim())) {
        userDetails.location = data.location.trim();
    }

    return userDetails;
};
