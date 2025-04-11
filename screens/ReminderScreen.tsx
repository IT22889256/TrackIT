import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Swipeable } from 'react-native-gesture-handler';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { app, auth } from '../firebaseConfig'; // Import your Firebase app and auth

type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminder'>;

type Props = {
    navigation: ReminderScreenNavigationProp;
};

type ExpireItem = {
    id: string;
    productName: string;
    expiryDate: string;
    uid: string;
};

const ReminderScreen: React.FC<Props> = ({ navigation }) => {
    const [items, setItems] = useState<ExpireItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const db = getFirestore(app);

    useEffect(() => {
        const fetchExpireItems = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const expireItemsRef = collection(db, 'expireItems');
                    const q = query(expireItemsRef, where('uid', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const fetchedItems: ExpireItem[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        fetchedItems.push({
                            id: doc.id,
                            productName: data.productName,
                            expiryDate: data.expiryDate,
                            uid: data.uid,
                        });
                    });
                    setItems(fetchedItems);
                } catch (error) {
                    console.error('Error fetching expire items:', error);
                }
            }
        };

        fetchExpireItems();
    }, []);

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getDaysUntilExpiration = (expireDate: string): number => {
        const currentDate = new Date();
        const expirationDate = new Date(expireDate);
        const differenceInTime = expirationDate.getTime() - currentDate.getTime();
        return Math.floor(differenceInTime / (1000 * 3600 * 24));
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => deleteItem(id) },
        ]);
    };

    const deleteItem = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'expireItems', id)); // Delete from 'expireItems'
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Error deleting expire item:', error);
        }
    };

    const handleAddToShoppingList = (item: ExpireItem) => {
        Alert.alert('Add to Shopping List', `Do you want to add "${item.productName}" to your shopping list?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add', onPress: () => addToShoppingList(item) },
        ]);
    };

    const addToShoppingList = (item: ExpireItem) => {
        console.log('Item added to shopping list:', item.productName, item.expiryDate);
        navigation.navigate('ShoppingList', { newItems: [{ name: item.productName, quantity: 1, description: `Expires on ${item.expiryDate}`, completed: false }] });
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.title}>Expiry Soon Items</Text>
            <Text style={styles.note}>
                Swipe Right to delete, swipe left to add to shopping cart.
            </Text>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const daysUntilExpiration = getDaysUntilExpiration(item.expiryDate);
                    let backgroundColor = 'lightgreen';

                    if (daysUntilExpiration < 7) {
                        backgroundColor = '#d91a20';
                    } else if (daysUntilExpiration === 7) {
                        backgroundColor = 'lightyellow';
                    } else {
                        backgroundColor = '#48cf3c';
                    }

                    const rightAction = () => (
                        <TouchableOpacity style={styles.rightAction} onPress={() => handleAddToShoppingList(item)}>
                            <Text style={styles.actionText}>Add to Cart</Text>
                        </TouchableOpacity>
                    );

                    const leftAction = () => (
                        <TouchableOpacity style={styles.leftAction} onPress={() => handleDelete(item.id)}>
                            <Text style={styles.actionText}>Delete</Text>
                        </TouchableOpacity>
                    );

                    return (
                        <Swipeable
                            renderLeftActions={leftAction}
                            renderRightActions={rightAction}
                            onSwipeableLeftOpen={() => handleDelete(item.id)}
                            onSwipeableRightOpen={() => handleAddToShoppingList(item)}
                        >
                            <View style={[styles.itemContainer, { backgroundColor }]}>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemExpireDate}>Expires: {item.expiryDate}</Text>
                                </View>

                                <TouchableOpacity onPress={() => toggleCheckbox(item.id)} style={styles.checkboxContainer}>
                                    <FontAwesome
                                        name={checkedItems[item.id] ? 'check-square' : 'square-o'}
                                        size={24}
                                        color="black"
                                    />
                                </TouchableOpacity>
                            </View>
                        </Swipeable>
                    );
                }}
            />

            <TouchableOpacity style={styles.addItemButton} onPress={() => navigation.navigate('LabelScan')}>
                <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    note: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    itemExpireDate: {
        fontSize: 14,
        color: 'black',
        marginTop: 5,
    },
    checkboxContainer: {
        paddingLeft: 10,
    },
    leftAction: {
        backgroundColor: '#ff4d4d', // Red background for delete
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
        width: 100,
        borderRadius: 10,
    },
    rightAction: {
        backgroundColor: '#4CAF50', // Green background for add to cart
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20,
        width: 100,
        borderRadius: 10,
    },
    actionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    addItemButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 15,
        borderRadius: 12,
        marginVertical: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
    },
});

export default ReminderScreen;