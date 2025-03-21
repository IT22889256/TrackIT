import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';

type ManuallyAddItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
  navigation: ManuallyAddItemScreenNavigationProp;
};

const ManuallyAddItem: React.FC<Props> = ({ navigation }) => {
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [expiryDate, setExpiryDate] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const incrementQuantity = () => setQuantity(quantity + 1);
    const decrementQuantity = () => setQuantity(quantity > 0 ? quantity - 1 : 0);

    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);

    const handleConfirm = (date: Date) => {
        setExpiryDate(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        hideDatePicker();
    };

    const handleSubmit = () => {
        const newItem = { itemName, description, price: parseFloat(price) || 0, quantity, expiryDate };
        console.log('Added Item:', newItem);
        // Handle item submission logic
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={()=>navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.title}>Add Items</Text>

            <View style={styles.card}>
                {/* Item Name */}
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Something..."
                    value={itemName}
                    onChangeText={setItemName}
                />

                {/* Quantity */}
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
                        <FontAwesome name="plus" size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
                        <FontAwesome name="minus" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter Something..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {/* Price */}
                <Text style={styles.label}>Price</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Rs. Enter Something..."
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />

            

               

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 3,
        marginTop: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f2f2f2',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    quantityButton: {
        backgroundColor: 'purple',
        padding: 10,
        borderRadius: 50,
        marginHorizontal: 10,
    },
    quantityText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    datePicker: {
        flexDirection: 'row',
        backgroundColor: '#f2f2f2',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 16,
        color: 'gray',
    },
    submitButton: {
        backgroundColor: 'purple',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ManuallyAddItem;
