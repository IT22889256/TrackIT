// ShoppingListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    addImage: boolean;
}

const ShoppingListScreen = () => {
    const [items, setItems] = useState<Item[]>([]);
    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        if (route.params?.newItem) {
            setItems((prevItems) => {
                const newItem = route.params.newItem;
                const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id);

                if (existingItemIndex !== -1) {
                    const updatedItems = [...prevItems];
                    updatedItems[existingItemIndex] = newItem;
                    return updatedItems;
                } else {
                    return [...prevItems, newItem];
                }
            });
        }
        console.log("ShoppingListScreen Items: ", items);
    }, [route.params?.newItem]);

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
        <TouchableOpacity onPress={() => navigation.navigate('ItemDetails', { item })}>
            <View style={styles.itemContainer}>
                <Text style={styles.itemName}>Item: {item.name}</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditItems', { item, updateItem: handleUpdateItem })}
                >
                    <Ionicons name="pencil" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveItem(item.id)}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const handleGoBack = () => {
        navigation.navigate('HomeScreen');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="black" />
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
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6750A4',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    itemName: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    editButton: {
        backgroundColor: '#523E90',
        padding: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#523E90',
        padding: 8,
        borderRadius: 8,
    },
    addButton: {
        backgroundColor: 'black',
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