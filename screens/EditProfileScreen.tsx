import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';

type EditProfileScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'EditProfile'
>;

type Props = {
    navigation: EditProfileScreenNavigationProp;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [newImageUri, setNewImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fontsLoaded] = useFonts({
        // Your font imports
    });

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

                        // Check for profile picture URL in Firestore
                        if (userData.profilePictureUrl) {
                            try {
                                // Get fresh download URL from Storage
                                const storageRef = ref(storage, userData.profilePictureUrl);
                                const downloadUrl = await getDownloadURL(storageRef);
                                setProfileImageUrl(downloadUrl);
                            } catch (error) {
                                console.error('Error fetching image from storage:', error);
                                setProfileImageUrl(null);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

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
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                // Check file size
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
                    Alert.alert('Image too large', `Please select an image smaller than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                    return;
                }

                setNewImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const uploadImageToStorage = async (uri: string, userId: string) => {
        setUploading(true);
        
        try {
            // Why are we using XMLHttpRequest? See:
            // https://github.com/expo/expo/issues/2402#issuecomment-443726662
            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => {
                    resolve(xhr.response);
                };
                xhr.onerror = (e) => {
                    reject(new TypeError('Network request failed'));
                };
                xhr.responseType = 'blob';
                xhr.open('GET', uri, true);
                xhr.send(null);
            });

            // Create a reference with a unique filename
            const fileRef = ref(storage, `profilePictures/${userId}/${Date.now()}`);
            await uploadBytes(fileRef, blob as Blob);
            
            // We're done with the blob, close and release it
            (blob as any).close();
            
            // Get the download URL
            const downloadURL = await getDownloadURL(fileRef);
            
            // Return the full path (not just the download URL) for storage in Firestore
            return fileRef.fullPath;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            if (!auth.currentUser) return;

            setLoading(true);
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const updateData: any = {
                name,
                email,
            };

            // If new image was selected, upload it to storage
            if (newImageUri) {
                try {
                    // First delete old image if it exists
                    if (profileImageUrl) {
                        await deleteOldProfileImage();
                    }

                    // Upload new image
                    const storagePath = await uploadImageToStorage(newImageUri, auth.currentUser.uid);
                    updateData.profilePictureUrl = storagePath;
                } catch (error) {
                    console.error('Error uploading new profile image:', error);
                    throw new Error('Failed to upload profile image');
                }
            }

            await updateDoc(userDocRef, updateData);

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const deleteOldProfileImage = async () => {
        try {
            if (!auth.currentUser) return;

            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().profilePictureUrl) {
                const oldImageRef = ref(storage, userDoc.data().profilePictureUrl);
                await deleteObject(oldImageRef);
            }
        } catch (error) {
            console.error('Error deleting old profile image:', error);
            // Don't throw error here - we can continue without deleting the old image
        }
    };

    const removeProfileImage = async () => {
        try {
            if (!auth.currentUser) return;

            setLoading(true);

            // Delete from storage if exists
            await deleteOldProfileImage();

            // Update Firestore to remove reference
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                profilePictureUrl: null
            });

            setProfileImageUrl(null);
            setNewImageUri(null);
            Alert.alert('Success', 'Profile image removed');
        } catch (error) {
            console.error('Error removing profile image:', error);
            Alert.alert('Error', 'Failed to remove profile image');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleUpdateProfile}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color="#333" />
                    ) : (
                        <Ionicons name="checkmark-outline" size={24} color="#333" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Profile Image */}
            <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={pickImage}
            >
                {newImageUri ? (
                    <Image source={{ uri: newImageUri }} style={styles.profileImage} />
                ) : profileImageUrl ? (
                    <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                ) : (
                    <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={40} color="#666" />
                    </View>
                )}
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={20} color="white" />
                </View>
            </TouchableOpacity>

            {(profileImageUrl || newImageUri) && (
                <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeProfileImage}
                    disabled={uploading}
                >
                    <Text style={styles.removeImageButtonText}>Remove Profile Image</Text>
                </TouchableOpacity>
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
                    autoCapitalize="none"
                    placeholderTextColor="#BDBDBD"
                />

                <TouchableOpacity
                    style={styles.changePasswordButton}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Text style={styles.changePasswordButtonText}>Change Password</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButton: {
        padding: 8,
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007BFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#BDBDBD',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        color: '#333',
        backgroundColor: '#FFFFFF',
    },
    changePasswordButton: {
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        alignSelf: 'flex-start',
    },
    changePasswordButtonText: {
        color: '#007BFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    removeImageButton: {
        alignSelf: 'center',
        padding: 8,
        marginTop: -10,
        marginBottom: 10,
    },
    removeImageButtonText: {
        color: '#FF3B30',
        fontSize: 14,
    },
});

export default EditProfileScreen;