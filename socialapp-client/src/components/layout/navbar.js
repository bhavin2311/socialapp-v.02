import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@material-ui/core';
import PropType from 'prop-types';
import PostScream from '../scream/PostScream';
//Redux
import { connect } from 'react-redux';
import MyButton from '../../util/MyButton';
//Icon

import HomeIcon from '@material-ui/icons/Home';
import NotificationsIcon from '@material-ui/icons/Notifications';

class navbar extends Component {
    render() {
        const { authenticated } = this.props;

        return (
            <AppBar position='fixed'>
                <Toolbar className='nav-container'>
                    {authenticated ? (
                        <Fragment>
                            <PostScream />
                            <Link to='/'>
                                <MyButton tip='Home'>
                                    <HomeIcon color='primary'></HomeIcon>
                                </MyButton>
                            </Link>
                            <MyButton tip='Notifications'>
                                <NotificationsIcon color='primary'></NotificationsIcon>
                            </MyButton>
                        </Fragment>
                    ) : (
                        <Fragment>
                            <Button color='inherit' component={Link} to='/'>
                                Home
                            </Button>
                            <Button
                                color='inherit'
                                component={Link}
                                to='/login'
                            >
                                Login
                            </Button>
                            <Button
                                color='inherit'
                                component={Link}
                                to='/signup'
                            >
                                SignUp
                            </Button>
                        </Fragment>
                    )}
                </Toolbar>
            </AppBar>
        );
    }
}
navbar.propTypes = {
    authenticated: PropType.bool.isRequired,
};
const mapStateToProps = (state) => ({
    authenticated: state.user.authenticated,
});
export default connect(mapStateToProps)(navbar);
