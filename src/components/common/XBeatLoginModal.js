import React, { useContext } from 'react';
import commonContext from '../../contexts/common/commonContext';
import useScrollDisable from '../../hooks/useScrollDisable';

const XBeatLoginModal = () => {
    const {
        authSessionChecked,
        formUserInfo,
        isFormOpen,
        openAccountForm,
    } = useContext(commonContext);

    const visible = authSessionChecked && !formUserInfo && !isFormOpen;

    useScrollDisable(visible);

    if (!visible) {
        return null;
    }

    return (
        <div className="backdrop" role="dialog" aria-modal="true" aria-labelledby="xbeat-guest-modal-title">
            <div className="modal_centered">
                <div className="xbeat_guest_modal">
                    <h2 id="xbeat-guest-modal-title">Sign in or create an account</h2>
                    <p>
                        X-Beat cross-platform listings, demand insights, and price tools are only available
                        after you sign in. Please choose an option below to continue.
                    </p>
                    <div className="xbeat_guest_modal__actions">
                        <button
                            type="button"
                            className="xbeat_guest_modal__primary"
                            onClick={() => openAccountForm('login')}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            className="xbeat_guest_modal__outline"
                            onClick={() => openAccountForm('signup')}
                        >
                            Create account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XBeatLoginModal;
