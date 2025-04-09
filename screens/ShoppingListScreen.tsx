import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { collection, doc, onSnapshot, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    addImage: boolean;
    createdAt?: {
        toMillis: () => number;
    };
}

interface Props {
    route: RouteProp<{ params?: { sharedListOwnerId?: string } }, 'params'>;
}

const ShoppingListScreen: React.FC<Props> = ({ route }) => {
    const sharedListOwnerId = '0FTY43gxMhZZzBzqCfds1OuqgoC3'
    // const { sharedListOwnerId } = route.params || {};
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listOwnerId, setListOwnerId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const navigation = useNavigation();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const determineListOwner = async () => {
            if (!currentUserId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            
            try {
                // If sharedListOwnerId is provided, use that, otherwise use current user's ID
                const ownerId = sharedListOwnerId || currentUserId;
                setListOwnerId(ownerId);
            } catch (error) {
                console.error("Error determining list owner:", error);
                Alert.alert("Error", "Failed to load shopping list");
            } finally {
                setLoading(false);
            }
        };

        determineListOwner();
    }, [currentUserId, sharedListOwnerId]);

    useEffect(() => {
        if (!listOwnerId) return;

        const itemsCollectionRef = collection(db, 'users', listOwnerId, 'shoppingList');

        const unsubscribe = onSnapshot(itemsCollectionRef,
            (snapshot) => {
                const fetchedItems: Item[] = [];
                snapshot.forEach(doc => {
                    fetchedItems.push({ id: doc.id, ...doc.data() } as Item);
                });
                fetchedItems.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
                setItems(fetchedItems);
            },
            (error) => {
                console.error("Error fetching shopping list items:", error);
                Alert.alert("Error", "Could not fetch shopping list.");
            }
        );

        return () => unsubscribe();
    }, [listOwnerId]);

    const handleAddItem = () => {
        if (listOwnerId) {
            navigation.navigate('AddItems', { ownerId: listOwnerId });
        } else {
            Alert.alert('Error', 'Could not determine the list owner.');
        }
    };

    const handleRemoveItem = useCallback((id: string) => {
        if (!listOwnerId || !id) return;

        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            const itemDocRef = doc(db, 'users', listOwnerId, 'shoppingList', id);
                            await deleteDoc(itemDocRef);
                        } catch (error) {
                            Alert.alert('Error', 'Could not delete item.');
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    }, [listOwnerId]);

    const handleEditItem = (item: Item) => {
        setSelectedItem(item);
        setEditName(item.name);
        setEditQuantity(String(item.quantity));
        setEditDescription(item.description);
        setIsEditing(true);
        setModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!listOwnerId || !selectedItem) return;

        try {
            const itemDocRef = doc(db, 'users', listOwnerId, 'shoppingList', selectedItem.id);
            await updateDoc(itemDocRef, {
                name: editName,
                quantity: parseInt(editQuantity, 10),
                description: editDescription,
            });
            setIsEditing(false);
            setModalVisible(false);
            setSelectedItem(null);
        } catch (error) {
            Alert.alert('Error', 'Could not update item.');
        }
    };

    const renderItem = ({ item }: { item: Item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => {
                setSelectedItem(item);
                setModalVisible(true);
            }}
        >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>

            <View style={styles.itemActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditItem(item)}
                >
                    <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveItem(item.id)}
                >
                    <Ionicons name="trash" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6750A4" />
            </View>
        );
    }

    const headerTitle = listOwnerId === currentUserId ? "My Shopping List" : "Shared Shopping List";

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                {listOwnerId === currentUserId && (
                    <TouchableOpacity onPress={() => navigation.navigate('ManageMembers', { ownerId: listOwnerId })}>
                        <Ionicons name="people" size={24} color="#000" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No items in the shopping list</Text>}
                contentContainerStyle={styles.listContent}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    setIsEditing(false);
                    setSelectedItem(null);
                }}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{isEditing ? 'Edit Item' : selectedItem?.name}</Text>
                    {selectedItem && isEditing ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={editName}
                                onChangeText={setEditName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Quantity"
                                value={editQuantity}
                                onChangeText={setEditQuantity}
                                keyboardType="number-pad"
                            />
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Description"
                                value={editDescription}
                                onChangeText={setEditDescription}
                                multiline
                            />
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {selectedItem && (
                                <>
                                    <Text>Quantity: {selectedItem.quantity}</Text>
                                    <Text>Description: {selectedItem.description}</Text>
                                </>
                            )}
                        </>
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={() => {
                        setModalVisible(false);
                        setIsEditing(false);
                        setSelectedItem(null);
                    }}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 4,
        flex: 1,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
        marginRight: 10,
    },
    itemActions: {
        flexDirection: 'row',
    },
    editButton: {
        backgroundColor: '#6750A4',
        padding: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        padding: 8,
        borderRadius: 4,
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#6750A4',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 16,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        margin: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 5,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#f44336',
        padding: 12,
        borderRadius: 5,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ShoppingListScreen;