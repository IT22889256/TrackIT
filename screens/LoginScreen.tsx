import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp } from 'react-native-reanimated';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
    navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    const handleLogin = async () => {
        let hasErrors = false;

        if (!email.trim()) {
            setEmailError('Email is required');
            hasErrors = true;
        }
        if (!password.trim()) {
            setPasswordError('Password is required');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            //const user = userCredential.user;  // No need to use it.
            navigation.navigate('Main');
            setMessage(null);
        } catch (error: any) {
            let errorMessage = "Login failed. Please check your credentials.";
            // if (error.code === 'auth/user-not-found') {
            //     errorMessage = 'There is no account for this email.'; // Changed message here
            // } else if (error.code === 'auth/wrong-password') {
            //     errorMessage = 'Incorrect password.';
            // } else if (error.code === 'auth/too-many-requests') {
            //     errorMessage = 'Too many failed login attempts. Please try again later.';
            // }
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

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
        if (passwordFocused && !password.trim()) {
            setPasswordError('Password is required');
        } else if (passwordFocused && password.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
        } else {
            setPasswordError('');
        }
    }, [password, passwordFocused]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Login</Text>

                <TextInput
                    style={[
                        styles.input,
                        emailFocused && styles.inputFocused,
                        emailError && styles.inputError,
                    ]}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            { flex: 1 },
                            passwordFocused && styles.inputFocused,
                            passwordError && styles.inputError,
                        ]}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        style={styles.passwordVisibilityButton}
                        onPress={togglePasswordVisibility}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                    <Text style={styles.loginText}>
                        Don't have an account?
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.loginLink}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>

                {message && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(300)}
                        style={[
                            styles.messageContainer,
                            message.type === 'error' && styles.error,
                            message.type === 'success' && styles.success,
                            message.type === 'info' && styles.info,
                        ]}
                    >
                        <Text style={styles.messageText}>{message.text}</Text>
                    </Animated.View>
                )}
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
    passwordVisibilityButton: {
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
    signupContainer: {
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
    messageContainer: {
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    error: {
        backgroundColor: '#ff4444',
    },
    success: {
        backgroundColor: '#4CAF50',
    },
    info: {
        backgroundColor: '#2196F3',
    },
});

export default LoginScreen;
