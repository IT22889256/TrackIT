import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    Animated,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../firebaseConfig';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
    navigation: ProfileScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

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
    const membersButtonScale = useRef(new Animated.Value(1)).current;
    const removeButtonScale = useRef(new Animated.Value(1)).current;
    const profileCardOpacity = useRef(new Animated.Value(0)).current;

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
                        
                        if (userData.photoURL) {
                            try {
                                const url = await getDownloadURL(ref(storage, userData.photoURL));
                                setProfileImage(url);
                            } catch (error) {
                                console.error('Error fetching image from storage:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoadingImage(false);
                Animated.timing(profileCardOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true
                }).start();
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
            "Are you sure you want to permanently remove your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: 'destructive',
                    onPress: async () => {
                        if (auth.currentUser) {
                            try {
                                await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                                
                                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                                if (userDoc.exists() && userDoc.data().photoURL) {
                                    const imageRef = ref(storage, userDoc.data().photoURL);
                                    await deleteObject(imageRef).catch(error => {
                                        console.error("Error deleting profile image:", error);
                                    });
                                }
                                
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
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            style={styles.headerButton}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
                        </TouchableOpacity>
                        <Text style={styles.title}>My Profile</Text>
                        <TouchableOpacity 
                            onPress={handleLogout} 
                            style={styles.headerButton}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Ionicons name="log-out-outline" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Info */}
                    <Animated.View style={[styles.profileCard, { opacity: profileCardOpacity }]}>
                        <LinearGradient
                            colors={['#4A6FE5', '#6B8FF8']}
                            style={styles.gradientHeader}
                        />
                        <View style={styles.profileInfo}>
                            {loadingImage ? (
                                <View style={styles.profileImageContainer}>
                                    <View style={styles.profileImagePlaceholder}>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.profileImageContainer}>
                                    {profileImage ? (
                                        <Image 
                                            source={{ uri: profileImage }} 
                                            style={styles.profileImage}
                                        />
                                    ) : (
                                        <View style={styles.profileImagePlaceholder}>
                                            <Ionicons 
                                                name="person" 
                                                size={isSmallScreen ? 40 : 50} 
                                                color="#FFFFFF" 
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            <View style={styles.profileText}>
                                <Text 
                                    style={styles.userName}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >
                                    {userName}
                                </Text>
                                <Text 
                                    style={styles.email}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {email}
                                </Text>
                            </View>
                            
                            <Animated.View style={[styles.editButtonContainer, { transform: [{ scale: editButtonScale }] }]}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPressIn={() => handlePressIn(editButtonScale)}
                                    onPressOut={() => handlePressOut(editButtonScale, () => navigation.navigate('EditProfile'))}
                                    activeOpacity={1}
                                >
                                    <LinearGradient
                                        colors={['#4A6FE5', '#6B8FF8']}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.editButtonText}>Edit Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </Animated.View>

                    {/* Options */}
                    <View style={styles.options}>
                        <Text style={styles.sectionTitle}>Profile Management</Text>
                        
                        <Animated.View style={{ transform: [{ scale: membersButtonScale }] }}>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPressIn={() => handlePressIn(membersButtonScale)}
                                onPressOut={() => handlePressOut(membersButtonScale, () => navigation.navigate('Members'))}
                                activeOpacity={1}
                            >
                                <LinearGradient
                                    colors={['#4A6FE5', '#6B8FF8']}
                                    style={styles.gradientOption}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.optionContent}>
                                        <Ionicons name="people" size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
                                        <Text style={styles.optionText}>Members</Text>
                                    </View>
                                    <View style={styles.optionArrow}>
                                        <Ionicons name="chevron-forward" size={isSmallScreen ? 18 : 20} color="#FFFFFF" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Danger Zone</Text>
                        
                        <Animated.View style={{ transform: [{ scale: removeButtonScale }] }}>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPressIn={() => handlePressIn(removeButtonScale)}
                                onPressOut={() => handlePressOut(removeButtonScale, handleRemoveAccount)}
                                activeOpacity={1}
                            >
                                <View style={styles.removeButtonInner}>
                                    <Ionicons name="trash-outline" size={isSmallScreen ? 18 : 22} color="#FF3B30" />
                                    <Text style={styles.removeButtonText}>Remove Account</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
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
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: width < 375 ? 15 : 20,
        marginTop: width < 375 ? 15 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    gradientHeader: {
        height: width < 375 ? 70 : 80,
        width: '100%',
    },
    profileInfo: {
        alignItems: 'center',
        padding: width < 375 ? 15 : 20,
        paddingTop: 0,
    },
    profileImageContainer: {
        marginTop: -40,
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
        width: width < 375 ? 70 : 80,
        height: width < 375 ? 70 : 80,
        borderRadius: width < 375 ? 35 : 40,
        backgroundColor: '#E0E0E0',
    },
    profileImagePlaceholder: {
        width: width < 375 ? 70 : 80,
        height: width < 375 ? 70 : 80,
        borderRadius: width < 375 ? 35 : 40,
        backgroundColor: '#8EACFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 15,
        width: '100%',
        paddingHorizontal: 10,
    },
    userName: {
        fontSize: width < 375 ? 20 : 22,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
        textAlign: 'center',
        maxWidth: '100%',
    },
    email: {
        fontSize: width < 375 ? 14 : 16,
        color: '#666666',
        textAlign: 'center',
        maxWidth: '100%',
    },
    editButtonContainer: {
        width: '100%',
        maxWidth: width * 0.8,
    },
    editButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: width < 375 ? 10 : 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: width < 375 ? 14 : 16,
    },
    options: {
        padding: width < 375 ? 15 : 20,
        flex: 1,
    },
    sectionTitle: {
        fontSize: width < 375 ? 16 : 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
        marginTop: 20,
        paddingLeft: 5,
    },
    dangerSectionTitle: {
        color: '#FF3B30',
    },
    optionItem: {
        borderRadius: 16,
        marginBottom: 15,
        overflow: 'hidden',
    },
    gradientOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: width < 375 ? 14 : 16,
        paddingHorizontal: width < 375 ? 15 : 20,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: width < 375 ? 16 : 18,
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 12,
    },
    optionArrow: {
        opacity: 0.8,
    },
    removeButton: {
        backgroundColor: '#FFEBEB',
        padding: width < 375 ? 14 : 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFCDD2',
        marginTop: 5,
    },
    removeButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        fontSize: width < 375 ? 14 : 16,
        marginLeft: 8,
    },
});

export default ProfileScreen;