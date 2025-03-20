import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useState } from 'react';

type ScannedItemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
  navigation: ScannedItemsScreenNavigationProp;
};

type ScannedItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

const dummyData: ScannedItem[] = [
    { id: '1', name: 'Item Name', price: 350, quantity: 2 },
    { id: '2', name: 'Item Name', price: 350, quantity: 2 },
    { id: '3', name: 'Item Name', price: 350, quantity: 2 },
    { id: '4', name: 'Item Name', price: 350, quantity: 2 },
];

const ScannedItemsScreen: React.FC<Props> = ({ navigation }) => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.title}>Scanned Items</Text>
            <Text style={styles.note}>
                Note: If you want to add an expiration date for an item, make sure to tick the checkbox of the item.
            </Text>

            <FlatList
                data={dummyData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.itemContainer}>
                        <View>
                            <Text style={styles.label}>Item Name</Text>
                            <Text style={styles.value}>{item.name}</Text>
                            <Text style={styles.label}>Price</Text>
                            <Text style={styles.value}>Rs. {item.price}</Text>
                            <Text style={styles.label}>Quantity</Text>
                            <Text style={styles.value}>{item.quantity}</Text>
                        </View>

                        <TouchableOpacity onPress={() => toggleCheckbox(item.id)}>
                            <FontAwesome name={checkedItems[item.id] ? 'check-square' : 'square-o'} size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.manualButton}>
                <Text style={styles.buttonText}>Add Items Manually</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            <TouchableOpacity style={styles.inventoryButton}>
                <Text style={styles.buttonText}>Add to Inventory</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    note: {
        fontSize: 12,
        textAlign: 'center',
        color: 'gray',
        marginBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: 'lightgray',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
    },
    value: {
        fontSize: 14,
        color: 'black',
        marginBottom: 5,
    },
    manualButton: {
        backgroundColor: 'purple',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 10,
    },
    orText: {
        textAlign: 'center',
        fontSize: 16,
        marginVertical: 5,
    },
    inventoryButton: {
        backgroundColor: 'blue',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ScannedItemsScreen;
