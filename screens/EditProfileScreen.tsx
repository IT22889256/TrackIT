import React, { useState, useEffect ,useRef} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Animated
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

type EditProfileScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'EditProfile'
>;

type Props = {
    navigation: EditProfileScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB limit for Base64

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [newImage, setNewImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fontsLoaded] = useFonts({
        // Your font imports
    });

    // Animation refs
    const saveButtonScale = useRef(new Animated.Value(1)).current;
    const imageButtonScale = useRef(new Animated.Value(1)).current;
    const removeButtonScale = useRef(new Animated.Value(1)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setName(userData.name || '');
                        setEmail(userData.email || '');

                        if (userData.photoBase64) {
                            setProfileImage(userData.photoBase64);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to load profile data.');
            } finally {
                setLoading(false);
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                }).start();
            }
        };

        fetchUserData();
    }, []);

    const handlePressIn = (animatedValue: Animated.Value) => {
        Animated.spring(animatedValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (animatedValue: Animated.Value, onPress: () => void) => {
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
        }).start(() => onPress());
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'We need access to your photos to set a profile picture');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
                    Alert.alert('Image too large', `Please select an image smaller than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                    return;
                }

                const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const base64String = `data:image/jpeg;base64,${base64}`;

                if (base64String.length > MAX_IMAGE_SIZE) {
                    Alert.alert('Image too large', 'The image is still too large after conversion. Please choose a smaller image.');
                    return;
                }

                setNewImage(base64String);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            if (!auth.currentUser) return;

            setUploading(true);
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const updateData: any = {
                name,
                email,
            };

            if (newImage) {
                updateData.photoBase64 = newImage;
            }

            await updateDoc(userDocRef, updateData);

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setUploading(false);
        }
    };

    const removeProfileImage = async () => {
        try {
            if (!auth.currentUser) return;

            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                photoBase64: null
            });

            setProfileImage(null);
            setNewImage(null);
            Alert.alert('Success', 'Profile image removed');
        } catch (error) {
            console.error('Error removing profile image:', error);
            Alert.alert('Error', 'Failed to remove profile image');
        }
    };

    if (loading || !fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A6FE5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.container, { opacity: contentOpacity }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            style={styles.headerButton}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Profile</Text>
                        <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPressIn={() => handlePressIn(saveButtonScale)}
                                onPressOut={() => handlePressOut(saveButtonScale, handleUpdateProfile)}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#4A6FE5" />
                                ) : (
                                    <Ionicons name="checkmark-outline" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Profile Image */}
                    <Animated.View style={{ transform: [{ scale: imageButtonScale }] }}>
                        <TouchableOpacity
                            style={styles.profileImageContainer}
                            onPressIn={() => handlePressIn(imageButtonScale)}
                            onPressOut={() => handlePressOut(imageButtonScale, pickImage)}
                            activeOpacity={1}
                        >
                            {newImage ? (
                                <Image source={{ uri: newImage }} style={styles.profileImage} />
                            ) : profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Ionicons name="person" size={isSmallScreen ? 40 : 50} color="#FFFFFF" />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={isSmallScreen ? 16 : 18} color="white" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {(profileImage || newImage) && (
                        <Animated.View style={{ transform: [{ scale: removeButtonScale }] }}>
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPressIn={() => handlePressIn(removeButtonScale)}
                                onPressOut={() => handlePressOut(removeButtonScale, removeProfileImage)}
                                activeOpacity={1}
                            >
                                <Text style={styles.removeImageButtonText}>Remove Profile Image</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Input Fields */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#BDBDBD"
                        />

                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            placeholderTextColor="#BDBDBD"
                        />

                        <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                            <TouchableOpacity
                                style={styles.changePasswordButton}
                                onPressIn={() => handlePressIn(saveButtonScale)}
                                onPressOut={() => handlePressOut(saveButtonScale, () => navigation.navigate('ChangePassword'))}
                                activeOpacity={1}
                            >
                                <LinearGradient
                                    colors={['#4A6FE5', '#6B8FF8']}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.changePasswordButtonText}>Change Password</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FD',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FD',
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FD',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    title: {
        fontSize: width < 375 ? 18 : 20,
        fontWeight: 'bold',
        color: '#333333',
        maxWidth: width * 0.6,
        textAlign: 'center',
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 15,
        position: 'relative',
        padding: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    profileImage: {
        width: width < 375 ? 100 : 120,
        height: width < 375 ? 100 : 120,
        borderRadius: width < 375 ? 50 : 60,
        backgroundColor: '#E0E0E0',
    },
    profileImagePlaceholder: {
        width: width < 375 ? 100 : 120,
        height: width < 375 ? 100 : 120,
        borderRadius: width < 375 ? 50 : 60,
        backgroundColor: '#8EACFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#4A6FE5',
        width: width < 375 ? 28 : 32,
        height: width < 375 ? 28 : 32,
        borderRadius: width < 375 ? 14 : 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    inputContainer: {
        paddingHorizontal: width < 375 ? 15 : 20,
        marginTop: 10,
    },
    label: {
        fontSize: width < 375 ? 14 : 16,
        fontWeight: '600',
        color: '#333333',
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: width < 375 ? 12 : 14,
        color: '#333333',
        backgroundColor: '#FFFFFF',
        fontSize: width < 375 ? 14 : 16,
    },
    changePasswordButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 25,
    },
    gradientButton: {
        paddingVertical: width < 375 ? 12 : 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    changePasswordButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: width < 375 ? 14 : 16,
    },
    removeImageButton: {
        alignSelf: 'center',
        padding: 10,
        marginTop: 5,
        marginBottom: 15,
        backgroundColor: '#FFEBEB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    removeImageButtonText: {
        color: '#FF3B30',
        fontSize: width < 375 ? 12 : 14,
        fontWeight: '600',
    },
});

export default EditProfileScreen;