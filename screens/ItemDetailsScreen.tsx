
// ItemDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ItemDetailsProps {
    item: Item;
    onClose: () => void;
}

interface Item {
    id: string;
    name: string;
    quantity: number;
    description: string;
    addImage: boolean;
}

const ItemDetailsScreen = ({ item, onClose }: ItemDetailsProps) => {
    return (
        <View style={styles.centeredView}>
            <View style={styles.modalView}>
                <ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
                    <Text style={styles.detailText}>Description: {item.description}</Text>
                    <Text style={styles.detailText}>Add Image: {item.addImage ? 'Yes' : 'No'}</Text>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },
    modalView: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    itemName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 5,
    },
});

export default ItemDetailsScreen;