import { useState } from 'react';

const useForm = () => {
    const [inputValues, setInputValues] = useState({});

    const handleInputValues = (e) => {
        const { name, value } = e.target;

        setInputValues((prevValues) => {
            return {
                ...prevValues,
                [name]: value
            };
        });
    };

    const resetForm = () => setInputValues({});

    return { inputValues, handleInputValues, resetForm };
};

export default useForm;
