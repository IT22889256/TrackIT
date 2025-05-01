import React, { useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, TextInput
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // Ensure Ionicons is imported
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator'; // Ensure path is correct
import { auth, db } from '../firebaseConfig'; // Ensure path is correct
import { collection, addDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';

// --- Priority Setup ---
type PriorityLevel = 'Essential' | 'Important' | 'Optional';
const priorityLevels: PriorityLevel[] = ['Essential', 'Important', 'Optional'];
const DEFAULT_PRIORITY: PriorityLevel = 'Important';

// --- Unit Setup ---
type MeasurementUnit = 'Unit' | 'Kg' | 'g';
const measurementUnits: MeasurementUnit[] = ['Unit', 'Kg', 'g'];
const DEFAULT_UNIT: MeasurementUnit = 'Unit';

// --- Navigation/Props ---
type ScannedItemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ScannedItems'>;
type ScannedItemsScreenRouteProp = RouteProp<RootStackParamList, 'ScannedItems'>;

type Props = {
    navigation: ScannedItemsScreenNavigationProp;
    route: ScannedItemsScreenRouteProp;
};

// --- Item Structure ---
type ScannedItem = {
    id: string;
    description: string;
    price: number; // Unit price
    quantity: number;
};

// --- Component ---
const ScannedItemsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { scannedItems } = route.params;
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [itemPriorities, setItemPriorities] = useState<Record<string, PriorityLevel>>({});
    const [itemDescriptions, setItemDescriptions] = useState<Record<string, string>>(
        scannedItems.reduce((acc, item) => ({ ...acc, [item.id]: item.description }), {})
    );
    const [itemMeasurementUnits, setItemMeasurementUnits] = useState<Record<string, MeasurementUnit>>(
        scannedItems.reduce((acc, item) => ({ ...acc, [item.id]: DEFAULT_UNIT }), {})
    );
    
    const [loading, setLoading] = useState(false);

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const selectPriority = (id: string, priority: PriorityLevel) => {
        setItemPriorities((prev) => ({
            ...prev,
            [id]: priority,
        }));
    };

    const updateItemDescription = (id: string, newDescription: string) => {
        setItemDescriptions((prev) => ({ ...prev, [id]: newDescription }));
    };

    const selectMeasurementUnit = (id: string, unit: MeasurementUnit) => {
        setItemMeasurementUnits((prev) => ({ ...prev, [id]: unit }));
    };

    const addToInventory = async () => {
        if (!auth.currentUser) {
            Alert.alert('Error', 'User not authenticated.');
            return;
        }
        setLoading(true);
        try {
            const userUid = auth.currentUser.uid;
            const inventoryCollectionRef = collection(db, 'inventory'); // Changed to 'inventory' collection

            for (const item of scannedItems) {
                const priority = itemPriorities[item.id] || DEFAULT_PRIORITY;
                const description = itemDescriptions[item.id] || item.description;
                const measurementUnit = itemMeasurementUnits[item.id] || DEFAULT_UNIT;
                let quantityToStore = item.quantity;

                if (measurementUnit === 'Unit') {
                    quantityToStore = parseFloat(item.quantity.toFixed(1));
                }

                await addDoc(inventoryCollectionRef, {
                    uid: userUid, // Added user's UID to the item data
                    ownerId: userUid,
                    description: description, // Use potentially updated description
                    unitprice: item.price,
                    quantity: quantityToStore,
                    measurementUnit: measurementUnit, // Store the selected unit
                    currentStock: quantityToStore,
                    totalPrice: item.price * item.quantity,
                    addedAt: new Date(),
                    checked: checkedItems[item.id] || false, // This flags if user wants to add expiry later
                    priority: priority,
                    expiryDate: null, // Initially set expiryDate to null
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

    // --- Render Item Function ---
    const renderItem = ({ item }: { item: ScannedItem }) => {
        const totalPrice = (item.price * item.quantity).toFixed(2);
        const unitPrice = item.price?.toFixed(2) ?? 'N/A';
        const currentDescription = itemDescriptions[item.id] || item.description;
        const currentUnit = itemMeasurementUnits[item.id] || DEFAULT_UNIT;

        return (
            <View style={styles.itemCard}>
                {/* Main Content Area */}
                <View style={styles.itemContent}>
                    <TextInput
                        style={[styles.itemName, styles.editableItemName]}
                        numberOfLines={2}
                        value={currentDescription}
                        onChangeText={(text) => updateItemDescription(item.id, text)}
                        placeholder="Item Name"
                    />

                    {/* Details Row */}
                    <View style={styles.detailsRow}>
                        {/* Quantity */}
                        <View style={styles.detailItem}>
                            <Ionicons name="file-tray-stacked-outline" size={16} color="#555" style={styles.detailIcon}/>
                            <Text style={styles.detailText}>Qty: {item.quantity ?? 'N/A'}</Text>
                        </View>
                        {/* Unit Price */}
                        <View style={styles.detailItem}>
                            <Ionicons name="pricetag-outline" size={16} color="#555" style={styles.detailIcon}/>
                            <Text style={styles.detailText}>Unit: Rs. {unitPrice}</Text>
                        </View>
                        {/* Total Price */}
                        <View style={styles.detailItem}>
                            <Ionicons name="cash-outline" size={16} color="#555" style={styles.detailIcon}/>
                            <Text style={styles.detailText}>Total: Rs. {totalPrice}</Text>
                        </View>
                    </View>

                    {/* Measurement Unit Selection */}
                    <View style={styles.unitSection}>
                        <Text style={styles.unitLabel}>Select Unit:</Text>
                        <View style={styles.unitButtonsContainer}>
                            {measurementUnits.map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.unitButton,
                                        currentUnit === unit && styles.unitButtonSelected,
                                    ]}
                                    onPress={() => selectMeasurementUnit(item.id, unit)}
                                >
                                    <Text
                                        style={[
                                            styles.unitButtonText,
                                            currentUnit === unit && styles.unitButtonTextSelected,
                                        ]}
                                    >
                                        {unit}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.prioritySection}>
                        <Text style={styles.priorityLabel}>Set Priority:</Text>
                        <View style={styles.priorityButtonsContainer}>
                            {priorityLevels.map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.priorityButton,
                                        (itemPriorities[item.id] || DEFAULT_PRIORITY) === level && styles.priorityButtonSelected,
                                    ]}
                                    onPress={() => selectPriority(item.id, level)}
                                >
                                    <Text
                                        style={[
                                            styles.priorityButtonText,
                                            (itemPriorities[item.id] || DEFAULT_PRIORITY) === level && styles.priorityButtonTextSelected,
                                        ]}
                                    >
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Checkbox Area */}
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity onPress={() => toggleCheckbox(item.id)} style={styles.checkboxTouchable}>
                        <FontAwesome
                            name={checkedItems[item.id] ? 'check-square' : 'square-o'}
                            size={28} // Slightly smaller
                            color={checkedItems[item.id] ? '#007AFF' : '#8E8E93'} // Use iOS blue / gray
                        />
                        <Text style={styles.checkboxLabel}>
                            Add
                            Expiry?
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };


    // --- Main Component Return ---
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.title}>Review Scanned Items</Text>
            <Text style={styles.note}>
                Adjust name, select unit, priority and check box to add expiry date later in inventory.
            </Text>

            {scannedItems.length === 0 && !loading ? (
                <View style={styles.emptyListContainer}>
                    <Ionicons name="document-text-outline" size={50} color="gray" />
                    <Text style={styles.emptyListText}>No items found from scan.</Text>
                </View>
            ) : (
                <FlatList
                    data={scannedItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContentContainer}
                    // ItemSeparatorComponent={() => <View style={styles.separator} />} // Optional separator
                />
            )}


            <View style={styles.bottomButtonContainer}>
                

                <View style={{height: 10}} />

                {loading ? (
                    <View style={[styles.actionButton, styles.inventoryButton, {justifyContent: 'center'}]}>
                        <ActivityIndicator size="small" color="white" />
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.actionButton, styles.inventoryButton]} onPress={addToInventory}>
                        <Ionicons name="checkmark-done-outline" size={20} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Add All to Inventory</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background
        paddingTop: 55, // Adjust if needed
    },
    backButton: {
        position: 'absolute',
        top: 55, // Align with title adjustment
        left: 16,
        zIndex: 1,
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    note: {
        fontSize: 12,
        textAlign: 'center',
        color: 'gray',
        marginBottom: 15,
        paddingHorizontal: 16,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 140, // Ensure space for bottom buttons
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyListText: {
        marginTop: 10,
        fontSize: 16,
        color: 'gray',
    },
    // Item Card Styling
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden', // Ensures children adhere to border radius
    },
    itemContent: {
        flex: 1, // Takes most space
        padding: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 5, // Reduced margin for better spacing with other elements
    },
    editableItemName: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 5,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Space out details
        alignItems: 'center',
        marginBottom: 8, // Reduced margin
        flexWrap: 'wrap', // Allow wrapping on small screens if needed
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10, // Space between detail items
        marginBottom: 3, // Reduced margin if wrapping
    },
    detailIcon: {
        marginRight: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#495057',
    },
    // Priority Styles adapted for Card
    prioritySection: {
        marginTop: 10, // Adjusted margin
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    priorityLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6C757D', // Gray label
        marginBottom: 6,
    },
    priorityButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    priorityButton: {
        borderWidth: 1,
        borderColor: '#007AFF', // iOS Blue
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 6,
        backgroundColor: 'white',
    },
    priorityButtonSelected: {
        backgroundColor: '#007AFF', // iOS Blue fill
    },
    priorityButtonText: {
        color: '#007AFF', // iOS Blue text
        fontSize: 12,
        fontWeight: '600',
    },
    priorityButtonTextSelected: {
        color: 'white',
    },
    // Checkbox Area Styling
    checkboxContainer: {
        width: 75, // Fixed width for the right section
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#EEE', // Subtle separator
        padding: 5,
        backgroundColor: '#F8F9FA', // Slightly different background
    },
    checkboxTouchable: {
        alignItems: 'center', // Center icon and text
    },
    checkboxLabel: {
        fontSize: 10,
        color: '#6C757D',
        marginTop: 3,
        textAlign: 'center',
    },
    // Bottom Buttons Container
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 25, // Extra padding for home bar area etc.
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        height: 48,
    },
    manualButton: {
        backgroundColor: '#5856D6', // iOS Purple
    },
    inventoryButton: {
        backgroundColor: '#007AFF', // iOS Blue
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600', // Medium weight
    },
    // Unit Selection Styles
    unitSection: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    unitLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6C757D',
        marginBottom: 6,
    },
    unitButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    unitButton: {
        borderWidth: 1,
        borderColor: '#007AFF', // iOS Blue
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 6,
        backgroundColor: 'white',
    },
    unitButtonSelected: {
        backgroundColor: '#007AFF', // iOS Blue fill
    },
    unitButtonText: {
        color: '#007AFF', // iOS Blue text
        fontSize: 12,
        fontWeight: '600',
    },
    unitButtonTextSelected: {
        color: 'white',
    },
    // separator: { // Optional separator style
    //     height: 1,
    //     backgroundColor: '#E5E5E5',
    //     marginVertical: 5,
    // }
    // Removed orText styles
});

export default ScannedItemsScreen;