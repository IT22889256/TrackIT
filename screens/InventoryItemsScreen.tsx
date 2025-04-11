import Footer from '@/components/Footer'; // Ensure path is correct
import { RootStackParamList } from '@/types'; // Ensure path is correct
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { auth, db } from '../firebaseConfig'; // Ensure path is correct
import { collection, query, onSnapshot, Timestamp, where } from 'firebase/firestore'; // Import where
import { RouteProp } from '@react-navigation/native';

// --- Types ---
type InventoryItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>; // Adjust screen name if needed

type Props = {
    navigation: InventoryItemScreenNavigationProp;
};

// Define Priority Levels
type PriorityLevel = 'Essential' | 'Important' | 'Optional';

// Update InventoryItem type to include priority and handle potential Timestamp for expiryDate
type InventoryItem = {
    id: string;
    description: string;
    currentStock: number;
    totalPrice: number;
    expiryDate?: Timestamp | string | null; // Can be Firestore Timestamp, string, or null
    priority: PriorityLevel; // Add priority field
    uid: string; // Add uid field
    measurementUnit: string;
    // unitprice?: number; // Include if you save/need unit price
};

// --- Helper Functions ---

// Converts Firestore Timestamp or string to Date object
const getDateFromExpiry = (expiryDate?: Timestamp | string | null): Date | null => {
    if (!expiryDate) return null;
    if (expiryDate instanceof Timestamp) {
        return expiryDate.toDate();
    }
    // Try parsing as string - adjust format if needed ('YYYY-MM-DD')
    const date = new Date(expiryDate);
    return isNaN(date.getTime()) ? null : date;
};

// Calculates days until expiry from a Date object
const getDaysUntilExpiry = (expiryDateObj: Date | null): number | null => {
    if (!expiryDateObj) return null;
    const today = new Date();
    // Set hours to 0 to compare dates only
    today.setHours(0, 0, 0, 0);
    expiryDateObj.setHours(0, 0, 0, 0);

    const diffTime = expiryDateObj.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days; // Can be negative if expired
};

// Formats Date object to a readable string
const formatDisplayDate = (dateObj: Date | null): string | null => {
    if (!dateObj) return null;
    // Example format: Jan 15, 2025 - adjust as needed
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};


// Determines background color based on expiry days
const getExpiryBackgroundColor = (expiryDays: number | null): string => {
    if (expiryDays === null) return '#E0E0E0'; // Neutral grey if no date
    if (expiryDays < 0) return '#FFCDD2'; // Light red - Expired
    if (expiryDays <= 2) return '#FF8A80'; // Red - Expires very soon
    if (expiryDays <= 7) return '#FFEB3B'; // Yellow - Expires soon
    return '#C8E6C9'; // Green - Good
};

// Determines style for priority badge
const getPriorityBadgeStyle = (priority: PriorityLevel | undefined): object => {
    switch (priority) {
        case 'Essential':
            return styles.priorityBadgeEssential;
        case 'Important':
            return styles.priorityBadgeImportant;
        case 'Optional':
            return styles.priorityBadgeOptional;
        default:
            return styles.priorityBadgeOptional; // Default style
    }
};


// --- Component ---
const InventoryItemsScreen: React.FC<Props> = ({ navigation }) => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const spinValue = useState(new Animated.Value(0))[0]; // For loading animation

    // Loading animation effect
    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue]);

    // Firestore listener effect
    useEffect(() => {
        if (auth.currentUser) {
            const userUid = auth.currentUser.uid;
            const inventoryCollectionRef = collection(db, 'inventory'); // Reference the 'inventory' collection
            const q = query(inventoryCollectionRef, where('uid', '==', userUid)); // Query for items with the current user's UID

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: InventoryItem[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as Omit<InventoryItem, 'id'>;
                    return {
                        id: doc.id,
                        ...data,
                        priority: data.priority || 'Important',
                    } as InventoryItem; // Type assertion to InventoryItem
                });
                setInventoryItems(items);
                setLoading(false);
            }, (error) => { // Handle snapshot errors
                console.error("Error fetching inventory: ", error);
                setLoading(false);
                // Optionally show an error message to the user
            });

            // Cleanup listener on component unmount
            return () => unsubscribe();
        } else {
            console.log("No user logged in.");
            setInventoryItems([]); // Clear items if user logs out
            setLoading(false);
        }
    }, []); // Empty dependency array means this runs once on mount (and cleans up)

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // --- Render Logic ---

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    {/* Use a custom icon or image if preferred */}
                    <Ionicons name="basket-outline" size={60} color="black" />
                </Animated.View>
                <Text style={styles.loadingText}>Fetching Inventory...</Text>
            </View>
        );
    }

    if (!auth.currentUser) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="log-in-outline" size={50} color="gray" />
                <Text style={styles.emptyText}>Please log in to view your inventory.</Text>
                {/* Optional: Add a login button */}
                <Footer navigation={navigation} />
            </View>
        );
    }


    if (inventoryItems.length === 0) {
        return (
            <View style={styles.container}>
                {/* Keep Header consistent */}
                <Text style={styles.title}>Inventory</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={50} color="gray" />
                    <Text style={styles.emptyText}>Your inventory is empty.</Text>
                    <Text style={styles.emptySubText}>Scan a receipt or add items manually!</Text>
                </View>
                <Footer navigation={navigation} />
            </View>
        );
    }

    // Main content display
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inventory</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Use ScrollView as per original code, consider FlatList for long lists */}
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {inventoryItems.map((item) => {
                    const expiryDateObj = getDateFromExpiry(item.expiryDate);
                    const expiryDays = getDaysUntilExpiry(expiryDateObj);
                    const displayExpiryDate = formatDisplayDate(expiryDateObj);
                    const expiryBgColor = getExpiryBackgroundColor(expiryDays);
                    const priorityBadgeStyle = getPriorityBadgeStyle(item.priority);

                    return (
                        // Item Card
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                                // Format the expiry date before passing to the next screen
                                const formattedExpiry = displayExpiryDate || null;
                                navigation.navigate('ItemScreen', {
                                    itemId: item.id,
                                    description: item.description,
                                    currentStock: item.currentStock,
                                    totalPrice: item.totalPrice,
                                    expiryDate: formattedExpiry, // Pass the formatted date or null
                                    priority: item.priority,
                                    uid: item.uid,
                                    measurementUnit: item.measurementUnit,
                                });
                            }}
                            activeOpacity={0.7} // Optional: visual feedback on press
                        >
                            <View style={[styles.itemCard, { borderLeftColor: expiryBgColor }]}>
                                {/* Priority Badge */}
                                <View style={[styles.priorityBadge, priorityBadgeStyle]}>
                                    <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                                </View>

                                {/* Item Details Section */}
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.description}</Text>

                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="file-tray-stacked-outline" size={16} color="#555" />
                                        <Text style={styles.itemDetailText}>Quantity: {item.currentStock ?? 'N/A'} {item.measurementUnit}</Text>
                                    </View>

                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="cash-outline" size={16} color="#555" />
                                        {/* Display Total Price, consider adding Unit Price if available */}
                                        <Text style={styles.itemDetailText}>Total Price: Rs. {item.totalPrice?.toFixed(2) ?? 'N/A'}</Text>
                                    </View>

                                    {displayExpiryDate ? (
                                        <View style={styles.itemDetailRow}>
                                            <Ionicons name="calendar-outline" size={16} color="#555" />
                                            <Text style={styles.itemDetailText}>Expires: {displayExpiryDate}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.itemDetailRow}>
                                            <Ionicons name="calendar-outline" size={16} color="#888" />
                                            {/* Optional: Add touchable to add date */}
                                            <Text style={[styles.itemDetailText, { color: '#888' }]}>No Expiry Date Set</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Expiry Status Section */}
                                <View style={styles.expiryStatus}>
                                    {expiryDays !== null ? (
                                        <>
                                            <Text style={[styles.expiryDaysNumber, expiryDays < 0 ? styles.expiryDaysExpired : (expiryDays <= 7 ? styles.expiryDaysSoon : null)]}>
                                                {expiryDays < 0 ? Math.abs(expiryDays) : expiryDays}
                                            </Text>
                                            <Text style={styles.expiryDaysText}>
                                                {expiryDays < 0 ? (expiryDays === -1 ? 'Day Ago' : 'Days Ago') : (expiryDays === 1 ? 'Day Left' : 'Days Left')}
                                            </Text>
                                        </>
                                    ) : (
                                        // Placeholder or button to add expiry
                                        <Ionicons name="add-circle-outline" size={24} color="#AAA" />
                                    )}
                                </View>
                            </View></TouchableOpacity>
                    );
                })}
            </ScrollView>
            <Footer navigation={navigation} />
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background for the whole screen
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: 'gray',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: 'white',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        color: 'gray',
        textAlign: 'center',
        marginTop: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 50, // Adjust for status bar/notch
        marginBottom: 15,
        color: '#333',
    },
    backButton: {
        position: 'absolute',
        top: 50, // Match title margin top
        left: 16,
        zIndex: 1, // Ensure it's above other elements
        padding: 5, // Make touch target bigger
    },
    scrollContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 80, // Space for footer
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'stretch', // Make columns same height
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 8, // Thick border for expiry color
        position: 'relative', // Needed for absolute positioning of badge
    },
    itemContent: {
        flex: 1, // Take most space
        paddingVertical: 12,
        paddingLeft: 15,
        paddingRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8, // More space below name
    },
    itemDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5, // Space between detail rows
    },
    itemDetailText: {
        fontSize: 13,
        color: '#495057',
        marginLeft: 8, // Space after icon
    },
    priorityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12, // Pill shape
        zIndex: 2,
    },
    priorityBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Specific Badge Styles
    priorityBadgeEssential: {
        backgroundColor: '#DC3545', // Red
    },
    priorityBadgeImportant: {
        backgroundColor: '#FFC107', // Yellow/Orange
        color: '#333', // Darker text for yellow
    },
    priorityBadgeOptional: {
        backgroundColor: '#6C757D', // Gray
    },
    expiryStatus: {
        width: 75, // Fixed width for the right section
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#EEE', // Subtle separator line
        paddingHorizontal: 5,
    },
    expiryDaysNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28A745', // Default green
    },
    expiryDaysSoon: {
        color: '#FFC107', // Yellow/Orange for soon
    },
    expiryDaysExpired: {
        color: '#DC3545', // Red for expired/past
    },
    expiryDaysText: {
        fontSize: 10,
        color: '#6C757D', // Gray text
        marginTop: 2,
        textAlign: 'center'
    },
});

export default InventoryItemsScreen;