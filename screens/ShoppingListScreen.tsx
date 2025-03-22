// ShoppingListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ItemDetailsScreen from './ItemDetailsScreen';

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    addImage: boolean;
}

const ShoppingListScreen = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        if (route.params?.newItems) {
            setItems((prevItems) => {
                const newItems = route.params.newItems;
                const updatedItems = [...prevItems];

                newItems.forEach(newItem => {
                    const existingItemIndex = updatedItems.findIndex((item) => item.id === newItem.id);
                    if (existingItemIndex !== -1) {
                        updatedItems[existingItemIndex] = newItem;
                    } else {
                        updatedItems.push(newItem);
                    }
                });
                return updatedItems;
            });
        }
        console.log("ShoppingListScreen Items: ", items);
    }, [route.params?.newItems]);

    const handleAddItem = () => {
        navigation.navigate('AddItems');
    };

    const handleRemoveItem = (id: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => setItems(items.filter((item) => item.id !== id)) },
            ],
            { cancelable: false }
        );
    };

    const handleUpdateItem = (updatedItem: Item) => {
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            )
        );
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
        </TouchableOpacity>
    );

    const handleGoBack = () => {
        navigation.navigate('Main'); // Navigate to HomeScreen
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shopping List</Text>
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
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
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
});

export default ShoppingListScreen;