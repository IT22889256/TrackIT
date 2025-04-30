// BudgetListScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Animated, SafeAreaView // Import SafeAreaView for better screen edges handling
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path
import Footer from '../components/Footer'; // Adjust path

// Type for items coming from backend API
type ShoppingListItemAPI = {
    description: string;
    quantity: string; // e.g., "1 kg", "100 g", "1 unit"
    cost: number;
    reason?: string; // Optional: why item was included
};

// --- Navigation Types ---
type BudgetListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BudgetList'>;
type BudgetListScreenRouteProp = RouteProp<RootStackParamList, 'BudgetList'>;

type Props = {
    navigation: BudgetListScreenNavigationProp;
    route: BudgetListScreenRouteProp;
};

const BudgetListScreen: React.FC<Props> = ({ navigation, route }) => {
    // Get data from navigation parameters with defaults
    const { generatedList = [], budget = 0 } = route.params || {};

    // Calculate total price
    const totalPrice = generatedList.reduce((sum, item) => sum + item.cost, 0);

    // Animation Ref for fade-in effect
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fadeAnim.setValue(0); // Reset on data change
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [generatedList, fadeAnim]); // Rerun if list data changes

    // --- Render Item Function for FlatList ---
    const renderShoppingItem = ({ item }: { item: ShoppingListItemAPI }) => (
        <View style={styles.itemCard}>
            {/* Icon Column */}
            <View style={styles.itemIconContainer}>
                 {/* Example: Generic list/cart item icon */}
                 <Ionicons name="cube-outline" size={28} color="#4A90E2" />
             </View>

             {/* Details Column */}
            <View style={styles.itemDetailsContainer}>
                <Text style={styles.itemName} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.itemQuantity}>Buy: {item.quantity}</Text>
                {item.reason && <Text style={styles.itemReason}>({item.reason})</Text>}
            </View>

            {/* Price Column */}
            <View style={styles.itemPriceContainer}>
                <Text style={styles.itemPrice}>Rs. {item.cost.toFixed(2)}</Text>
            </View>
        </View>
    );

    // --- Main JSX ---
    return (
        // Use SafeAreaView for better handling of notches and screen edges
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Area */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-circle-outline" size={30} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Budget Shopping List</Text>
                    {/* Placeholder for potential right-side header action */}
                    <View style={styles.headerRightPlaceholder} />
                </View>

                {/* Budget Info */}
                <View style={styles.budgetInfoContainer}>
                    <Ionicons name="wallet-outline" size={22} color="#666" />
                    <Text style={styles.budgetText}>
                        Your Budget: <Text style={styles.budgetAmount}>Rs. {budget.toFixed(2)}</Text>
                    </Text>
                </View>

                {/* List or Empty State */}
                {!generatedList || generatedList.length === 0 ? (
                    <View style={styles.emptyListContainer}>
                        <Ionicons name="basket-outline" size={60} color="#CCC" />
                        <Text style={styles.emptyListText}>Shopping list is empty.</Text>
                        <Text style={styles.emptyListSubText}>Either your inventory is full or no items matched the criteria within budget.</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                        <FlatList
                            data={generatedList}
                            renderItem={renderShoppingItem}
                            keyExtractor={(item, index) => `${item.description}-${index}`}
                            contentContainerStyle={styles.listContentContainer}
                            ItemSeparatorComponent={() => <View style={styles.separator} />} // Add separators
                        />
                    </Animated.View>
                )}

                {/* Total Price Footer (only if list has items) */}
                {generatedList && generatedList.length > 0 && (
                    <View style={styles.totalFooter}>
                        <Text style={styles.totalPriceLabel}>Estimated Total:</Text>
                        <Text style={[
                            styles.totalPriceValue,
                            totalPrice > budget && styles.totalPriceOverBudget // Apply style if over budget
                        ]}>
                            Rs. {totalPrice.toFixed(2)}
                        </Text>
                        {totalPrice > budget && (
                            <Text style={styles.warningText}>Exceeds Budget!</Text>
                        )}
                    </View>
                )}
            </View>
             
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F6F8', // Light background for the safe area
    },
    container: {
        flex: 1, // Takes available space within SafeAreaView
        // Removed padding from container, handled by content containers
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10, // Adjust as needed
        paddingBottom: 10,
        backgroundColor: '#FFFFFF', // White header background
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 5, // Increase touch area
    },
    title: {
        fontSize: 20, // Slightly smaller title
        fontWeight: '600', // Semi-bold
        color: '#333',
    },
    headerRightPlaceholder: { // To balance the back button for center alignment
        width: 30, // Approx width of the back button icon
    },
    budgetInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#E9EEF2', // Light background strip for budget
        borderBottomWidth: 1,
        borderBottomColor: '#DDE4E8',
        marginBottom: 5, // Space before list starts
    },
    budgetText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 8,
    },
    budgetAmount: {
        fontWeight: 'bold',
        color: '#E67E22', // Orange color for budget amount
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10, // Padding top/bottom for the list itself
        paddingBottom: 150, // Extra space at the bottom for footer overlap
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 12,
        // marginBottom: 10, // Replaced by separator
        shadowColor: '#B0B0B0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        alignItems: 'center', // Vertically center icon, details, price
    },
    itemIconContainer: {
        marginRight: 12,
        padding: 5,
        // backgroundColor: '#EAF2FA', // Optional: Subtle background for icon
        borderRadius: 20,
    },
    itemDetailsContainer: {
        flex: 1, // Take available space
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 15, // Slightly smaller name
        fontWeight: '500', // Medium weight
        color: '#333',
        marginBottom: 3,
    },
    itemQuantity: {
        fontSize: 13,
        color: '#666',
        marginBottom: 3,
    },
    itemReason: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic',
    },
    itemPriceContainer: {
        marginLeft: 10, // Space before price
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600', // Semi-bold price
        color: '#2E7D32', // Green color for price
    },
    separator: {
        height: 10, // Creates space between items
    },
    emptyListContainer: {
        flex: 1, // Take remaining space
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 100, // Avoid footers
    },
    emptyListText: {
        fontSize: 17,
        fontWeight: '500',
        color: '#777',
        textAlign: 'center',
        marginTop: 15,
    },
     emptyListSubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
    totalFooter: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFFFF', // White footer background
        position: 'absolute', // Stick to bottom above main footer
        bottom: 60, // Adjust based on main Footer height
        left: 0,
        right: 0,
        flexDirection: 'row', // Align items horizontally
        justifyContent: 'space-between', // Space out label and value
        alignItems: 'center',
        zIndex: 5, // Ensure it's above the list
    },
    totalPriceLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
    },
    totalPriceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28A745', // Default green color
    },
    totalPriceOverBudget: {
        color: '#DC3545', // Red color if over budget
    },
    warningText: {
        position: 'absolute', // Position warning below the total
        bottom: -16, // Adjust as needed
        left: 0,
        right: 0,
        fontSize: 11,
        color: '#DC3545',
        textAlign: 'center',
    },
    // appFooter style removed, relies on Footer component's internal styling and positioning if absolute
});

export default BudgetListScreen;