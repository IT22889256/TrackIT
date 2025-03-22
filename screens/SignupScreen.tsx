import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type SignupScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Signup'
>;

type Props = {
    navigation: SignupScreenNavigationProp;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordInputRef = useRef<TextInput>(null);

    // Real-time validation effects
    useEffect(() => {
        if (nameFocused && !name.trim()) {
            setNameError('Name is required');
        } else {
            setNameError('');
        }
    }, [name, nameFocused]);

    useEffect(() => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (emailFocused && !email.trim()) {
            setEmailError('Email is required');
        } else if (emailFocused && !emailRegex.test(email)) {
            setEmailError('Invalid email address');
        } else {
            setEmailError('');
        }
    }, [email, emailFocused]);

    useEffect(() => {
        if (passwordFocused) {
            const passwordValidation = validatePassword(password);
            setPasswordError(passwordValidation);
        } else {
            setPasswordError('');
        }
    }, [password, passwordFocused]);

    useEffect(() => {
        if (confirmPasswordFocused && !confirmPassword.trim()) {
            setConfirmPasswordError('Confirm password is required');
        } else if (confirmPasswordFocused && confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    }, [confirmPassword, password, confirmPasswordFocused]);

    const handleSignup = async () => {
        let hasErrors = false;

        if (!name.trim()) {
            setNameError('Name is required');
            hasErrors = true;
        }
        if (!email.trim()) {
            setEmailError('Email is required');
            hasErrors = true;
        }
        if (!password.trim()) {
            setPasswordError('Password is required');
            hasErrors = true;
        }
        if (!confirmPassword.trim()) {
            setConfirmPasswordError('Confirm password is required');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Passwords do not match');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (passwordValidation) {
            setPasswordError(passwordValidation);
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
            });

            navigation.navigate('Main');
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter.';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one number.';
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return 'Password must contain at least one special character.';
        }
        return '';
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Create an Account</Text>

                <TextInput
                    style={[
                        styles.input,
                        nameFocused && styles.inputFocused,
                        nameError && styles.inputError,
                    ]}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                />
                {nameError && <Text style={styles.errorText}>{nameError}</Text>}

                <TextInput
                    style={[
                        styles.input,
                        emailFocused && styles.inputFocused,
                        emailError && styles.inputError,
                    ]}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                />
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            styles.passwordInput,
                            passwordFocused && styles.inputFocused,
                            passwordError && styles.inputError,
                        ]}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!passwordVisible}
                        ref={passwordInputRef}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                        <Ionicons
                            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                <TextInput
                    style={[
                        styles.input,
                        confirmPasswordFocused && styles.inputFocused,
                        confirmPasswordError && styles.inputError,
                    ]}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!passwordVisible}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                />
                {confirmPasswordError && (
                    <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignup}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    inputFocused: {
        borderColor: '#6750A4',
        shadowColor: '#6750A4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    inputError: {
        borderColor: '#ff4444',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        position: 'relative',
    },
    passwordInput: {
        flex: 1,
    },
    passwordToggle: {
        position: 'absolute',
        right: 15,
        top: 15,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#6750A4',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        fontSize: 16,
        color: '#666',
    },
    loginLink: {
        fontSize: 16,
        color: '#6750A4',
        fontWeight: 'bold',
        marginLeft: 5,
    },
});

export default SignupScreen;