import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';

type MembersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Members'>;

type Member = {
    id: string; // This will be the document ID in the 'members' collection
    memberName: string;
    memberEmail: string;
};

const MembersScreen: React.FC<{ navigation: MembersScreenNavigationProp }> = ({ navigation }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!auth.currentUser) {
                throw new Error('User not authenticated');
            }

            const membersCollectionRef = collection(db, 'members');
            const q = query(membersCollectionRef, where('ownerId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            const membersArray: Member[] = [];
            querySnapshot.forEach(doc => {
                const memberData = doc.data();
                membersArray.push({
                    id: doc.id,
                    memberName: memberData.memberName || 'No name',
                    memberEmail: memberData.memberEmail || 'No email',
                });
            });

            setMembers(membersArray);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchMembers);
        return unsubscribe;
    }, [navigation]);

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
                        try {
                            setLoading(true);
                            if (!auth.currentUser) return;

                            const memberDocRef = doc(db, 'members', memberId);
                            const memberSnapshot = await getDoc(memberDocRef);

                            if (memberSnapshot.exists()) {
                                const memberData = memberSnapshot.data();
                                if (memberData?.ownerId === auth.currentUser.uid) {
                                    await deleteDoc(memberDocRef);
                                    setMembers(prev => prev.filter(m => m.id !== memberId));
                                    Alert.alert('Success', 'Member removed successfully');
                                } else {
                                    Alert.alert('Error', 'You do not have permission to remove this member.');
                                }
                            } else {
                                Alert.alert('Error', 'Member not found.');
                            }
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

    const renderMemberItem = ({ item }: { item: Member }) => (
        <View key={item.id} style={styles.memberCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.memberName.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.memberName}</Text>
                <Text style={styles.memberEmail}>{item.memberEmail}</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveMember(item.id, item.memberName)}
            >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

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
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMemberItem}
                    />
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