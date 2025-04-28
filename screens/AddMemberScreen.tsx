import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

type AddMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMember'>;

type Props = {
    navigation: AddMemberScreenNavigationProp;
};

type User = {
    uid: string;
    name: string;
    email: string;
};

const AddMemberScreen: React.FC<Props> = ({ navigation }) => {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchEmail.trim()) {
            Alert.alert('Error', 'Please enter an email to search.');
            setSearchResults([]);
            return;
        }

        setLoading(true);
        setSearchResults([]);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", searchEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Info', 'No users found with this email.');
                setLoading(false);
                return;
            }

            const users: User[] = [];
            querySnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    uid: doc.id,
                    name: userData.name,
                    email: userData.email,
                });
            });
            setSearchResults(users);

        } catch (error: any) {
            console.error('Error searching for users:', error);
            Alert.alert('Error', `Failed to search: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSearchEmail('');
        setSearchResults([]);
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <View style={styles.searchedUserInfo}>
            <View style={styles.profileImage} />
            <View style={styles.searchedUserTextContainer}>
                <Text style={styles.searchedUserName}>{item.name}</Text>
                <Text style={styles.searchedUserEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => handleAddMemberToCollection(item)} // Call the add function here
                disabled={loading}
            >
                <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );

    const handleAddMemberToCollection = async (memberToAdd: User) => {
        if (memberToAdd && auth.currentUser) {
            setLoading(true);
            try {
                const membersCollectionRef = collection(db, 'members');
                const newMemberDocRef = doc(membersCollectionRef);

                await setDoc(newMemberDocRef, {
                    memberId: memberToAdd.uid,
                    ownerId: auth.currentUser.uid,
                    memberName: memberToAdd.name,
                    memberEmail: memberToAdd.email,
                    addedAt: new Date(),
                });

                Alert.alert('Success', `${memberToAdd.name} has been added to your members.`);
                navigation.goBack();
            } catch (error: any) {
                console.error('Error adding member to collection:', error);
                Alert.alert('Error', `Failed to add member: ${error.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            Alert.alert('Error', 'No user selected or user not logged in.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Add Member</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by email"
                    value={searchEmail}
                    onChangeText={setSearchEmail}
                    keyboardType="email-address"
                />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClear}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Results Section */}
            <View style={styles.searchResultsSection}>
                {loading && <ActivityIndicator size="large" color="#6750A4" />}
                {!loading && searchResults.length > 0 && (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.uid}
                        renderItem={renderUserItem}
                    />
                )}
                {!loading && searchResults.length === 0 && searchEmail.trim() !== '' && (
                    <Text style={styles.noResultsText}>No users found with this email.</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerButton: {
        padding: 8,
    },
    searchSection: {
        padding: 20,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    clearButton: {
        backgroundColor: '#E0E0E0',
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    searchButton: {
        backgroundColor: '#6750A4',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    searchResultsSection: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    searchedUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#D0D0D0',
        marginRight: 10,
    },
    searchedUserTextContainer: {
        flex: 1,
    },
    searchedUserName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    searchedUserEmail: {
        fontSize: 14,
        color: 'gray',
    },
    addMemberButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    noResultsText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: 'gray',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default AddMemberScreen;