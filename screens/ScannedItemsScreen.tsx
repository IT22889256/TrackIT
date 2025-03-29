import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';

type ScannedItemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ScannedItems'>;
type ScannedItemsScreenRouteProp = RouteProp<RootStackParamList, 'ScannedItems'>;

type Props = {
    navigation: ScannedItemsScreenNavigationProp;
    route: ScannedItemsScreenRouteProp;
};

type ScannedItem = {
    id: string;
    description: string;
    price: number;
    quantity: number;
};

const ScannedItemsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { scannedItems } = route.params;
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
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
            )}

            <TouchableOpacity style={styles.manualButton} onPress={() => navigation.navigate('ManuallyAddItem')}>
                <Text style={styles.buttonText}>Add Items Manually</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            <TouchableOpacity style={styles.inventoryButton} onPress={() => navigation.navigate('InventoryItems')}>
                <Text style={styles.buttonText}>Add to Inventory</Text>
            </TouchableOpacity>
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
