import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const AddItemsScreen = () => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1); // Default quantity to 1
    const [description, setDescription] = useState('');
    const [itemNameError, setItemNameError] = useState('');
    const [quantityError, setQuantityError] = useState('');

    const navigation = useNavigation();

    const handleAddItem = async () => {
        let isValid = true;
        setItemNameError('');
        setQuantityError('');

        if (itemName.trim() === '') {
            setItemNameError('Item name is required.');
            isValid = false;
        }

        if (quantity < 0) {
            setQuantityError('Quantity cannot be negative.');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        if (auth.currentUser) {
            try {
                const newItem = {
                    name: itemName,
                    quantity: quantity,
                    description: description,
                    completed: false, // Default to not completed
                    ownerId: auth.currentUser.uid, // Store the user's UID as ownerId
                };

                const docRef = await addDoc(collection(db, 'shoppingList'), newItem);
                console.log('Item added with ID: ', docRef.id, ' by user: ', auth.currentUser.uid);
                navigation.navigate('ShoppingList'); // Go back to the shopping list screen
            } catch (error) {
                console.error('Error adding item: ', error);
                Alert.alert('Error', 'Failed to add item to the shopping list.');
            }
        } else {
            Alert.alert('Authentication Error', 'User not logged in.');
        }
    };

    const handleGoBack = () => {
        navigation.navigate('ShoppingList');
    };

    const incrementQuantity = () => {
        setQuantity((prevQuantity) => prevQuantity + 1);
    };

    const decrementQuantity = () => {
        setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1)); // Ensure quantity doesn't go below 1
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Items</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Item Name"
                    value={itemName}
                    onChangeText={setItemName}
                />
                {itemNameError ? <Text style={styles.errorText}>{itemNameError}</Text> : null}
            </View>

            <View style={styles.quantityContainer}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityControls}>
                    <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                        <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
                {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.descriptionInput}
                    placeholder="Enter Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                />
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={handleAddItem}>
                <Text style={styles.doneButtonText}>Add Item</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#E8E8E8',
        color: '#000',
    },
    quantityContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 15,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        backgroundColor: '#6750A4',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 15,
    },
    quantityButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    quantityValue: {
        fontSize: 20,
        color: '#000',
        minWidth: 40,
        textAlign: 'center',
    },
    descriptionContainer: {
        marginBottom: 20,
    },
    descriptionInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        backgroundColor: '#E8E8E8',
        color: '#000',
    },
    doneButton: {
        backgroundColor: '#6750A4',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        width: '50%',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
});

export default AddItemsScreen;