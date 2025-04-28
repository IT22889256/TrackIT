// ShoppingListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ItemDetailsScreen from './ItemDetailsScreen';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    completed: boolean;
}

const ShoppingListScreen = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        const loadItems = async () => {
            if (auth.currentUser) {
                try {
                    const itemsCollection = collection(db, 'users', auth.currentUser.uid, 'shoppingList');
                    const querySnapshot = await getDocs(itemsCollection);
                    const loadedItems: Item[] = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as Omit<Item, 'id'>)
                    }));
                    setItems(loadedItems);
                } catch (error) {
                    console.error('Error loading items:', error);
                    Alert.alert('Error', 'Failed to load shopping list.');
                }
            }
        };

        loadItems();
    }, []);

    useEffect(() => {
        if (route.params?.newItems) {
            const updateItems = async () => {
                if (auth.currentUser) {
                    try {
                        const newItems = route.params.newItems;
                        const updatedItems = [...items];

                        for (const newItem of newItems) {
                            const existingItemIndex = updatedItems.findIndex(item => item.id === newItem.id);
                            if (existingItemIndex !== -1) {
                                updatedItems[existingItemIndex] = newItem;
                                await updateDoc(doc(db, 'users', auth.currentUser.uid, 'shoppingList', newItem.id), {
                                    ...newItem
                                });
                            } else {
                                const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'shoppingList'), {
                                    ...newItem
                                });
                                updatedItems.push({ ...newItem, id: docRef.id });
                            }
                        }
                        setItems(updatedItems);
                    } catch (error) {
                        console.error('Error updating items:', error);
                        Alert.alert('Error', 'Failed to update shopping list.');
                    }
                }
            };
            updateItems();
        }
        console.log("ShoppingListScreen Items: ", items);
    }, [route.params?.newItems]);

    const handleAddItem = () => {
        navigation.navigate('AddItems');
    };

    const handleRemoveItem = async (id: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: async () => {
                    if (auth.currentUser) {
                        try {
                            await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'shoppingList', id));
                            setItems(items.filter((item) => item.id !== id));
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item.');
                        }
                    }
                }},
            ],
            { cancelable: false }
        );
    };

    const handleUpdateItem = async (updatedItem: Item) => {
        if (auth.currentUser) {
            try {
                await updateDoc(doc(db, 'users', auth.currentUser.uid, 'shoppingList', updatedItem.id), {
                    ...updatedItem
                });
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === updatedItem.id ? updatedItem : item
                    )
                );
            } catch (error) {
                console.error('Error updating item:', error);
                Alert.alert('Error', 'Failed to update item.');
            }
        }
    };

    const handleToggleComplete = async (id: string) => {
        const itemToUpdate = items.find(item => item.id === id);
        if (itemToUpdate && auth.currentUser) {
            try {
                const updatedItem = { ...itemToUpdate, completed: !itemToUpdate.completed };
                await updateDoc(doc(db, 'users', auth.currentUser.uid, 'shoppingList', id), updatedItem);
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === id ? updatedItem : item
                    )
                );
            } catch (error) {
                console.error('Error toggling complete:', error);
                Alert.alert('Error', 'Failed to toggle item completion.');
            }
        }
    };

    const renderItem = ({ item }: { item: Item }) => (
        <TouchableOpacity
            style={[styles.itemCard, item.completed && styles.completedCard]}
            onPress={() => {
                setSelectedItem(item);
                setModalVisible(true);
            }}
            disabled={item.completed}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() => handleToggleComplete(item.id)}>
                    <Ionicons
                        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={item.completed ? '#6750A4' : '#000'}
                        style={styles.checkMark}
                    />
                </TouchableOpacity>
                <Text style={[styles.itemName, item.completed && styles.completedText]}>{item.name}</Text>
            </View>
            {!item.completed && (
                <View style={styles.itemActions}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditItems', { item, updateItem: handleUpdateItem })}
                    >
                        <Ionicons name="pencil" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveItem(item.id)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const handleGoBack = () => {
        navigation.navigate('Main');
    };

    const handleClearAll = async () => {
        Alert.alert(
            'Clear All Items',
            'Are you sure you want to clear all items?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: async () => {
                    if (auth.currentUser) {
                        try {
                            const itemsCollection = collection(db, 'users', auth.currentUser.uid, 'shoppingList');
                            const querySnapshot = await getDocs(itemsCollection);
                            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(deletePromises);
                            setItems([]);
                        } catch (error) {
                            console.error('Error clearing all items:', error);
                            Alert.alert('Error', 'Failed to clear all items.');
                        }
                    }
                }},
            ],
            { cancelable: false }
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shopping List</Text>
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
                    <Ionicons name="trash" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
            />

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
                    <ItemDetailsScreen item={selectedItem} onClose={() => setModalVisible(false)} />
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
    clearAllButton: {
        marginLeft: 16,
    },
    list: {
        flex: 1,
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
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
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
        alignSelf: 'center',
    },
    completedCard: {
        backgroundColor: '#eee',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: 'gray',
    },
    checkMark: {
        marginRight: 5,
    },
});

export default ShoppingListScreen;