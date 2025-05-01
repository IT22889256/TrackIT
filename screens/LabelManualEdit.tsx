import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';


type LabelManualEditRouteProp = StackScreenProps<RootStackParamList, 'LabelManualEdit'>['route'];
type LabelManualEditNavigationProp = StackNavigationProp<RootStackParamList, 'LabelManualEdit'>;

interface Props {
    navigation: LabelManualEditNavigationProp;
    route: LabelManualEditRouteProp;
}

const TEMP_PRODUCT_KEY = 'TEMP_PRODUCT_NAME';

const extractExpiryDate = (ocrText: string): string | null => {
    const lines = ocrText.split('\n');
    for (const line of lines) {
        const expMatch = line.match(/EXP[.\s:]*(\d{2})[\.\/-](\d{2})[\.\/-](\d{4})/i);
        if (expMatch) {
            const [, day, month, year] = expMatch;
            return `${year}-${month}-${day}`;
        }
    }
    return null;
};

const LabelManualEdit: React.FC<Props> = ({ navigation, route }) => {
    const { apiResponseData, productName: initialProductName } = route.params || {};
    const [productName, setProductName] = useState(initialProductName || '');
    const [expiryDate, setExpiryDate] = useState('');
    const [rawOcrText, setRawOcrText] = useState('');
    const [extractedOcrText, setExtractedOcrText] = useState('');
    const db = getFirestore(app);
    
    // Load saved product name when component mounts
    useEffect(() => {
        const loadSavedProductName = async () => {
            try {
                const savedProductName = await AsyncStorage.getItem(TEMP_PRODUCT_KEY);
                if (savedProductName && !initialProductName) {
                    setProductName(savedProductName);
                } else if (initialProductName) {
                    // If a new product name is passed, update both state and storage
                    setProductName(initialProductName);
                    await AsyncStorage.setItem(TEMP_PRODUCT_KEY, initialProductName);
                }
            } catch (error) {
                console.error('Error loading saved product name:', error);
            }
        };
        
        loadSavedProductName();
    }, [initialProductName]);
    
    // Save product name to AsyncStorage whenever it changes
    useEffect(() => {
        const saveProductName = async () => {
            try {
                if (productName) {
                    await AsyncStorage.setItem(TEMP_PRODUCT_KEY, productName);
                }
            } catch (error) {
                console.error('Error saving product name:', error);
            }
        };
        
        saveProductName();
    }, [productName]);

    // Process OCR data when available
    useEffect(() => {
        if (apiResponseData) {
            let ocrText = '';
            if (apiResponseData.data?.ocr_text) {
                ocrText = String(apiResponseData.data.ocr_text);
                setExtractedOcrText(ocrText);
                setRawOcrText(JSON.stringify(apiResponseData.data, null, 2));
                
                const extractedDate = extractExpiryDate(ocrText);
                if (extractedDate) {
                    setExpiryDate(extractedDate);
                }
            } else {
                const fallbackText = typeof apiResponseData === 'string' 
                    ? apiResponseData 
                    : JSON.stringify(apiResponseData, null, 2);
                setRawOcrText(fallbackText);
                setExtractedOcrText(fallbackText);
            }
        }
    }, [apiResponseData]);

    // Update product name in storage when manually changed
    const handleProductNameChange = (text: string) => {
        setProductName(text);
    };

    const handleAddItem = async () => {
        try {
            // Validate input
            if (!productName.trim()) {
                Alert.alert('Missing Information', 'Please enter a product name');
                return;
            }
            
            if (!expiryDate.trim()) {
                Alert.alert('Missing Information', 'Please enter an expiry date');
                return;
            }
            
            const user = auth.currentUser;
            if (user) {
                await addDoc(collection(db, 'expireItems'), {
                    productName,
                    expiryDate,
                    uid: user.uid,
                    ownerId: user.uid,
                    createdAt: new Date(),
                });
                
                // Clear temporary storage after successful addition
                await AsyncStorage.removeItem(TEMP_PRODUCT_KEY);
                
                navigation.navigate('Reminder', { productName, expiryDate });
            } else {
                Alert.alert('Error', 'You must be logged in to add items');
            }
        } catch (error) {
            console.error('Error adding document: ', error);
            Alert.alert('Error', 'Failed to add the item. Please try again.');
        }
    };

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
                        onChangeText={handleProductNameChange}
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

                {/* {extractedOcrText && (
                    <View style={styles.scannedTextContainer}>
                        <Text style={styles.scannedTextLabel}>Extracted OCR Text:</Text>
                        <ScrollView style={styles.scannedTextView}>
                            <Text style={styles.scannedText}>{extractedOcrText}</Text>
                        </ScrollView>
                    </View>
                )}uid

        

                <View style={styles.scannedTextContainer}>
                    <Text style={styles.scannedTextLabel}>Raw API Response:</Text>
                    <ScrollView style={styles.scannedTextView}>
                        <Text style={styles.scannedText}>{rawOcrText}</Text>
                    </ScrollView>
                </View> */}
            </View>

              {/* New Scan Button */}
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('LabelScan')}
            >
                <Text style={styles.scanButtonText}>Scan Label</Text>
            </TouchableOpacity>

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
    scanButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
    scanButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    scannedTextContainer: { marginBottom: 20 },
    scannedTextLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    scannedTextView: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, minHeight: 100 },
    scannedText: { fontSize: 14 },
});

export default LabelManualEdit;