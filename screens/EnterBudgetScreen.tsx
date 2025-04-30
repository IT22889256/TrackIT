// EnterBudgetScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path
import { auth, db } from '../firebaseConfig'; // Import db
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Type for items expected from backend API
type ShoppingListItemAPI = { description: string; quantity: string; cost: number; reason?: string; };
// Type for items fetched from Firestore client-side
type InventoryItemFirestore = { id: string; description: string; priority: 'Essential' | 'Important' | 'Optional'; unitprice?: number; currentStock?: number; expiryDate?: Timestamp | string | object | null; measurementUnit?: string; quantity?: number; uid?: string; };
// Navigation types
type EnterBudgetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EnterBudget'>;
type Props = { navigation: EnterBudgetScreenNavigationProp; };

const EnterBudgetScreen: React.FC<Props> = ({ navigation }) => {
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const isButtonDisabled = !budget.trim() || loading;

    // --- Fetch Inventory Data (Client-Side using top-level collection) ---
    const fetchInventory = async (userId: string): Promise<InventoryItemFirestore[]> => {
        setLoadingMessage('Fetching inventory...');
        try {
            const inventoryCollectionRef = collection(db, 'inventory');
            const q = query(inventoryCollectionRef, where('uid', '==', userId)); // Ensure 'uid' field is indexed
            const querySnapshot = await getDocs(q);
            const items: InventoryItemFirestore[] = [];
            querySnapshot.forEach((doc) => {
                 const data = doc.data();
                 let expiryDateValue = data.expiryDate;
                 // Pass potential Timestamp object or String as is for backend parsing flexibility
                 items.push({
                    id: doc.id,
                    description: data.description || 'N/A',
                    priority: data.priority || 'Important',
                    unitprice: Number(data.unitprice) || 0,
                    currentStock: Number(data.currentStock ?? data.quantity ?? 0),
                    expiryDate: expiryDateValue, // Pass raw value
                    measurementUnit: data.measurementUnit || '',
                    quantity: Number(data.quantity) || 0,
                    uid: data.uid,
                 });
            });
            console.log(`Workspaceed ${items.length} items from Firestore for user ${userId}.`);
            return items;
        } catch (error) {
            console.error("Firestore fetch error:", error);
            Alert.alert("Fetch Error", "Could not fetch inventory. Check connection/rules.");
            throw new Error("Could not fetch inventory data.");
        }
    };

    // --- Handle Submission ---
    const handleSubmit = async () => {
        const numericBudget = parseFloat(budget);
        if (isNaN(numericBudget) || numericBudget <= 0) { Alert.alert("Invalid Budget", "Please enter a valid positive number."); return; }
        const currentUser = auth.currentUser;
        if (!currentUser) { Alert.alert("Authentication Error", "Please log in."); return; }

        setLoading(true);
        try {
            const inventoryItems = await fetchInventory(currentUser.uid);
            setLoadingMessage('Generating list...');

            // --- Get Auth Token (Still useful even if backend doesn't verify with Admin SDK) ---
            // You might use this for other backend auth methods or logging
            const idToken = await currentUser.getIdToken(true);

            // --- Call Backend API ---
            // !!! REPLACE WITH YOUR ACTUAL BACKEND URL !!!
            const API_ENDPOINT = "http://192.168.8.159:5000/generate-shopping-list";
            console.log(`Calling API: ${API_ENDPOINT} budget: ${numericBudget}, items: ${inventoryItems.length}`);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send token even if backend doesn't use Admin SDK to verify it
                    // Backend could potentially implement manual verification or just log it
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ budget: numericBudget, inventory: inventoryItems })
            });

            console.log(`API Status: ${response.status}`);
            const responseBody = await response.text(); // Get text first for better error handling

            if (!response.ok) {
                let errorMsg = `API Error (${response.status})`;
                try { const d = JSON.parse(responseBody); errorMsg = d.message || errorMsg; } catch (e) {}
                console.error(`API Fail: ${errorMsg}\nResponse: ${responseBody}`);
                throw new Error(errorMsg);
            }

            const generatedList: ShoppingListItemAPI[] = JSON.parse(responseBody);
            console.log(`Received list (${generatedList.length} items).`);
            navigation.navigate('BudgetList', { generatedList: generatedList, budget: numericBudget });

        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert("Error", `Operation failed. ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setLoading(false); setLoadingMessage('');
        }
    };

    // --- JSX ---
    return (
        <View style={styles.container}>
             {loading && ( <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>{loadingMessage || 'Loading...'}</Text></View> )}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
            <Text style={styles.title}>Enter Your Budget</Text>
            <View style={styles.card}>
                <Text style={styles.label}>Enter Your Budget (Rs)</Text>
                <TextInput style={styles.input} placeholder="e.g. 2000" value={budget} onChangeText={setBudget} keyboardType="numeric" editable={!loading}/>
                <TouchableOpacity style={[styles.submitButton, isButtonDisabled && styles.disabledButton]} onPress={handleSubmit} disabled={isButtonDisabled}>
                    <Text style={styles.submitText}>Generate Shopping List</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 60 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    backButton: { position: 'absolute', top: 60, left: 16, zIndex: 1, padding: 5 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
    card: { backgroundColor: 'white', padding: 25, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    label: { fontSize: 16, fontWeight: '500', color: '#555', marginBottom: 8 },
    input: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA' },
    submitButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
    submitText: { color: 'white', fontSize: 16, fontWeight: '600' },
    disabledButton: { backgroundColor: '#B0C4DE' },
});

export default EnterBudgetScreen;