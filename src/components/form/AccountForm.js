import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import commonContext from '../../contexts/common/commonContext';
import useForm from '../../hooks/useForm';
import useOutsideClose from '../../hooks/useOutsideClose';
import useScrollDisable from '../../hooks/useScrollDisable';
import { signIn, signUp } from '../../services/authApi';

function displayNameFromUser(user) {
    if (!user) return '';
    const n = user.name && String(user.name).trim();
    if (n) return n;
    if (user.email) return String(user.email).split('@')[0];
    return '';
}

const AccountForm = () => {

    const { isFormOpen, accountFormMode, toggleForm, setFormUserInfo, refreshSession } = useContext(commonContext);
    const { inputValues, handleInputValues, resetForm } = useForm();

    const formRef = useRef();

    useOutsideClose(formRef, () => {
        toggleForm(false);
    });

    useScrollDisable(isFormOpen);

    const [isSignupVisible, setIsSignupVisible] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    useEffect(() => {
        if (isFormOpen) {
            setIsSignupVisible(accountFormMode === 'signup');
            setError('');
        } else {
            setPasswordVisible(false);
            setConfirmPasswordVisible(false);
        }
    }, [isFormOpen, accountFormMode]);

    const handleIsSignupVisible = () => {
        setIsSignupVisible(prevState => !prevState);
        setError('');
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const email = (inputValues.mail || '').trim();
        const password = inputValues.password || '';

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        if (isSignupVisible) {
            // const name = (inputValues.username || '').trim();
            const conf = inputValues.conf_password || '';
            if (password !== conf) {
                setError('Passwords do not match.');
                return;
            }
            if (password.length < 8) {
                setError('Password must be at least 8 characters.');
                return;
            }
        }

        setSubmitting(true);
        try {
            if (isSignupVisible) {
                const name = (inputValues.username || '').trim();
                const { user } = await signUp({
                    email,
                    password,
                    name,
                });
                setFormUserInfo(displayNameFromUser(user));
            } else {
                const { user } = await signIn({ email, password });
                setFormUserInfo(displayNameFromUser(user));
            }
            resetForm();
            toggleForm(false);
            await refreshSession();
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <>
            {
                isFormOpen && (
                    <div className="backdrop">
                        <div className="modal_centered">
                            <form id="account_form" ref={formRef} onSubmit={handleAuthSubmit}>

                                {/*===== Form-Header =====*/}
                                <div className="form_head">
                                    <h2>{isSignupVisible ? 'Signup' : 'Login'}</h2>
                                    <p>
                                        {isSignupVisible ? 'Already have an account ?' : 'New to X-Beat ?'}
                                        &nbsp;&nbsp;
                                        <button type="button" onClick={handleIsSignupVisible}>
                                            {isSignupVisible ? 'Login' : 'Create an account'}
                                        </button>
                                    </p>
                                </div>

                                {/*===== Form-Body =====*/}
                                <div className="form_body">
                                    {error && (
                                        <p className="input_box" style={{ color: '#c0392b', fontSize: '0.9rem' }}>
                                            {error}
                                        </p>
                                    )}
                                    {
                                        isSignupVisible && (
                                            <div className="input_box">
                                                <input
                                                    type="text"
                                                    name="username"
                                                    className="input_field"
                                                    value={inputValues.username || ''}
                                                    onChange={handleInputValues}
                                                    autoComplete="name"
                                                />
                                                <label className="input_label">Name (optional)</label>
                                            </div>
                                        )
                                    }

                                    <div className="input_box">
                                        <input
                                            type="email"
                                            name="mail"
                                            className="input_field"
                                            value={inputValues.mail || ''}
                                            onChange={handleInputValues}
                                            required
                                            autoComplete="email"
                                        />
                                        <label className="input_label">Email</label>
                                    </div>

                                    <div className="input_box input_box--password">
                                        <input
                                            type={passwordVisible ? 'text' : 'password'}
                                            name="password"
                                            className="input_field"
                                            value={inputValues.password || ''}
                                            onChange={handleInputValues}
                                            required
                                            autoComplete={isSignupVisible ? 'new-password' : 'current-password'}
                                        />
                                        <label className="input_label">Password</label>
                                        <button
                                            type="button"
                                            className="password_toggle"
                                            onClick={() => setPasswordVisible((v) => !v)}
                                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                                        >
                                            {passwordVisible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                                        </button>
                                    </div>

                                    {
                                        isSignupVisible && (
                                            <div className="input_box input_box--password">
                                                <input
                                                    type={confirmPasswordVisible ? 'text' : 'password'}
                                                    name="conf_password"
                                                    className="input_field"
                                                    value={inputValues.conf_password || ''}
                                                    onChange={handleInputValues}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <label className="input_label">Confirm Password</label>
                                                <button
                                                    type="button"
                                                    className="password_toggle"
                                                    onClick={() => setConfirmPasswordVisible((v) => !v)}
                                                    aria-label={confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
                                                >
                                                    {confirmPasswordVisible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                                                </button>
                                            </div>
                                        )
                                    }

                                    <button
                                        type="submit"
                                        className="btn login_btn"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Please wait…' : (isSignupVisible ? 'Signup' : 'Login')}
                                    </button>

                                </div>

                                {/*===== Form-Footer =====*/}
                                <div className="form_foot">
                                    <p>or login with</p>
                                    <div className="login_options">
                                        <Link to="/">Facebook</Link>
                                        <Link to="/">Google</Link>
                                        <Link to="/">Twitter</Link>
                                    </div>
                                </div>

                                {/*===== Form-Close-Btn =====*/}
                                <div
                                    className="close_btn"
                                    title="Close"
                                    onClick={() => toggleForm(false)}
                                >
                                    &times;
                                </div>

                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default AccountForm;
