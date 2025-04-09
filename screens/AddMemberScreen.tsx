import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';

type AddMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMember'>;

type Props = {
    navigation: AddMemberScreenNavigationProp;
};

interface Member {
    uid: string;
    name: string;
    email: string;
    profileImage?: string | null;
}

const AddMemberScreen: React.FC<Props> = ({ navigation }) => {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchedMember, setSearchedMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchEmailError, setSearchEmailError] = useState('');
    const currentUserUid = auth.currentUser?.uid;

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSearch = async () => {
        setSearchEmailError('');
        if (!searchEmail.trim()) {
            setSearchEmailError('Please enter an email to search.');
            return;
        }
        if (!validateEmail(searchEmail)) {
            setSearchEmailError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setSearchedMember(null);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", searchEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Error', 'No user found with this email.');
            } else {
                for (const doc of querySnapshot.docs) {
                    const userData = doc.data() as { name: string; email: string; profilePictureUrl?: string | null };
                    if (doc.id !== currentUserUid) {
                        setSearchedMember({
                            uid: doc.id,
                            name: userData.name,
                            email: userData.email,
                            profileImage: userData.profilePictureUrl || null,
                        });
                        break;
                    } else {
                        Alert.alert('Info', 'That\'s your own email address.');
                    }
                }
                if (querySnapshot.size > 0 && !searchedMember) {
                    if (!querySnapshot.docs.some(doc => doc.id !== currentUserUid)) {
                        Alert.alert('Error', 'No other user found with this email.');
                    }
                }
            }
        } catch (error: any) {
            console.error('Error searching for user:', error);
            Alert.alert('Error', `Failed to search: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSearchEmail('');
        setSearchedMember(null);
        setSearchEmailError('');
    };

    const handleAddMember = async () => {
        if (searchedMember && auth.currentUser) {
            if (searchedMember.uid === currentUserUid) {
                Alert.alert('Error', 'You cannot add yourself as a member.');
                return;
            }
            setLoading(true);
            try {
                const membersCollectionRef = collection(db, 'users', auth.currentUser.uid, 'members');
                const q = query(membersCollectionRef, where('uid', '==', searchedMember.uid));
                const existingMembersSnapshot = await getDocs(q);

                if (!existingMembersSnapshot.empty) {
                    Alert.alert('Error', `${searchedMember.name} is already a member.`);
                    setLoading(false);
                    return;
                }

                await addDoc(membersCollectionRef, {
                    uid: searchedMember.uid,
                    name: searchedMember.name,
                    email: searchedMember.email,
                    profileImage: searchedMember.profileImage,
                    ownerId: auth.currentUser.uid, // Store the owner's UID here
                });

                Alert.alert('Success', `${searchedMember.name} has been added to your members.`);
                navigation.goBack();
            } catch (error: any) {
                console.error('Error adding member:', error);
                Alert.alert('Error', `Failed to add member: ${error.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            Alert.alert('Error', 'No member to add or user not logged in.');
        }
    };

    const handleRemoveMember = async () => {
        if (searchedMember && auth.currentUser) {
            if (searchedMember.uid === currentUserUid) {
                Alert.alert('Error', 'You cannot remove yourself.');
                return;
            }
            Alert.alert(
                'Remove Member',
                `Are you sure you want to remove ${searchedMember.name} from your members?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        onPress: async () => {
                            setLoading(true);
                            try {
                                const membersCollectionRef = collection(db, 'users', auth.currentUser.uid, 'members');
                                const q = query(membersCollectionRef, where('uid', '==', searchedMember.uid));
                                const querySnapshot = await getDocs(q);

                                if (!querySnapshot.empty) {
                                    querySnapshot.forEach(async (docToDelete) => {
                                        await deleteDoc(doc(membersCollectionRef, docToDelete.id));
                                    });
                                    Alert.alert('Success', `${searchedMember.name} has been removed.`);
                                    navigation.goBack();
                                } else {
                                    Alert.alert('Error', `${searchedMember.name} is not in your members.`);
                                }
                            } catch (error: any) {
                                console.error('Error removing member:', error);
                                Alert.alert('Error', `Failed to remove member: ${error.message}`);
                            } finally {
                                setLoading(false);
                            }
                        },
                    },
                ],
            );
        } else {
            Alert.alert('Error', 'No member to remove or user not logged in.');
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
                <Text style={styles.label}>Search by Email</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Enter member's email"
                    value={searchEmail}
                    onChangeText={setSearchEmail}
                    keyboardType="email-address"
                />
                {searchEmailError ? <Text style={styles.errorText}>{searchEmailError}</Text> : null}
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

            {/* Member Info Section */}
            <View style={styles.memberInfoSection}>
                {loading && <ActivityIndicator size="large" color="#6750A4" />}
                {searchedMember && (
                    <View style={styles.memberInfo}>
                        {searchedMember.profileImage ? (
                            <Image source={{ uri: searchedMember.profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder} />
                        )}
                        <View style={styles.memberTextContainer}>
                            <Text style={styles.memberName}>{searchedMember.name}</Text>
                            <Text style={styles.memberEmail}>{searchedMember.email}</Text>
                        </View>
                        <View style={styles.addRemoveButtonContainer}>
                            <TouchableOpacity
                                style={styles.addMemberButton}
                                onPress={handleAddMember}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeMemberButton}
                                onPress={handleRemoveMember}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: 'gray',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
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
        textAlign: 'center',
    },
    memberInfoSection: {
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        justifyContent: 'space-between',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    profileImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#D0D0D0',
        marginRight: 10,
    },
    memberTextContainer: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberEmail: {
        fontSize: 14,
        color: 'gray',
    },
    addRemoveButtonContainer: {
        flexDirection: 'row',
    },
    addMemberButton: {
        backgroundColor: '#6750A4',
        padding: 8,
        borderRadius: 5,
        marginRight: 5,
    },
    removeMemberButton: {
        backgroundColor: '#CF1F1F',
        padding: 8,
        borderRadius: 5,
    },
});

export default AddMemberScreen;