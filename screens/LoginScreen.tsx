import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView,
    Image,
    StatusBar,
    Dimensions
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    FadeIn, 
    FadeOut, 
    SlideInDown, 
    SlideOutUp,
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

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
    
    // Animation values
    const buttonScale = useSharedValue(1);
    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: buttonScale.value }]
        };
    });

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
            navigation.navigate('Main');
            setMessage(null);
        } catch (error: any) {
            let errorMessage = "Login failed. Please check your credentials.";
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
            setPasswordError('Password must be at least 6 characters long');
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

    const onPressIn = () => {
        buttonScale.value = withTiming(0.95, { duration: 200 });
    };

    const onPressOut = () => {
        buttonScale.value = withTiming(1, { duration: 200 });
    };

    return (
        <>
           <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? (isSmallScreen ? 20 : 0) : 20}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['#4A6FE5', '#6B8FF8']}
                                style={styles.logoBackground}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="person" size={32} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={[
                                styles.inputWrapper,
                                
                            ]}>
                                <Ionicons 
                                    name="mail-outline" 
                                    size={20} 
                                    color={emailFocused ? "#4A6FE5" : "#A0A0A0"} 
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your email address"
                                    placeholderTextColor="#A0A0A0"
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {emailError && (
                                <Animated.Text 
                                    entering={FadeIn.duration(200)} 
                                    style={styles.errorText}
                                >
                                    <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" /> {emailError}
                                </Animated.Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={[
                                styles.inputWrapper
                            ]}>
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={passwordFocused ? "#4A6FE5" : "#A0A0A0"} 
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your password"
                                    placeholderTextColor="#A0A0A0"
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.passwordVisibilityButton}
                                    onPress={togglePasswordVisibility}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#A0A0A0"
                                    />
                                </TouchableOpacity>
                            </View>
                            {passwordError && (
                                <Animated.Text 
                                    entering={FadeIn.duration(200)} 
                                    style={styles.errorText}
                                >
                                    <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" /> {passwordError}
                                </Animated.Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.forgotPasswordContainer}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={isLoading}
                                onPressIn={onPressIn}
                                onPressOut={onPressOut}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#4A6FE5', '#6B8FF8']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

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
                    </View>

                    {message && (
                        <Animated.View
                            entering={SlideInDown.duration(300)}
                            exiting={SlideOutUp.duration(300)}
                            style={[
                                styles.messageContainer,
                                message.type === 'error' && styles.error,
                                message.type === 'success' && styles.success,
                                message.type === 'info' && styles.info,
                            ]}
                        >
                            <Ionicons 
                                name={message.type === 'error' ? 'close-circle' : 'checkmark-circle'} 
                                size={20} 
                                color="#FFFFFF" 
                                style={styles.messageIcon}
                            />
                            <Text style={styles.messageText}>{message.text}</Text>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: isSmallScreen ? 16 : 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBackground: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A6FE5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        paddingLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        height: isSmallScreen ? 48 : 52, 
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#333333',
    },
    inputFocused: {
        borderColor: '#4A6FE5',
        backgroundColor: '#FFFFFF',
        shadowColor: '#4A6FE5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    passwordVisibilityButton: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: 6,
        paddingLeft: 4,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#4A6FE5',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 24,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    loginText: {
        fontSize: 16,
        color: '#666666',
    },
    loginLink: {
        fontSize: 16,
        color: '#4A6FE5',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageIcon: {
        marginRight: 8,
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    error: {
        backgroundColor: '#FF3B30',
    },
    success: {
        backgroundColor: '#34C759',
    },
    info: {
        backgroundColor: '#007AFF',
    },
});

export default LoginScreen;