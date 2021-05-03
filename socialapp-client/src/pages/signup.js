import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AppIcon from '../images/favicon.ico';
import { Link } from 'react-router-dom';
//MUI Stuff
import withStyles from '@material-ui/core/styles/withStyles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

//Redux
import { connect } from 'react-redux';
import { signupUser } from '../redux/actions/userActions';
// const style = {
//     form: {
//         textAlign: 'center',
//     },
//     image: {
//         margin: '20px auto 20px auto',
//     },
//     pageTitle: {
//         margin: '10px auto 10px auto',
//     },
//     textField: {
//         margin: '10px auto 10px auto',
//     },
//     button: {
//         marginTop: '10px',
//         position: 'relative',
//     },
//     customError: {
//         color: 'red',
//         fontSize: '0.8rem',
//         marginTop: 10,
//     },
//     progress: {
//         position: 'absolute',
//     },
// };
const styles = (theme) => ({
    ...theme.spreadThis,
});
class signup extends Component {
    constructor() {
        super();
        this.state = {
            email: '',
            password: '',
            confirmPassword: '',
            handle: '',
            errors: {},
        };
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.UI.errors) {
            this.setState({ errors: nextProps.UI.errors });
        }
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ loading: true });
        const newUserData = {
            email: this.state.email,
            password: this.state.password,
            confirmPassword: this.state.confirmPassword,
            handle: this.state.handle,
        };
        this.props.signupUser(newUserData, this.props.history);
    };

    handleChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value,
        });
    };

    render() {
        const {
            classes,
            UI: { loading },
        } = this.props;
        const { errors } = this.state;
        return (
            <Grid container className={classes.form}>
                <Grid item sm></Grid>
                <Grid item sm>
                    <img src={AppIcon} alt='Monkey' className={classes.image} />
                    <Typography variant='h2' className={classes.pageTitle}>
                        Sign Up
                    </Typography>
                    <form action='' noValidate onSubmit={this.handleSubmit}>
                        <TextField
                            id='email'
                            name='email'
                            type='email'
                            label='Email'
                            className={classes.TextField}
                            value={this.state.email}
                            onChange={this.handleChange}
                            fullWidth
                            helperText={errors.email}
                            error={errors.email ? true : false}
                        ></TextField>
                        <TextField
                            id='password'
                            name='password'
                            type='password'
                            label='Password'
                            className={classes.TextField}
                            value={this.state.password}
                            onChange={this.handleChange}
                            fullWidth
                            helperText={errors.password}
                            error={errors.password ? true : false}
                        ></TextField>
                        <TextField
                            id='confirmPassword'
                            name='confirmPassword'
                            type='password'
                            label='Confirm Password'
                            className={classes.TextField}
                            value={this.state.confirmPassword}
                            onChange={this.handleChange}
                            fullWidth
                            helperText={errors.confirmPassword}
                            error={errors.confirmPassword ? true : false}
                        ></TextField>
                        <TextField
                            id='handle'
                            name='handle'
                            type='text'
                            label='Handle'
                            className={classes.TextField}
                            value={this.state.handle}
                            onChange={this.handleChange}
                            fullWidth
                            helperText={errors.handle}
                            error={errors.handle ? true : false}
                        ></TextField>
                        {errors.general && (
                            <Typography
                                variant='body2'
                                className={classes.customError}
                            >
                                {errors.general}
                            </Typography>
                        )}
                        <Button
                            color='primary'
                            type='submit'
                            variant='contained'
                            className={classes.button}
                            disabled={loading}
                        >
                            SignUp
                            {loading && (
                                <CircularProgress
                                    color='primary'
                                    className={classes.progress}
                                    size={30}
                                ></CircularProgress>
                            )}
                        </Button>
                        <br />
                        <small>
                            already have account ? login
                            <Link to='/login'> here</Link>
                        </small>
                    </form>
                </Grid>
                <Grid item sm></Grid>
            </Grid>
        );
    }
}
signup.propTypes = {
    classes: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    UI: PropTypes.object.isRequired,
    signupUser: PropTypes.func.isRequired,
};
const mapStateToProps = (state) => ({
    user: state.user,
    UI: state.UI,
});

export default connect(mapStateToProps, { signupUser })(
    withStyles(styles)(signup)
);
