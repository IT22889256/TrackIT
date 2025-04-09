import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import {  RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';

type ScannedItemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ScannedItems'>;
type ScannedItemsScreenRouteProp = RouteProp<RootStackParamList, 'ScannedItems'>;

type Props = {
    navigation: ScannedItemsScreenNavigationProp;
    route: ScannedItemsScreenRouteProp;
};

type ScannedItem = {
    id: string;
    description: string;
    unitprice: number;
    quantity: number;
    totalPrice: number;
};

const ScannedItemsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { scannedItems } = route.params;
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const addToInventory = async () => {
        if (!auth.currentUser) {
            Alert.alert('Error', 'User not authenticated.');
            return;
        }

        setLoading(true);

        try {
            const userUid = auth.currentUser.uid;
            const inventoryCollectionRef = collection(db, 'users', userUid, 'inventory');

            for (const item of scannedItems) {
                await addDoc(inventoryCollectionRef, {
                    description: item.description,
                    unitprice: item.price,
                    quantity: item.quantity,
                    totalPrice: item.price*item.quantity,
                    addedAt: new Date(),
                    checked: checkedItems[item.id] || false,
                });
            }

            setLoading(false);
            Alert.alert('Success', 'Items added to inventory.');
            navigation.navigate('InventoryItems');
        } catch (error) {
            console.error('Error adding to inventory:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to add items to inventory.');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.title}>Scanned Items</Text>
            <Text style={styles.note}>
                Note: If you want to add an expiration date for an item, make sure to tick the checkbox of the item.
            </Text>

            {scannedItems.length === 0 ? (
                <ActivityIndicator size="large" color="black" />
            ) : (
                <FlatList
                    data={scannedItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            <View>
                                <Text style={styles.label}>Item Name</Text>
                                <Text style={styles.value}>{item.description}</Text>
                                <Text style={styles.label}>Unit Price (1Kg/ 1 Unit)</Text>
                                <Text style={styles.value}>Rs. {item.price}</Text>
                                <Text style={styles.label}>Quantity</Text>
                                <Text style={styles.value}>{item.quantity}</Text>
                                <Text style={styles.label}>Total Price</Text>
                                <Text style={styles.value}>Rs. {(item.price*item.quantity).toFixed(2)}</Text>
                            </View>

                            <TouchableOpacity onPress={() => toggleCheckbox(item.id)}>
                                <FontAwesome name={checkedItems[item.id] ? 'check-square' : 'square-o'} size={30} color="black" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={styles.manualButton} onPress={() => navigation.navigate('ManuallyAddItem')}>
                <Text style={styles.buttonText}>Add Items Manually</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            {loading ? (
                <ActivityIndicator size="large" color="black" />
            ) : (
                <TouchableOpacity style={styles.inventoryButton} onPress={addToInventory}>
                    <Text style={styles.buttonText}>Add to Inventory</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 16 },
    backButton: { position: 'absolute', top: 20, left: 16 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
    note: { fontSize: 12, textAlign: 'center', color: 'gray', marginBottom: 20 },
    itemContainer: { flexDirection: 'row', backgroundColor: 'lightgray', padding: 16, borderRadius: 10, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: 'bold', color: 'black' },
    value: { fontSize: 14, color: 'black', marginBottom: 5 },
    manualButton: { backgroundColor: 'purple', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginVertical: 10 },
    orText: { textAlign: 'center', fontSize: 16, marginVertical: 5 },
    inventoryButton: { backgroundColor: 'blue', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default ScannedItemsScreen;