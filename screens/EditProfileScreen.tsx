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
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

                        // Check for Base64 image data
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
                quality: 0.5, // Lower quality to reduce size
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                // Check file size
                const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
                if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
                    Alert.alert('Image too large', `Please select an image smaller than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                    return;
                }

                // Convert to Base64
                const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const base64String = `data:image/jpeg;base64,${base64}`;

                // Check the final size
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

            setLoading(true);
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const updateData: any = {
                name,
                email,
            };

            // If new image was selected, include it in the update
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
            setLoading(false);
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
                {newImage ? (
                    <Image source={{ uri: newImage }} style={styles.profileImage} />
                ) : profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={40} color="#666" />
                    </View>
                )}
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={20} color="white" />
                </View>
            </TouchableOpacity>

            {(profileImage || newImage) && (
                <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeProfileImage}
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
                    placeholderTextColor="#BDBDBD"
                />

                <TouchableOpacity
                    style={styles.changePasswordButton}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Text style={styles.changePasswordButtonText}>Change Password</Text>
                </TouchableOpacity>
            </View>

            {/* <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateProfile}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.updateButtonText}>Update Profile</Text>
                )}
            </TouchableOpacity> */}
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
        backgroundColor: '#FFFFFF', // Added background color for input
    },
    updateButton: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginHorizontal: 20,
    },
    updateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
