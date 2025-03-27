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
} from 'react-native';
import { auth, db, storage } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // Import FileSystem

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
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const passwordInputRef = useRef<TextInput>(null);

    // Real-time validation effects (same as before)
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

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos to set a profile picture');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7, // Reduced quality to limit file size
        });

        if (!result.canceled) {
            // Check file size (optional)
            if(result.assets && result.assets[0]){
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) { // 2MB limit
                    Alert.alert('Image too large', 'Please select an image smaller than 2MB');
                    return;
                }
                setImage(result.assets[0].uri);
            }

        }
    };

    const convertImageToBase64 = async (uri: string) => {
        try {
            // Read the file as base64 string
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error("Error converting image to base64:", error);
            return null;
        }
    };

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

            let photoBase64 = null;
            if (image) {
                photoBase64 = await convertImageToBase64(image);
                if (!photoBase64) {
                    Alert.alert('Error', 'Failed to process profile image');
                    return;
                }
            }

            const userData = {
                name: name,
                email: email,
                members: {},
                ...(photoBase64 && { photoBase64: photoBase64 }), // Only include if exists
                createdAt: new Date().toISOString()
            };


            await setDoc(doc(db, 'users', user.uid), userData);

            navigation.navigate('Login');
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

                <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={50} color="#666" />
                            <Text style={styles.profileImageText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

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
                            name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
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
                    disabled={isLoading || uploading}
                >
                    {(isLoading || uploading) ? (
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
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
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
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 10,
        fontSize: 14,
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
        top: 13,
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
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
    },
    loginLink: {
        fontSize: 16,
        color: '#6750A4',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    profileImageText: {
        marginTop: 5,
        color: '#666',
    },
});

export default SignupScreen;
