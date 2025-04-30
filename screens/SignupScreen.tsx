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
    Image,
    Keyboard,
    AccessibilityInfo,
} from 'react-native';
import { auth, db, storage } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';

type SignupScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Signup'
>;

type Props = {
    navigation: SignupScreenNavigationProp;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI state
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [signupStage, setSignupStage] = useState<'form' | 'processing' | 'success'>('form');
    const [image, setImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
    
    // Validation state
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    
    // Focus state
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    
    // Processing state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [progress, setProgress] = useState(0);

    // Refs for focus management
    const nameInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Reset form when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            return () => {
                if (signupStage === 'success') {
                    resetForm();
                }
            };
        }, [signupStage])
    );

    // Validate name when it changes or loses focus
    useEffect(() => {
        if ((nameFocused && name.trim()) || (!nameFocused && name)) {
            validateName(name);
        }
    }, [name, nameFocused]);

    // Validate email when it changes or loses focus
    useEffect(() => {
        if ((emailFocused && email.trim()) || (!emailFocused && email)) {
            validateEmail(email);
        }
    }, [email, emailFocused]);

    // Validate password and check strength when it changes
    useEffect(() => {
        if ((passwordFocused && password.trim()) || (!passwordFocused && password)) {
            validatePassword(password);
            checkPasswordStrength(password);
        }
        
        // Update confirm password validation if already entered
        if (confirmPassword) {
            validateConfirmPassword(confirmPassword, password);
        }
    }, [password, passwordFocused]);

    // Validate confirm password when it changes or loses focus
    useEffect(() => {
        if ((confirmPasswordFocused && confirmPassword.trim()) || (!confirmPasswordFocused && confirmPassword)) {
            validateConfirmPassword(confirmPassword, password);
        }
    }, [confirmPassword, password, confirmPasswordFocused]);

    // Validation functions
    const validateName = (value: string): boolean => {
        if (!value.trim()) {
            setNameError('Name is required');
            return false;
        } else if (value.trim().length < 2) {
            setNameError('Name must be at least 2 characters');
            return false;
        } else {
            setNameError('');
            return true;
        }
    };

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!value.trim()) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    const validatePassword = (value: string): boolean => {
        if (!value.trim()) {
            setPasswordError('Password is required');
            return false;
        } else if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        } else if (!/[a-z]/.test(value)) {
            setPasswordError('Include at least one lowercase letter');
            return false;
        } else if (!/[A-Z]/.test(value)) {
            setPasswordError('Include at least one uppercase letter');
            return false;
        } else if (!/\d/.test(value)) {
            setPasswordError('Include at least one number');
            return false;
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            setPasswordError('Include at least one special character');
            return false;
        } else {
            setPasswordError('');
            return true;
        }
    };

    const validateConfirmPassword = (value: string, passwordValue: string): boolean => {
        if (!value.trim()) {
            setConfirmPasswordError('Please confirm your password');
            return false;
        } else if (value !== passwordValue) {
            setConfirmPasswordError('Passwords do not match');
            return false;
        } else {
            setConfirmPasswordError('');
            return true;
        }
    };

    const checkPasswordStrength = (value: string) => {
        if (!value) {
            setPasswordStrength(null);
            return;
        }
        
        let score = 0;
        if (value.length >= 8) score++;
        if (value.length >= 12) score++;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
        
        if (score < 3) {
            setPasswordStrength('weak');
        } else if (score < 5) {
            setPasswordStrength('medium');
        } else {
            setPasswordStrength('strong');
        }
    };

    // Handle picking profile image
    const pickImage = async () => {
        Keyboard.dismiss();
        
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required', 
                'We need access to your photos to set a profile picture',
                [{ text: 'OK', onPress: () => {} }]
            );
            return;
        }

        try {
            setImageLoading(true);
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
                    Alert.alert(
                        'Image Too Large', 
                        'Please select an image smaller than 5MB',
                        [{ text: 'OK', onPress: () => {} }]
                    );
                    return;
                }
                setImage(result.assets[0].uri);
                
                // Announce image set for screen readers
                AccessibilityInfo.announceForAccessibility('Profile image selected');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not select image. Please try again.');
        } finally {
            setImageLoading(false);
        }
    };

    // Upload image to Firebase Storage
    const uploadImage = async (uri: string, userId: string) => {
        try {
            setCurrentStep('Uploading profile picture...');
            
            // Fetch the image blob from the URI
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Create a reference to the storage location
            const storageRef = ref(storage, `profilePictures/${userId}`);
            
            // Upload the file with progress monitoring
            const uploadTask = uploadBytes(storageRef, blob);
            await uploadTask;
            
            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    // Handle signup process
    const handleSignup = async () => {
        Keyboard.dismiss();
        
        // Validate all fields first
        const nameValid = validateName(name);
        const emailValid = validateEmail(email);
        const passwordValid = validatePassword(password);
        const confirmPasswordValid = validateConfirmPassword(confirmPassword, password);
        
        if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
            // Scroll to the first error field
            if (!nameValid) {
                nameInputRef.current?.focus();
            } else if (!emailValid) {
                emailInputRef.current?.focus();
            } else if (!passwordValid) {
                passwordInputRef.current?.focus();
            } else if (!confirmPasswordValid) {
                confirmPasswordInputRef.current?.focus();
            }
            return;
        }

        // Begin signup process
        setIsSubmitting(true);
        setSignupStage('processing');
        setProgress(0);
        
        try {
            // Create user account
            setCurrentStep('Creating your account...');
            setProgress(20);
            
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;
            setProgress(50);

            // Upload profile picture if selected
            let photoURL = null;
            if (image) {
                try {
                    photoURL = await uploadImage(image, user.uid);
                    setProgress(75);
                } catch (error) {
                    console.error("Image upload failed, continuing without image", error);
                }
            } else {
                setProgress(75);
            }

            // Create user document in Firestore
            setCurrentStep('Setting up your profile...');
            const userData = {
                name: name.trim(),
                email: email.trim(),
                ...(photoURL && { photoURL }), // Only include if exists
                createdAt: new Date().toISOString(),
                receiptURL: null
            };

            await setDoc(doc(db, 'users', user.uid), userData);
            setProgress(100);
            
            // Success state
            setCurrentStep('Account created successfully!');
            setSignupStage('success');
            
            // Delay navigation to show success state
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);
            
        } catch (error: any) {
            // Handle specific Firebase errors with friendlier messages
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please try logging in.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'The email address is not valid.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Account creation is currently disabled.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Your password is too weak.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert(
                'Signup Failed', 
                errorMessage,
                [{ text: 'OK', onPress: () => setSignupStage('form') }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setImage(null);
        setNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setPasswordStrength(null);
        setSignupStage('form');
        setProgress(0);
        setCurrentStep('');
    };

    // Render password strength indicator
    const renderPasswordStrengthIndicator = () => {
        if (!password) return null;
        
        let color;
        let label;
        
        switch (passwordStrength) {
            case 'weak':
                color = '#FF3B30';
                label = 'Weak';
                break;
            case 'medium':
                color = '#FF9500';
                label = 'Medium';
                break;
            case 'strong':
                color = '#34C759';
                label = 'Strong';
                break;
            default:
                return null;
        }
        
        return (
            <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: '#DDD' }]}>
                    <View 
                        style={[
                            styles.strengthIndicator, 
                            { 
                                backgroundColor: color,
                                width: passwordStrength === 'weak' ? '33%' : 
                                       passwordStrength === 'medium' ? '66%' : '100%'
                            }
                        ]} 
                    />
                </View>
                <Text style={[styles.strengthText, { color }]}>{label}</Text>
            </View>
        );
    };

    // Render loading/processing state
    const renderProcessingState = () => {
        return (
            <View style={styles.processingContainer}>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressIndicator, 
                                { width: `${progress}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>
                <Text style={styles.processingText}>{currentStep}</Text>
                <ActivityIndicator size="large" color="#6750A4" style={styles.loader} />
            </View>
        );
    };

    // Render success state
    const renderSuccessState = () => {
        return (
            <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#34C759" />
                <Text style={styles.successText}>Account Created Successfully!</Text>
                <Text style={styles.successSubText}>Redirecting to login...</Text>
            </View>
        );
    };

    // Main form render
    const renderSignupForm = () => {
        return (
            <>
                <Text style={styles.title}>Create an Account</Text>

                <TouchableOpacity 
                    onPress={pickImage} 
                    style={styles.profileImageContainer}
                    disabled={imageLoading}
                    accessible={true}
                    accessibilityLabel="Add profile picture"
                    accessibilityHint="Opens your photo gallery to select a profile image"
                    accessibilityRole="button"
                >
                    {image ? (
                        <Image 
                            source={{ uri: image }} 
                            style={styles.profileImage} 
                            accessibilityIgnoresInvertColors={true}
                        />
                    ) : imageLoading ? (
                        <View style={styles.profileImagePlaceholder}>
                            <ActivityIndicator color="#6750A4" />
                        </View>
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={50} color="#666" />
                            <Text style={styles.profileImageText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TextInput
                    ref={nameInputRef}
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
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                    accessible={true}
                    accessibilityLabel="Full Name"
                    accessibilityHint="Enter your full name"
                />
                {nameError && <Text style={styles.errorText}>{nameError}</Text>}

                <TextInput
                    ref={emailInputRef}
                    style={[
                        styles.input,
                        emailFocused && styles.inputFocused,
                        emailError && styles.inputError,
                    ]}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                    accessible={true}
                    accessibilityLabel="Email Address"
                    accessibilityHint="Enter your email address"
                />
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

                <View style={styles.passwordContainer}>
                    <TextInput
                        ref={passwordInputRef}
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
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                        blurOnSubmit={false}
                        accessible={true}
                        accessibilityLabel="Password"
                        accessibilityHint="Enter a secure password"
                    />
                    <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        accessible={true}
                        accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                        accessibilityRole="button"
                    >
                        <Ionicons
                            name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                {renderPasswordStrengthIndicator()}

                <View style={styles.passwordContainer}>
                    <TextInput
                        ref={confirmPasswordInputRef}
                        style={[
                            styles.input,
                            styles.passwordInput,
                            confirmPasswordFocused && styles.inputFocused,
                            confirmPasswordError && styles.inputError,
                        ]}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!confirmPasswordVisible}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        returnKeyType="done"
                        onSubmitEditing={handleSignup}
                        accessible={true}
                        accessibilityLabel="Confirm Password"
                        accessibilityHint="Confirm your password"
                    />
                    <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        accessible={true}
                        accessibilityLabel={confirmPasswordVisible ? "Hide password" : "Show password"}
                        accessibilityRole="button"
                    >
                        <Ionicons
                            name={confirmPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {confirmPasswordError && (
                    <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Sign Up"
                    accessibilityHint="Creates your account"
                >
                    <Text style={styles.buttonText}>Create Account</Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Login')}
                        accessibilityRole="button"
                        accessibilityLabel="Sign In"
                        accessibilityHint="Go to the login screen"
                    >
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                {signupStage === 'form' && renderSignupForm()}
                {signupStage === 'processing' && renderProcessingState()}
                {signupStage === 'success' && renderSuccessState()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#333',
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
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 10,
        fontSize: 14,
        paddingHorizontal: 5,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    passwordToggle: {
        position: 'absolute',
        right: 15,
        top: 16,
        zIndex: 1,
    },
    button: {
        backgroundColor: '#4A6FE5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#B39DDB',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
        paddingBottom: 10,
    },
    loginText: {
        color: '#666',
        fontSize: 16,
    },
    loginLink: {
        fontSize: 16,
        color: '#4A6FE5',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginBottom: 25,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#6750A4',
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    profileImageText: {
        marginTop: 5,
        color: '#666',
        fontWeight: '600',
    },
    strengthContainer: {
        marginBottom: 15,
        marginTop: -5,
    },
    strengthBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#DDD',
        marginVertical: 5,
        overflow: 'hidden',
    },
    strengthIndicator: {
        height: '100%',
    },
    strengthText: {
        fontSize: 12,
        alignSelf: 'flex-end',
        marginRight: 5,
    },
    processingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    processingText: {
        fontSize: 18,
        color: '#6750A4',
        marginBottom: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        marginVertical: 20,
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressIndicator: {
        height: '100%',
        backgroundColor: '#6750A4',
    },
    progressText: {
        fontSize: 16,
        color: '#6750A4',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 20,
    },
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    successText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    successSubText: {
        fontSize: 16,
        color: '#666',
    },
});

export default SignupScreen;