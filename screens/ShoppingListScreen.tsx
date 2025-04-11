import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ItemDetailsScreen from './ItemDetailsScreen';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, onSnapshot, query, where, or } from 'firebase/firestore';

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    completed: boolean;
    ownerId: string;
    sharedWith?: string[]; // Array of member IDs who have access
}

const ShoppingListScreen = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const currentUserId = auth.currentUser?.uid;

    const checkUserRole = useCallback(async () => {
        if (!currentUserId) {
            setIsOwner(false);
            return;
        }
        try {
            const membersQuery = query(
                collection(db, 'members'),
                where('memberId', '==', currentUserId)
            );
            const memberSnapshot = await getDocs(membersQuery);
            setIsOwner(memberSnapshot.empty); // If no member doc, assume owner
        } catch (error) {
            console.error('Error checking user role:', error);
            setIsOwner(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        checkUserRole();
    }, [checkUserRole]);

    useEffect(() => {
        if (!currentUserId) {
            console.warn('User not logged in, cannot fetch shopping list.');
            setItems([]);
            return;
        }

        const q = query(
            collection(db, 'shoppingList'),
            or(
                where('ownerId', '==', currentUserId),
                where('sharedWith', 'array-contains', currentUserId)
            )
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const loadedItems: Item[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Item, 'id'>),
                }));
                setItems(loadedItems);
            },
            (error) => {
                console.error('Error listening for shopping list updates:', error);
                Alert.alert('Error', 'Failed to load shopping list.');
            }
        );

        return () => unsubscribe();
    }, [currentUserId]);

    useEffect(() => {
        if (route.params?.newItems) {
            const updateItems = async () => {
                try {
                    const newItems = route.params.newItems.map(newItem => ({
                        ...newItem,
                        ownerId: currentUserId,
                        sharedWith: newItem.sharedWith || [] // Initialize sharedWith array
                    }));

                    for (const newItem of newItems) {
                        if (newItem.id) {
                            // Update existing item
                            await updateDoc(doc(db, 'shoppingList', newItem.id), newItem);
                        } else {
                            // Add new item
                            await addDoc(collection(db, 'shoppingList'), newItem);
                        }
                    }
                } catch (error) {
                    console.error('Error updating items:', error);
                    Alert.alert('Error', 'Failed to update shopping list.');
                }
            };
            updateItems();
        }
    }, [route.params?.newItems, currentUserId]);

    const handleAddItem = () => {
        navigation.navigate('AddItems');
    };

    const handleRemoveItem = async (id: string) => {
        const itemToDelete = items.find(item => item.id === id);
        if (!itemToDelete) return;

        if (itemToDelete.ownerId !== currentUserId) {
            Alert.alert('Permission Denied', 'You can only delete items you added.');
            return;
        }

        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'shoppingList', id));
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item.');
                        }
                    }},
            ],
            { cancelable: false }
        );
    };

    const handleUpdateItem = async (updatedItem: Item) => {
        const originalItem = items.find(item => item.id === updatedItem.id);
        if (!originalItem) return;

        if (originalItem.ownerId !== currentUserId && !originalItem.sharedWith?.includes(currentUserId || '')) {
            Alert.alert('Permission Denied', 'You cannot update this item.');
            return;
        }

        try {
            await updateDoc(doc(db, 'shoppingList', updatedItem.id), updatedItem);
        } catch (error) {
            console.error('Error updating item:', error);
            Alert.alert('Error', 'Failed to update item.');
        }
    };

    const handleToggleComplete = async (id: string) => {
        const itemToUpdate = items.find(item => item.id === id);
        if (!itemToUpdate) return;

        if (itemToUpdate.ownerId !== currentUserId && !itemToUpdate.sharedWith?.includes(currentUserId || '')) {
            Alert.alert('Permission Denied', 'You cannot change the completion status of this item.');
            return;
        }

        try {
            const updatedItem = { ...itemToUpdate, completed: !itemToUpdate.completed };
            await updateDoc(doc(db, 'shoppingList', id), updatedItem);
        } catch (error) {
            console.error('Error toggling complete:', error);
            Alert.alert('Error', 'Failed to toggle item completion.');
        }
    };

    const renderItem = ({ item }: { item: Item }) => {
        const canEdit = item.ownerId === currentUserId || item.sharedWith?.includes(currentUserId || '');
        const isOwned = item.ownerId === currentUserId;

        return (
            <TouchableOpacity
                style={[styles.itemCard, item.completed && styles.completedCard]}
                onPress={() => {
                    setSelectedItem(item);
                    setModalVisible(true);
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity
                        onPress={() => handleToggleComplete(item.id)}
                        disabled={!canEdit || item.completed}
                    >
                        <Ionicons
                            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={item.completed ? '#6750A4' : (canEdit ? '#000' : 'gray')}
                            style={styles.checkMark}
                        />
                    </TouchableOpacity>
                    <View style={styles.itemTextContainer}>
                        <Text style={[styles.itemName, item.completed && styles.completedText]}>
                            {item.name}
                        </Text>
                        {!isOwned && (
                            <Text style={styles.sharedItemLabel}>Shared by owner</Text>
                        )}
                    </View>
                </View>
                {canEdit && !item.completed && (
                    <View style={styles.itemActions}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditItems', {
                                item,
                                updateItem: handleUpdateItem,
                                isOwner: isOwned
                            })}
                        >
                            <Ionicons name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                        {isOwned && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleRemoveItem(item.id)}
                            >
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const handleGoBack = () => {
        navigation.navigate('Main');
    };

    const handleClearAll = async () => {
        if (!isOwner) {
            Alert.alert('Permission Denied', 'Only the list owner can clear all items.');
            return;
        }

        Alert.alert(
            'Clear All Items',
            'Are you sure you want to clear all items you own?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: async () => {
                        try {
                            const q = query(collection(db, 'shoppingList'), where('ownerId', '==', currentUserId));
                            const querySnapshot = await getDocs(q);
                            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(deletePromises);
                        } catch (error) {
                            console.error('Error clearing items:', error);
                            Alert.alert('Error', 'Failed to clear items.');
                        }
                    }},
            ],
            { cancelable: false }
        );
    };

    const handleShareList = () => {
        if (!isOwner) {
            Alert.alert('Permission Denied', 'Only the list owner can share the list.');
            return;
        }
        navigation.navigate('ShareList', {
            currentSharedWith: items[0]?.sharedWith || [],
            ownerId: currentUserId
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isOwner ? 'Your Shopping List' : 'Shared Shopping List'}
                </Text>
                <View style={styles.headerRight}>
                    {isOwner && (
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={handleShareList}
                        >
                            <Ionicons name="share-social" size={24} color="#000" />
                        </TouchableOpacity>
                    )}
                    {isOwner && (
                        <TouchableOpacity
                            style={styles.clearAllButton}
                            onPress={handleClearAll}
                        >
                            <Ionicons name="trash" size={24} color="#000" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>
                        {isOwner ? 'Your shopping list is empty.' : 'The shared list is empty.'}
                    </Text>
                    <Text style={styles.emptyListHint}>
                        {isOwner ? 'Click the "+" button to add items.' : 'Items added by the owner will appear here.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Ionicons name="add" size={36} color="#fff" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                {selectedItem && (
                    <ItemDetailsScreen
                        item={selectedItem}
                        onClose={() => setModalVisible(false)}
                        canEdit={selectedItem.ownerId === currentUserId ||
                                 selectedItem.sharedWith?.includes(currentUserId || '')}
                    />
                )}
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        justifyContent: 'space-between',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
    },
    shareButton: {
        marginRight: 16,
    },
    clearAllButton: {
        marginLeft: 8,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    itemTextContainer: {
        flex: 1,
        marginLeft: 8,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '500',
    },
    sharedItemLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    itemActions: {
        flexDirection: 'row',
    },
    editButton: {
        backgroundColor: '#6750A4',
        padding: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        padding: 8,
        borderRadius: 8,
    },
    addButton: {
        backgroundColor: '#6750A4',
        borderRadius: 36,
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    completedCard: {
        backgroundColor: '#f8f8f8',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    checkMark: {
        marginRight: 8,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyListText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyListHint: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default ShoppingListScreen;