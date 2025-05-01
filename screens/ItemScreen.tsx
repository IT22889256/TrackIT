import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

type ItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ItemScreen'>;
type ItemScreenRouteProp = RouteProp<RootStackParamList, 'ItemScreen'>;

type Props = {
    navigation: ItemScreenNavigationProp;
    route: ItemScreenRouteProp;
};

type InventoryItem = {
    id: string;
    description: string;
    currentStock: number;
    totalPrice: number;
    expiryDate?: Timestamp | string | null;
    priority: 'Essential' | 'Important' | 'Optional';
    uid: string;
    measurementUnit: string;
};

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

const ItemScreen: React.FC<Props> = ({ navigation, route }) => {
    if (!route.params?.item) {
        React.useEffect(() => {
            navigation.goBack();
        }, [navigation]);
        return <View style={styles.container}><Text>Error loading item details.</Text></View>;
    }
    const { item } = route.params;

    const [editableStock, setEditableStock] = useState<string>(
        item.currentStock?.toString() ?? ''
    );
    const [loading, setLoading] = useState(false);

    const handleDeleteItem = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "Authentication required to remove item.");
            return;
        }
        setLoading(true);
        try {
            const itemDocRef = doc(db, 'inventory', item.id);
            await deleteDoc(itemDocRef);
            Alert.alert("Success", `"${item.description}" removed from inventory.`);
            navigation.goBack();
        } catch (error) {
            setLoading(false);
            console.error("Error deleting item:", error);
            Alert.alert("Error", "Failed to remove item. Please try again.");
        }
    };

    const handleUpdateStock = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to update stock.");
            return;
        }

        const newStockValue = parseFloat(editableStock);

        if (isNaN(newStockValue) || newStockValue < 0) {
            Alert.alert("Invalid Input", "Please enter a valid non-negative number.");
            return;
        }

        if (newStockValue === 0) {
            Alert.alert(
                "Remove Item?",
                `Setting stock to 0 for "${item.description}".\n\nRemove from inventory?`,
                [
                    { text: "No", style: "cancel" },
                    { text: "Yes, Remove", onPress: handleDeleteItem, style: "destructive" }
                ],
                { cancelable: true }
            );
            return;
        }

        setLoading(true);
        try {
            const itemDocRef = doc(db, 'inventory', item.id);
            await updateDoc(itemDocRef, { currentStock: newStockValue });
            Alert.alert("Success", "Stock level updated!");
            navigation.goBack();
        } catch (error) {
            setLoading(false);
            console.error("Error updating stock:", error);
            Alert.alert("Error", "Failed to update stock. Please try again.");
        }
    };

    const displayExpiry = formatDisplayDate(item.expiryDate);
    const displayTotalPrice = item.totalPrice?.toFixed(2) ?? 'N/A';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.itemName}>{item.description}</Text>

                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Item Details</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="list-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Priority:</Text>
                        <Text style={[styles.detailValue, styles[`priority${item.priority}`]]}>
                            {item.priority}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="file-tray-stacked-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Current Stock:</Text>
                        <Text style={styles.detailValue}>
                            {item.currentStock} {item.measurementUnit}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="cash-outline" size={18} color="#555" />
                        <Text style={styles.detailLabel}>Total Price:</Text>
                        <Text style={styles.detailValue}>Rs. {displayTotalPrice}</Text>
                    </View>
                    {displayExpiry && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                            <Text style={styles.detailLabel}>Expiry Date:</Text>
                            <Text style={styles.detailValue}>{displayExpiry}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.updateSection}>
                    <Text style={styles.sectionTitle}>Update Current Stock</Text>
                    <Text style={styles.updateInstructions}>
                        Enter available quantity. Enter 0 to remove.
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
                        onPress={handleUpdateStock}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.updateButtonText}>Update Stock Level</Text>
                        )}
                    </TouchableOpacity>
                    
                    {/* Modified Add Expiry Notification Button */}
                    <TouchableOpacity 
                        style={styles.addItemButton} 
                        onPress={() => navigation.navigate('LabelManualEdit', { 
                            productName: item.description 
                        })}
                    >
                        <Text style={styles.EditButtonText}>Add Expiry Notification</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContentContainer: { padding: 20, paddingBottom: 40 },
    backButton: { position: 'absolute', top: 15, left: 15, zIndex: 1, padding: 5 },
    itemName: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 30, marginBottom: 25 },
    detailsSection: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    detailLabel: { fontSize: 15, color: '#666', marginLeft: 10, marginRight: 5, fontWeight: '500' },
    detailValue: { fontSize: 15, color: '#333', flexShrink: 1 },
    priorityEssential: { color: '#DC3545', fontWeight: 'bold' },
    priorityImportant: { color: '#FFC107', fontWeight: 'bold' },
    priorityOptional: { color: '#6C757D', fontWeight: 'bold' },
    updateSection: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    updateInstructions: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
    stockInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#fff', textAlign: 'center' },
    updateButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    updateButtonDisabled: { backgroundColor: '#B0C4DE' },
    updateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    addItemButton: { backgroundColor: '#6200ea', paddingVertical: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
    EditButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ItemScreen;