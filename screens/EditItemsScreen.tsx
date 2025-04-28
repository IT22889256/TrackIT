import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
    item: Item;
    updateItem: (updatedItem: Item) => void;
}

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    addImage?: boolean; // Make addImage optional as it might not always exist
    ownerId?: string; // Include ownerId in the Item interface
}

const EditItemsScreen = () => {
    const route = useRoute<({ params: RouteParams })>();
    const { item, updateItem } = route.params;

    const [itemName, setItemName] = useState(item.name);
    const [quantity, setQuantity] = useState(item.quantity);
    const [description, setDescription] = useState(item.description);
    const [addImage, setAddImage] = useState(item.addImage || false);
    const [itemNameError, setItemNameError] = useState('');
    const [quantityError, setQuantityError] = useState('');

    const navigation = useNavigation();

    const handleSave = () => {
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

        const updatedItem = {
            id: item.id,
            name: itemName,
            quantity: quantity,
            description: description,
            addImage: addImage,
            ownerId: item.ownerId, // Preserve the ownerId
        };
        updateItem(updatedItem);
        Alert.alert('Updated Successfully', '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    };

    const incrementQuantity = () => {
        setQuantity((prevQuantity) => prevQuantity + 1);
    };

    const decrementQuantity = () => {
        setQuantity((prevQuantity) => (prevQuantity > 0 ? prevQuantity - 1 : 0));
    };

    const handleGoBack = () => {
        navigation.goBack(); // Use goBack to navigate back to the previous screen
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Items</Text>
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
                    <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                        <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                </View>
                {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}
            </View>

            <View style={styles.addImageContainer}>
                <Text style={styles.label}>Add Image</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={addImage ? '#f5dd4b' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setAddImage}
                    value={addImage}
                />
            </View>

            {addImage && (
                <View style={styles.imagePlaceholder}>
                    <Text>Image Placeholder</Text>
                </View>
            )}

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

            <TouchableOpacity style={styles.doneButton} onPress={handleSave}>
                <Text style={styles.doneButtonText}>Done</Text>
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
    addImageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    imagePlaceholder: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        backgroundColor: '#E8E8E8',
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

export default EditItemsScreen;