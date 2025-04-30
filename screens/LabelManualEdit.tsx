import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, auth } from '../firebaseConfig'; // Import auth from firebaseConfig

interface Props {
    navigation: NavigationProp<any>;
}

const LabelManualEdit: React.FC<Props> = ({ navigation }) => {
    const [productName, setProductName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [productError, setProductError] = useState('');
    const [dateError, setDateError] = useState('');
    const db = getFirestore(app);

    const validateDate = (date: string) => {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(date)) {
            return false;
        }

        const parts = date.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (month < 1 || month > 12) {
            return false;
        }

        if (day < 1 || day > 31) {
            return false;
        }

        if (month === 2 && day > 29) {
            return false;
        }
        if ([4, 6, 9, 11].includes(month) && day > 30) {
            return false;
        }

        return true;
    };

    const validateForm = () => {
        let isValid = true;

        if (!productName.trim()) {
            setProductError('Product name is required.');
            isValid = false;
        } else {
            setProductError('');
        }

        if (!expiryDate.trim()) {
            setDateError('Expiry date is required.');
            isValid = false;
        } else if (!validateDate(expiryDate)) {
            setDateError('Invalid date format. Use YYYY-MM-DD.');
            isValid = false;
        } else {
            setDateError('');
        }

        return isValid;
    };

    const handleDateChange = (text: string) => {
        const formattedText = text.replace(/[^0-9\-]/g, '');
        setExpiryDate(formattedText);

        if (formattedText.trim() && !validateDate(formattedText)) {
            setDateError('Invalid date format. Use YYYY-MM-DD.');
        } else {
            setDateError('');
        }
    };

    const handleAddItem = async () => {
        if (!validateForm()) return;

        try {
            const user = auth.currentUser;
            if (user) {
                await addDoc(collection(db, 'expireItems'), { // Changed collection name to 'expireItems'
                    productName: productName,
                    expiryDate: expiryDate,
                    uid: user.uid, // Add user's UID to the document
                });

                navigation.navigate('Reminder', { productName, expiryDate });
            } else {
                console.error('User is not logged in.');
                // Handle the case where the user is not logged in (e.g., show an error message)
            }
        } catch (error) {
            console.error('Error adding document: ', error);
            // Handle error (e.g., show an error message to the user)
        }
    };

    const isFormValid = productName.trim() && expiryDate.trim() && !dateError;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Expiry Items</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={styles.subtitle}>You can adjust the details manually</Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="medkit-outline" size={24} color="black" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Product Name"
                        value={productName}
                        onChangeText={(text) => {
                            setProductName(text);
                            setProductError(text.trim() ? '' : 'Product name is required.');
                        }}
                    />
                </View>
                {productError ? <Text style={styles.errorText}>{productError}</Text> : null}

                <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={24} color="black" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Expiry Date (YYYY-MM-DD)"
                        value={expiryDate}
                        onChangeText={handleDateChange}
                    />
                </View>
                {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
            </View>

            <TouchableOpacity
                style={[styles.addButton, !isFormValid && styles.disabledButton]}
                onPress={handleAddItem}
                disabled={!isFormValid}
            >
                <Text style={styles.addButtonText}>Add</Text>
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
    errorText: { color: 'red', fontSize: 12, marginLeft: 10, marginBottom: 5 },
    addButton: { backgroundColor: 'black', padding: 15, borderRadius: 25, alignItems: 'center' },
    disabledButton: { backgroundColor: 'gray' },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default LabelManualEdit;