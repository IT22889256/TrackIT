import Footer from '@/components/Footer';
import { RootStackParamList } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

type InventoryItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: InventoryItemScreenNavigationProp;
};

type InventoryItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    expiryDate?: string; // Optional expiry date
};

const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null; // No expiry date
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
};

// Dummy data with expiry dates
const inventoryData: InventoryItem[] = [
    { id: '1', name: 'Item Name', quantity: 2, price: 350 }, // No expiry date
    { id: '2', name: 'Item Name', quantity: 2, price: 350, expiryDate: '2025-03-23' }, // 2 days left
    { id: '3', name: 'Item Name', quantity: 2, price: 350, expiryDate: '2025-03-25' }, // 4 days left
    { id: '4', name: 'Item Name', quantity: 2, price: 350, expiryDate: '2025-03-29' }, // 8 days left
    { id: '5', name: 'Item Name', quantity: 2, price: 350 }, // No expiry date
];

// Function to determine background color
const getBackgroundColor = (expiryDays: number | null) => {
    if (expiryDays === null) return '#D3D3D3'; // No expiry date (Gray)
    if (expiryDays <= 2) return '#FF6B6B'; // Red (Expiring soon)
    if (expiryDays <= 5) return '#90EE90'; // Green (Safe)
    if (expiryDays > 5) return '#FFFF99'; // Yellow (Longer time left)
    return '#D3D3D3'; // Default Gray
};

const InventoryItemsScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inventory</Text>
            <TouchableOpacity style={styles.backButton} onPress={()=>navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <FlatList
                data={inventoryData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const expiryDays = getDaysUntilExpiry(item.expiryDate);
                    const backgroundColor = getBackgroundColor(expiryDays);

                    return (
                        <View style={[styles.itemContainer, { backgroundColor }]}>
                            <View>
                                <Text style={styles.itemName}>Item Name</Text>
                                <Text style={styles.itemDetails}>{item.quantity}</Text>
                                <Text style={styles.price}>Rs. {item.price}</Text>
                            </View>

                            <View style={styles.rightSection}>
                                <TouchableOpacity>
                                    <Text style={styles.moreText}>Reminder {'>>'}</Text>
                                </TouchableOpacity>
                                {expiryDays !== null ? (
                                    <Text style={styles.expiryText}>{expiryDays} Days</Text>
                                ) : (
                                    <Text style={styles.expiryText}>Add Expiry Date</Text>
                                )}
                            </View>
                           
                        </View>
                        
                    );
                }}
            />
             <Footer navigation={navigation} />
        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemDetails: {
        fontSize: 14,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    moreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
    },
    expiryText: {
        fontSize: 14,
        color: 'black',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 16,
    },
});

export default InventoryItemsScreen;
