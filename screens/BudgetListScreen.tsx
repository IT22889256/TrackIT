import React, { useEffect, useRef, useState } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path if needed
import Footer from '../components/Footer'; // Adjust path if needed

type BudgetListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BudgetList'>;

type Props = {
    navigation: BudgetListScreenNavigationProp;
};

type ShoppingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

// Budget and Shopping List Data
const BUDGET = 2000;
const shoppingData: ShoppingItem[] = [
    { id: '1', name: 'Item A', quantity: 2, price: 350 },
    { id: '2', name: 'Item B', quantity: 2, price: 400 },
    { id: '3', name: 'Item C', quantity: 2, price: 250 },
    { id: '4', name: 'Item D', quantity: 2, price: 500 },
    { id: '5', name: 'Item E', quantity: 2, price: 300 },
];

// Calculate total price
const getTotalPrice = () => shoppingData.reduce((sum, item) => sum + item.price, 0);

const BudgetListScreen: React.FC<Props> = ({ navigation }) => {
    const totalPrice = getTotalPrice();

    // Animation & Loading States
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [loading, setLoading] = useState(true);

    // Simulate screen loading delay
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }, 2000); // 2 seconds delay before loading items
    }, []);

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Budget Shopping List</Text>

            {/* Budget Display */}
            <Text style={styles.budgetText}>
                Your Budget: <Text style={{ color: '#FF6B6B' }}>Rs.{BUDGET}</Text>
            </Text>

            {/* Show Loader While Fetching Data */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Loading items...</Text>
                </View>
            ) : (
                <Animated.View style={{ opacity: fadeAnim }}>
                    <FlatList
                        data={shoppingData}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity activeOpacity={0.8} style={styles.itemContainer}>
                                <View>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.quantity}>Qty: {item.quantity}</Text>
                                </View>
                                <Text style={styles.price}>Rs. {item.price}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </Animated.View>
            )}

            {/* Total Price */}
            {!loading && (
                <Text style={styles.totalPriceText}>
                    Total Price: <Text style={{ color: totalPrice > BUDGET ? 'red' : '#2DCE89' }}>Rs.{totalPrice}</Text>
                </Text>
            )}

            <Footer navigation={navigation} />
        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
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
        marginBottom: 20,
        color: '#333',
    },
    budgetText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 10,
        color: '#777',
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    quantity: {
        fontSize: 14,
        color: 'gray',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    totalPriceText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default BudgetListScreen;