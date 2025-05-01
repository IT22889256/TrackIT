import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
// --- Firebase Imports ---
import { auth, db } from '../firebaseConfig'; // Adjust path if needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions

// Define RootStackParamList (Adjust according to your actual navigation setup)
type RootStackParamList = {
  Profile: undefined;
  ManuallyAddItem: undefined;
  InventoryItems: undefined; // Ensure this screen exists in your navigator
  ScannedItems: { scannedItems: ScannedItem[] }; // Keep if needed
  // Add other screens if needed
};

// Define the specific navigation prop type for this screen
type ManuallyAddItemScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ManuallyAddItem'
>;

// Define Props for the component
type Props = {
  navigation: ManuallyAddItemScreenNavigationProp;
};

// Define custom types
type Unit = 'Unit' | 'Kg' | 'g';
type Priority = 'Essential' | 'Important' | 'Optional';

// Define Item structure for clarity (based on ScannedItemsScreen save logic)
// This might be defined globally if used in multiple places
type InventoryItemData = {
    uid: string;
    ownerId: string;
    description: string;
    itemName: string; // Added itemName distinct from description if needed
    unitprice: number;
    quantity: number;
    measurementUnit: Unit;
    currentStock: number;
    totalPrice: number;
    addedAt: any; // Firestore Timestamp type placeholder
    checked: boolean;
    priority: Priority;
    expiryDate: Date | null; // Store as null initially
};

// --- Helper type from ScannedItemsScreen for RootStackParamList ---
type ScannedItem = {
    id: string;
    description: string;
    price: number;
    quantity: number;
};


// The React Functional Component
const ManuallyAddItem: React.FC<Props> = ({ navigation }) => {
  // --- State variables ---
  const [itemName, setItemName] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>(''); // Separate description state
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<Unit>('Unit');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('Important');
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false); // Loading state for submission

  // --- Constants ---
  const unitOptions: Unit[] = ['Unit', 'Kg', 'g'];
  const priorityOptions: Priority[] = ['Essential', 'Important', 'Optional'];

  // --- Derived State & Memos ---
  const totalPrice = useMemo<string>(() => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) return '0.00';
    return (quantity * numericPrice).toFixed(2);
  }, [quantity, price]);

  // --- Effects ---
  useEffect(() => {
    const numericPrice = parseFloat(price);
    const isPriceValid = !isNaN(numericPrice) && numericPrice > 0;
    // Disable button if fields invalid OR if loading
    setIsButtonDisabled(!itemName.trim() || !price.trim() || !isPriceValid || loading);
  }, [itemName, price, loading]);

  // --- Event Handlers ---
  const incrementQuantity = (): void => setQuantity((prev) => prev + 1);
  const decrementQuantity = (): void => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // --- Firestore Submission Logic ---
  const handleSubmit = async (): Promise<void> => {
    // Prevent submission if already loading or button is disabled
    if (loading || isButtonDisabled) return;

    // Get current user
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to add items.');
      return;
    }

    // Final validation
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid positive number for the Unit Price.");
      return;
    }
    if (!itemName.trim()) {
         Alert.alert("Invalid Name", "Please enter a valid item name.");
         return;
    }

    setLoading(true); // Start loading indicator

    // Construct the item data object matching Firestore structure
    const newItemData: Omit<InventoryItemData, 'addedAt'> & { addedAt: any } = { // Use Omit for correct typing with serverTimestamp
        uid: user.uid,
        ownerId: user.uid,
        itemName: itemName.trim(),
        description: itemDescription.trim() || itemName.trim(), // Use specific description or fallback to name
        unitprice: numericPrice,
        quantity: quantity,
        measurementUnit: selectedUnit,
        priority: selectedPriority,
        totalPrice: parseFloat(totalPrice),
        currentStock: quantity, // Initial stock matches quantity added
        addedAt: serverTimestamp(), // Use server timestamp
        checked: false, // Manually added items default to not needing expiry check? Or add UI?
        expiryDate: null, // Default expiry to null
    };

    try {
        const inventoryCollectionRef = collection(db, 'inventory');
        const docRef = await addDoc(inventoryCollectionRef, newItemData);

        console.log('Document written with ID: ', docRef.id);
        setLoading(false);
        Alert.alert('Success', `"${newItemData.itemName}" added to inventory.`);

        // Navigate to the Inventory List screen after successful addition
        navigation.navigate('InventoryItems'); // Or replace if you prefer

    } catch (error) {
        setLoading(false);
        console.error('Error adding document: ', error);
        Alert.alert('Error', 'Could not add item to inventory. Please try again.');
    }
  };

  // --- Render Component ---
  return (
    <View style={styles.container}>
        {/* Header Area */}
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
             <Ionicons name="arrow-back" size={24} color="black" />
         </TouchableOpacity>
         <Text style={styles.title}>Add Item Manually</Text>

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* Form Card */}
            <View style={styles.formCard}>

                {/* Item Name Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Item Name <Text style={styles.requiredIndicator}>*</Text></Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Washing Powder"
                        placeholderTextColor="#999"
                        value={itemName}
                        onChangeText={setItemName}
                        autoCapitalize="words"
                    />
                </View>

                {/* Quantity and Price Row */}
                <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.column]}>
                        <Text style={styles.label}>Quantity</Text>
                        <TextInput
                            style={[styles.textInput, styles.quantityInput]}
                            value={String(quantity)}
                            onChangeText={(text) => setQuantity(parseInt(text, 10) || 1)}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.inputGroup, styles.column]}>
                        <Text style={styles.label}>Unit Price <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Rs."
                            placeholderTextColor="#999"
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Total Price Display */}
                <Text style={styles.totalPrice}>Total: Rs. {totalPrice}</Text>

                {/* Unit Selection */}
                <View style={styles.unitSection}>
                    <Text style={styles.unitLabel}>Select Unit:</Text>
                    <View style={styles.unitButtonsContainer}>
                        {unitOptions.map((unit) => (
                            <TouchableOpacity
                                key={unit}
                                style={[ styles.unitButton, selectedUnit === unit && styles.unitButtonSelected ]}
                                onPress={() => setSelectedUnit(unit)} >
                                <Text style={[ styles.unitButtonText, selectedUnit === unit && styles.unitButtonTextSelected ]}>
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
                        {priorityOptions.map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[ styles.priorityButton, selectedPriority === level && styles.priorityButtonSelected ]}
                                onPress={() => setSelectedPriority(level)} >
                                <Text style={[ styles.priorityButtonText, selectedPriority === level && styles.priorityButtonTextSelected ]}>
                                    {level}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description <Text style={styles.optionalIndicator}>(Optional)</Text></Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="Add brand, notes, etc."
                        placeholderTextColor="#999"
                        value={itemDescription} // Use separate state for description
                        onChangeText={setItemDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>

            </View>
        </ScrollView>

        {/* Bottom Submit Button Area */}
        <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
                style={[ styles.actionButton, styles.submitButtonStyle, isButtonDisabled && styles.actionButtonDisabled ]}
                onPress={handleSubmit}
                disabled={isButtonDisabled} >
                {loading ? (
                     <ActivityIndicator size="small" color="white" />
                ) : (
                    <>
                        <Ionicons name="checkmark-done-outline" size={20} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Add Item to Inventory</Text>
                    </>
                 )}
            </TouchableOpacity>
        </View>
    </View>
  );
};


// --- Styles (Adapted from ScannedItemsScreen context) ---
const IOS_BLUE = '#007AFF';
const IOS_PURPLE = '#5856D6';
const LIGHT_BACKGROUND = '#F8F9FA';
const CARD_BACKGROUND = '#FFFFFF';
const TEXT_PRIMARY = '#212121';
const TEXT_SECONDARY = '#6C757D';
const BORDER_LIGHT = '#EEE';
const BORDER_MEDIUM = '#E5E5E5';
const DISABLED_GRAY = '#BDBDBD';
const ERROR_COLOR = '#B00020';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BACKGROUND, paddingTop: 55, },
    backButton: { position: 'absolute', top: 55, left: 16, zIndex: 1, padding: 5, },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: TEXT_PRIMARY, },
    scrollView: { flex: 1, },
    scrollViewContent: { paddingHorizontal: 16, paddingBottom: 100, },
    formCard: { backgroundColor: CARD_BACKGROUND, borderRadius: 10, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3, },
    inputGroup: { marginBottom: 18, },
    label: { fontSize: 14, fontWeight: '500', color: TEXT_SECONDARY, marginBottom: 8, },
    requiredIndicator: { color: ERROR_COLOR, },
    optionalIndicator: { color: TEXT_SECONDARY, fontWeight: 'normal', fontSize: 12, },
    textInput: { backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: BORDER_MEDIUM, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: TEXT_PRIMARY, },
    textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12, },
    row: { flexDirection: 'row', marginHorizontal: -6, },
    column: { flex: 1, paddingHorizontal: 6, },
    quantityInput: { textAlign: 'center', },
    totalPrice: { fontSize: 16, fontWeight: 'bold', color: IOS_BLUE, textAlign: 'right', marginTop: -10, marginBottom: 20, marginRight: 6, },
    unitSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER_LIGHT, paddingTop: 15, marginBottom: 10, },
    unitLabel: { fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginBottom: 8, },
    unitButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', },
    unitButton: { borderWidth: 1, borderColor: IOS_BLUE, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 14, marginRight: 8, marginBottom: 8, backgroundColor: CARD_BACKGROUND, },
    unitButtonSelected: { backgroundColor: IOS_BLUE, },
    unitButtonText: { color: IOS_BLUE, fontSize: 13, fontWeight: '600', },
    unitButtonTextSelected: { color: CARD_BACKGROUND, },
    prioritySection: { marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER_LIGHT, paddingTop: 15, marginBottom: 10, },
    priorityLabel: { fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginBottom: 8, },
    priorityButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', },
    priorityButton: { borderWidth: 1, borderColor: IOS_BLUE, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 14, marginRight: 8, marginBottom: 8, backgroundColor: CARD_BACKGROUND, },
    priorityButtonSelected: { backgroundColor: IOS_BLUE, },
    priorityButtonText: { color: IOS_BLUE, fontSize: 13, fontWeight: '600', },
    priorityButtonTextSelected: { color: CARD_BACKGROUND, },
    bottomButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 25, backgroundColor: CARD_BACKGROUND, borderTopWidth: 1, borderTopColor: BORDER_MEDIUM, },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, height: 48, },
    submitButtonStyle: { backgroundColor: IOS_BLUE, },
    actionButtonDisabled: { backgroundColor: DISABLED_GRAY, opacity: 0.7, },
    buttonIcon: { marginRight: 8, },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600', },
});

export default ManuallyAddItem;