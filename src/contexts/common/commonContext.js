import { createContext, useReducer, useEffect, useCallback, useState } from 'react';
import commonReducer from './commonReducer';
import { getMe, signOut as apiSignOut } from '../../services/authApi';

// Common-Context
const commonContext = createContext();

// Initial State
const initialState = {
    isFormOpen: false,
    accountFormMode: 'login',
    formUserInfo: '',
    isSearchOpen: false,
    searchResults: []
};

function displayNameFromUser(user) {
    if (!user) return '';
    const n = user.name && String(user.name).trim();
    if (n) return n;
    if (user.email) return String(user.email).split('@')[0];
    return '';
}

// Common-Provider Component
const CommonProvider = ({ children }) => {

    const [state, dispatch] = useReducer(commonReducer, initialState);
    const [authSessionChecked, setAuthSessionChecked] = useState(false);

    // Form actions
    const toggleForm = (toggle) => {
        return dispatch({
            type: 'TOGGLE_FORM',
            payload: { toggle }
        });
    };

    const openAccountForm = useCallback((mode = 'login') => {
        dispatch({
            type: 'OPEN_ACCOUNT_FORM',
            payload: { mode: mode === 'signup' ? 'signup' : 'login' },
        });
    }, []);

    const setFormUserInfo = (info) => {
        return dispatch({
            type: 'SET_FORM_USER_INFO',
            payload: { info }
        });
    };

    const refreshSession = useCallback(async () => {
        try {
            const data = await getMe();
            const label = displayNameFromUser(data.user);
            dispatch({
                type: 'SET_FORM_USER_INFO',
                payload: { info: label }
            });
        } catch {
            dispatch({
                type: 'SET_FORM_USER_INFO',
                payload: { info: '' }
            });
        } finally {
            setAuthSessionChecked(true);
        }
    }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const signOutUser = useCallback(async () => {
        try {
            await apiSignOut();
        } catch {
            // still clear local greeting if cookie clear failed
        } finally {
            dispatch({
                type: 'SET_FORM_USER_INFO',
                payload: { info: '' }
            });
        }
    }, []);

    // Search actions
    const toggleSearch = (toggle) => {
        return dispatch({
            type: 'TOGGLE_SEARCH',
            payload: { toggle }
        });
    };

    const setSearchResults = (results) => {
        return dispatch({
            type: 'SET_SEARCH_RESULTS',
            payload: { results }
        });
    };

    // Context values
    const values = {
        ...state,
        authSessionChecked,
        toggleForm,
        openAccountForm,
        setFormUserInfo,
        refreshSession,
        signOutUser,
        toggleSearch,
        setSearchResults
    };

    return (
        <commonContext.Provider value={values}>
            {children}
        </commonContext.Provider>
    );
};

export default commonContext;
export { CommonProvider };
