import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types'; // Adjust path if needed
import { auth, db } from '../firebaseConfig'; // Adjust path if needed
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'; // Import deleteDoc

// --- Navigation Types (Ensure 'ItemScreen' matches your actual route name) ---
type ItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ItemScreen'>;
type ItemScreenRouteProp = RouteProp<RootStackParamList, 'ItemScreen'>;

type Props = {
    navigation: ItemScreenNavigationProp;
    route: ItemScreenRouteProp;
};

// --- Item Type ---
type InventoryItem = {
    id: string;
    description: string;
    quantity: number;
    totalPrice: number;
    unitprice?: number;
    expiryDate?: Timestamp | string | null;
    priority: 'Essential' | 'Important' | 'Optional';
    checked?: boolean;
    currentStock?: number;
    addedAt?: any;
    uid: string; // Ensure uid is in the type
};

// Helper to format date
const formatDisplayDate = (expiryDate?: Timestamp | string | null): string | null => {
    if (!expiryDate) return null;
    let dateObj: Date | null = null;
    if (expiryDate instanceof Timestamp) {
        dateObj = expiryDate.toDate();
    } else {
        const date = new Date(expiryDate);
        if (!isNaN(date.getTime())) {
            dateObj = date;
        }
    }
    if (!dateObj) return null;
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};


// --- Component ---
const ItemScreen: React.FC<Props> = ({ navigation, route }) => {
    // Ensure item exists, handle gracefully if not (though navigation setup should prevent this)
    if (!route.params?.item) {
        // Optionally navigate back or show an error message
        console.error("Item data missing in route params!");
        // Example: Go back if item is missing
        React.useEffect(() => {
            navigation.goBack();
        }, [navigation]);
        return <View style={styles.container}><Text>Error loading item details.</Text></View>; // Or a loading indicator
    }
    const { item } = route.params;

    const [editableStock, setEditableStock] = useState<string>(
        item.currentStock?.toString() ?? item.quantity?.toString() ?? ''
    );
    const [loading, setLoading] = useState(false);

    // --- Function to Delete Item ---
    const handleDeleteItem = async () => {
        // Basic check, should ideally be handled by screen auth HOC or similar
        if (!auth.currentUser) {
            Alert.alert("Error", "Authentication required to remove item.");
            return;
        }
        setLoading(true);
        try {
            const itemDocRef = doc(db, 'inventory', item.id); // Reference the 'inventory' collection
            await deleteDoc(itemDocRef);
            // Don't setLoading(false) here because we navigate away
            Alert.alert("Success", `"${item.description}" removed from inventory.`);
            navigation.goBack(); // Navigate back after successful deletion
        } catch (error) {
            setLoading(false); // Set loading false only on error
            console.error("Error deleting item:", error);
            Alert.alert("Error", "Failed to remove item. Please try again.");
        }
    };


    // --- Handler for Updating Stock ---
    const handleUpdateStock = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to update stock.");
            return;
        }

        const newStockValue = parseFloat(editableStock);

        // Basic Validation
        if (isNaN(newStockValue) || newStockValue < 0) {
            Alert.alert("Invalid Input", "Please enter a valid non-negative number for the stock quantity.");
            return;
        }

        // --- Check if the new stock value is Zero ---
        if (newStockValue === 0) {
            // Show confirmation dialog
            Alert.alert(
                "Remove Item?", // Title
                `Setting stock to 0 for "${item.description}".\n\nDo you want to remove this item from your inventory completely?`, // Message
                [
                    {
                        text: "No", // Button text: Keep item, do nothing (don't update to 0)
                        onPress: () => console.log("Cancel removal"),
                        style: "cancel"
                    },
                    {
                        text: "Yes, Remove", // Button text: Delete the item
                        onPress: handleDeleteItem, // Call the delete function
                        style: "destructive" // Makes text red on iOS for emphasis
                    }
                ],
                { cancelable: true } // Allow dismissal by tapping outside on Android
            );
            // Do not proceed with update or loading state here, wait for Alert response
            return; // Stop execution here, wait for user choice in Alert
        }

        // --- Proceed with Update if stock is NOT zero ---
        setLoading(true);
        try {
            const itemDocRef = doc(db, 'inventory', item.id); // Reference the 'inventory' collection

            // Update only the currentStock field
            await updateDoc(itemDocRef, {
                currentStock: newStockValue
            });

            // Don't setLoading(false) here because we navigate away
            Alert.alert("Success", "Stock level updated successfully!");
            navigation.goBack(); // Navigate back after successful update

        } catch (error) {
            setLoading(false); // Set loading false only on error
            console.error("Error updating stock:", error);
            Alert.alert("Error", "Failed to update stock level. Please try again.");
        }
    };

    // Format details for display
    const displayExpiry = formatDisplayDate(item.expiryDate);
    const displayUnitPrice = item.unitprice?.toFixed(2) ?? 'N/A';
    const displayTotalPrice = item.totalPrice?.toFixed(2) ?? 'N/A';
    const displayPurchaseQuantity = item.quantity ?? 'N/A';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                {/* Item Name / Description */}
                <Text style={styles.itemName}>{item.description}</Text>

                {/* Display Item Details */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Item Details</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="list-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Priority:</Text>
                        <Text style={[styles.detailValue, styles[`priority${item.priority}`]]}>{item.priority}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="file-tray-stacked-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Quantity Purchased:</Text>
                        <Text style={styles.detailValue}>{displayPurchaseQuantity}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="pricetag-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Unit Price:</Text>
                        <Text style={styles.detailValue}>Rs. {displayUnitPrice}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="cash-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Total Purchase Price:</Text>
                        <Text style={styles.detailValue}>Rs. {displayTotalPrice}</Text>
                    </View>
                    {displayExpiry && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                            <Text style={styles.detailLabel}>Expiry Date:</Text>
                            <Text style={styles.detailValue}>{displayExpiry}</Text>
                        </View>
                    )}
                    {/* Add more details if needed */}
                </View>

                {/* Current Stock Update Section */}
                <View style={styles.updateSection}>
                    <Text style={styles.sectionTitle}>Update Current Stock</Text>
                    <Text style={styles.updateInstructions}>
                        Enter the quantity currently available in your inventory. Enter 0 to remove.
                    </Text>
                    <TextInput
                        style={styles.stockInput}
                        value={editableStock}
                        onChangeText={setEditableStock}
                        keyboardType="numeric"
                        placeholder="Enter current stock"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                        onPress={handleUpdateStock} // This now handles the 0 check
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.updateButtonText}>Update Stock Level</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background
    },
    scrollContentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 1,
        padding: 5,
    },
    itemName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 25,
    },
    detailsSection: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#444',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 15,
        color: '#666',
        marginLeft: 10,
        marginRight: 5,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        flexShrink: 1,
    },
    // Priority Colors
    priorityEssential: { color: '#DC3545', fontWeight: 'bold' },
    priorityImportant: { color: '#FFC107', fontWeight: 'bold' },
    priorityOptional: { color: '#6C757D', fontWeight: 'bold' },

    updateSection: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    updateInstructions: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    stockInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
        textAlign: 'center',
    },
    updateButton: {
        backgroundColor: '#007AFF', // iOS Blue
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    updateButtonDisabled: {
        backgroundColor: '#B0C4DE',
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ItemScreen;