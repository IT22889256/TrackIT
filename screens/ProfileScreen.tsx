import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    Animated,
    Image,
    ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../firebaseConfig';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFonts } from 'expo-font';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
    navigation: ProfileScreenNavigationProp;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const [userName, setUserName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState<boolean>(true);
    const [fontsLoaded] = useFonts({
        // 'InterBold': require('../assets/fonts/Inter-Bold.ttf'),
        // 'InterRegular': require('../assets/fonts/Inter-Regular.ttf'),
        // 'InterMedium': require('../assets/fonts/Inter-Medium.ttf'),
    });

    // Animation refs
    const editButtonScale = useRef(new Animated.Value(1)).current;
    const reportsButtonScale = useRef(new Animated.Value(1)).current;
    const membersButtonScale = useRef(new Animated.Value(1)).current;
    const removeButtonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserName(userData.name || 'User Name');
                        setEmail(userData.email || '@email.com');
                        
                        // Check for Firebase Storage image URL
                        if (userData.photoURL) {
                            try {
                                // Get the download URL from the reference
                                const url = await getDownloadURL(ref(storage, userData.photoURL));
                                setProfileImage(url);
                            } catch (error) {
                                console.error('Error fetching image from storage:', error);
                                // If there's an error, we'll just proceed without the image
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoadingImage(false);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    onPress: () => {
                        auth.signOut().then(() => {
                            navigation.navigate('Login');
                        });
                    }
                }
            ]
        );
    };

    const handleRemoveAccount = async () => {
        Alert.alert(
            "Remove Account",
            "Are you sure you want to permanently remove your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: 'destructive',
                    onPress: async () => {
                        if (auth.currentUser) {
                            try {
                                // Delete user document
                                await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                                
                                // Delete profile image from storage if it exists
                                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                                if (userDoc.exists() && userDoc.data().photoURL) {
                                    const imageRef = ref(storage, userDoc.data().photoURL);
                                    await deleteObject(imageRef).catch(error => {
                                        console.error("Error deleting profile image:", error);
                                    });
                                }
                                
                                // Delete user account
                                await deleteUser(auth.currentUser);
                                navigation.navigate('Login');
                            } catch (error) {
                                console.error("Error deleting account:", error);
                                Alert.alert("Error", "Failed to delete account. Please try again.");
                            }
                        }
                    },
                },
            ]
        );
    };

    // Animation handlers (remain the same)
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

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>My Profile</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                    <Ionicons name="log-out-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                {loadingImage ? (
                    <View style={styles.profileImagePlaceholder}>
                        <ActivityIndicator size="small" color="#666" />
                    </View>
                ) : profileImage ? (
                    <Image 
                        source={{ uri: profileImage }} 
                        style={styles.profileImage}
                    />
                ) : (
                    <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={50} color="#666" />
                    </View>
                )}
                
                <View style={styles.profileText}>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.email}>{email}</Text>
                </View>
                
                <Animated.View style={{ transform: [{ scale: editButtonScale }] }}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPressIn={() => handlePressIn(editButtonScale)}
                        onPressOut={() => handlePressOut(editButtonScale, () => navigation.navigate('EditProfile'))}
                        activeOpacity={1}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Options */}
            <View style={styles.options}>
                <Animated.View style={{ transform: [{ scale: reportsButtonScale }] }}>
                    <TouchableOpacity
                        style={{ ...styles.optionItem, backgroundColor: '#4CAF50' }}
                        onPressIn={() => handlePressIn(reportsButtonScale)}
                        onPressOut={() => handlePressOut(reportsButtonScale, () => navigation.navigate('Reports'))}
                        activeOpacity={1}
                    >
                        <Text style={styles.optionText}>Reports</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: membersButtonScale }] }}>
                    <TouchableOpacity
                        style={{ ...styles.optionItem, backgroundColor: '#2196F3' }}
                        onPressIn={() => handlePressIn(membersButtonScale)}
                        onPressOut={() => handlePressOut(membersButtonScale, () => navigation.navigate('Members'))}
                        activeOpacity={1}
                    >
                        <Text style={styles.optionText}>Members</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Remove Account */}
            <Animated.View style={{ transform: [{ scale: removeButtonScale }] }}>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPressIn={() => handlePressIn(removeButtonScale)}
                    onPressOut={() => handlePressOut(removeButtonScale, handleRemoveAccount)}
                    activeOpacity={1}
                >
                    <Text style={styles.removeButtonText}>Remove Account</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
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
    profileInfo: {
        alignItems: 'center',
        padding: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        marginBottom: 15,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 16,
        color: 'gray',
    },
    editButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 10,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    options: {
        padding: 20,
    },
    optionItem: {
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 18,
        color: '#333',
    },
    removeButton: {
        backgroundColor: '#DC143C',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        margin: 20,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProfileScreen;