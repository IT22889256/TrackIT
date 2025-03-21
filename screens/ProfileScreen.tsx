
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';

import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useFonts } from 'expo-font';


type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
    navigation: ProfileScreenNavigationProp;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const [userName, setUserName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [fontsLoaded] = useFonts({
        // 'InterBold': require('../assets/fonts/Inter-Bold.ttf'),
        // 'InterRegular': require('../assets/fonts/Inter-Regular.ttf'),
        // 'InterMedium': require('../assets/fonts/Inter-Medium.ttf'),
    });

    // --- Animation Values using useRef ---
    const editButtonScale = useRef(new Animated.Value(1)).current;
    const reportsButtonScale = useRef(new Animated.Value(1)).current;
    const membersButtonScale = useRef(new Animated.Value(1)).current;
    const removeButtonScale = useRef(new Animated.Value(1)).current;
    // --------------------------------------

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
                    } else {
                        console.log('User document not found');
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: () => {
                        auth.signOut().then(() => {
                            navigation.navigate('Login');
                        }).catch((error) => {
                            console.error("Error signing out: ", error);
                            Alert.alert("Logout Error", "Failed to logout. Please try again.");
                        });
                    }
                }
            ],
            { cancelable: false }
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
                        try {
                            if (auth.currentUser) {
                                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                                await deleteDoc(userDocRef);
                                await deleteUser(auth.currentUser);
                                navigation.navigate('Login');
                                Alert.alert("Account Removed", "Your account has been successfully removed.");

                            } else {
                                Alert.alert("Error", "No user is currently logged in.");
                            }
                        } catch (error: any) {
                            console.error("Error removing account: ", error);
                            Alert.alert("Error Removing Account", `Failed to remove your account: ${error.message}`);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    // ---  Functions to handle button press animation ---
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
        }).start(() => {
            onPress();
        });
    };
    // ----------------------------------------------------

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>My Profile</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                <View style={styles.profileImage}></View>
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
                {/* Reports Button */}
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

                {/* Members Button */}
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
    loadingText: {
        fontSize: 16,
        fontFamily: 'InterRegular',
        color: '#333',
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
        fontFamily: 'InterBold',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    profileText: {
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 20,
        fontFamily: 'InterBold',
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 16,
        fontFamily: 'InterRegular',
        color: 'gray',
    },
    editButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'InterMedium',
        fontSize: 16,
    },
    options: {
        padding: 20,
    },
    optionItem: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 1,
    },
    optionText: {
        fontSize: 18,
        fontFamily: 'InterMedium',
        color: '#333',
    },
    removeButton: {
        backgroundColor: '#DC143C',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'InterMedium',
        fontSize: 16,
    },
});

export default ProfileScreen;
