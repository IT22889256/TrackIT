import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';

type MembersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Members'>;

type Member = {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null; // Profile image URL is now directly in the member doc
};

const MembersScreen: React.FC<{ navigation: MembersScreenNavigationProp }> = ({ navigation }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchMembers();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        fetchMembers();
    }, [userId]);

    const fetchMembers = async () => {
        if (!userId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const membersCollectionRef = collection(db, 'users', userId, 'members');

        // Check if the subcollection exists before trying to fetch
        try {
            const snapshot = await getDocs(membersCollectionRef);
            if (!snapshot.empty) {
                const unsubscribe = onSnapshot(
                    membersCollectionRef,
                    (snapshot) => {
                        const fetchedMembers: Member[] = [];
                        snapshot.forEach((doc) => {
                            fetchedMembers.push({ id: doc.id, ...doc.data() } as Member);
                        });
                        setMembers(fetchedMembers);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Error fetching members:', err);
                        setError('Failed to load members');
                        setLoading(false);
                    }
                );
                // Cleanup the listener when the component unmounts or userId changes
                return () => unsubscribe();
            } else {
                setMembers([]);
                setLoading(false);
            }
        } catch (error: any) {
            console.error('Error checking for members subcollection:', error);
            setError('Failed to check for members');
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        Alert.alert(
            'Confirm Removal',
            `Remove ${memberName} from your members?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        if (!userId) {
                            Alert.alert('Error', 'User not authenticated');
                            return;
                        }
                        setLoading(true);
                        try {
                            const memberDocRef = doc(db, 'users', userId, 'members', memberId);
                            await deleteDoc(memberDocRef);
                            Alert.alert('Success', 'Member removed successfully');
                        } catch (err) {
                            console.error('Remove error:', err);
                            Alert.alert('Error', 'Failed to remove member');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6750A4" />
                <Text>Loading members...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Your Members</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.listContainer}>
                {members.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="#999" />
                        <Text style={styles.emptyText}>No members added yet</Text>
                    </View>
                ) : (
                    members.map(member => (
                        <View key={member.id} style={styles.memberCard}>
                            {member.profileImage ? (
                                <Image source={{ uri: member.profileImage }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {member?.name?.charAt(0)?.toUpperCase() || ''}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberEmail}>{member.email}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleRemoveMember(member.id, member.name)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddMember')}
            >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#6750A4',
        padding: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    listContainer: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6750A4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    deleteButton: {
        padding: 8,
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#6750A4',
        borderRadius: 8,
        padding: 16,
        margin: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});

export default MembersScreen;