import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, auth } from '../firebaseConfig'; // Import auth from firebaseConfig

type LabelManualEditRouteProp = StackScreenProps<RootStackParamList, 'LabelManualEdit'>['route'];
type LabelManualEditNavigationProp = StackNavigationProp<RootStackParamList, 'LabelManualEdit'>;

interface Props {
    navigation: LabelManualEditNavigationProp;
    route: LabelManualEditRouteProp;
}

const LabelManualEdit: React.FC<Props> = ({ navigation, route }) => {
    const { apiResponseData } = route.params as { apiResponseData: any }; // Use 'any' for now, or a more specific type if you know it
    console.log("apiResponseData", apiResponseData);

    const [productName, setProductName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [rawOcrText, setRawOcrText] = useState(''); // State for the entire raw OCR text
    const [extractedOcrText, setExtractedOcrText] = useState(''); // New state for the 'ocr_text'
    const db = getFirestore(app);

    useEffect(() => {
        if (apiResponseData) {
            // Extract the 'ocr_text' if it exists within the 'data' object
            if (apiResponseData.data && apiResponseData.data.ocr_text) {
                setExtractedOcrText(String(apiResponseData.data.ocr_text));
                // Optionally, you can still set the entire data to rawOcrText for debugging or other purposes
                setRawOcrText(JSON.stringify(apiResponseData.data, null, 2));
            } else if (typeof apiResponseData === 'string') {
                setRawOcrText(apiResponseData);
            } else {
                setRawOcrText(JSON.stringify(apiResponseData, null, 2));
                console.warn("Received apiResponseData is an object without a 'data.ocr_text' property. Displaying the entire object.");
            }
        }
    }, [apiResponseData]);

    const handleAddItem = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await addDoc(collection(db, 'expireItems'), {
                    productName: productName,
                    expiryDate: expiryDate,
                    uid: user.uid,
                });

                navigation.navigate('Reminder', { productName, expiryDate });
            } else {
                console.error('User is not logged in.');
                // Handle the case where the user is not logged in
            }
        } catch (error) {
            console.error('Error adding document: ', error);
            // Handle error
        }
    };

    const isFormValid = true; // Always true since validations are removed

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Item Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={styles.subtitle}>Adjust the details if needed</Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="medkit-outline" size={24} color="black" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Product Name"
                        value={productName}
                        onChangeText={setProductName}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={24} color="black" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Expiry Date (YYYY-MM-DD)"
                        value={expiryDate}
                        onChangeText={setExpiryDate}
                    />
                </View>

                {/* New field to display the extracted OCR text */}
                {extractedOcrText && (
                    <View style={styles.scannedTextContainer}>
                        <Text style={styles.scannedTextLabel}>Extracted OCR Text:</Text>
                        <ScrollView style={styles.scannedTextView}>
                            <Text style={styles.scannedText}>{extractedOcrText}</Text>
                        </ScrollView>
                    </View>
                )}

                {/* Existing field to display the raw API response */}
                <View style={styles.scannedTextContainer}>
                    <Text style={styles.scannedTextLabel}>Raw API Response:</Text>
                    <ScrollView style={styles.scannedTextView}>
                        <Text style={styles.scannedText}>{rawOcrText}</Text>
                    </ScrollView>
                </View>
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
            >
                <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
        </View>
    );
};
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { textAlign: 'center', color: 'gray', marginBottom: 20 },
    inputContainer: { marginBottom: 20 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 10, marginBottom: 10, paddingVertical: 12 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16 },
    addButton: { backgroundColor: 'black', padding: 15, borderRadius: 25, alignItems: 'center' },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    scannedTextContainer: { marginBottom: 20 },
    scannedTextLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    scannedTextView: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, minHeight: 100 },
    scannedText: { fontSize: 14 },
});

export default LabelManualEdit;