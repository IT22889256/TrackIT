import Footer from '@/components/Footer'; // Assuming Footer component exists
import { RootStackParamList } from '@/types'; // Assuming types file exists
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator, // Used instead of Ionicons animation in loading for simplicity here, original code used Animated
    Alert,
    Platform // Added for potential platform-specific styling if needed
} from 'react-native';
import { auth, db } from '../firebaseConfig'; // Assuming firebaseConfig is correctly set up
import { collection, query, onSnapshot, Timestamp, where, DocumentData } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Dimensions might be needed if styling depends on screen size, but not used in current styles
// import { Dimensions } from 'react-native';

// --- Types ---
// Ensure RootStackParamList includes 'ManuallyAddItem' and 'ItemScreen'
// Example:
// export type RootStackParamList = {
//   Home: undefined;
//   InventoryItems: undefined;
//   ItemScreen: { item: InventoryItem };
//   ManuallyAddItem: undefined;
//   Login: undefined; // If you have a login screen
//   // ... other screens
// };

type InventoryItemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InventoryItems'>; // Changed from Home if this screen is 'InventoryItems'

type Props = {
    navigation: InventoryItemsScreenNavigationProp;
};

// Define Priority Levels
type PriorityLevel = 'Essential' | 'Important' | 'Optional';

// Update InventoryItem type to include priority and handle potential Timestamp for expiryDate
type InventoryItem = {
    id: string;
    description: string;
    currentStock: number;
    totalPrice: number;
    expiryDate?: Timestamp | string | null; // Can be Firestore Timestamp, string representation, or null
    priority: PriorityLevel;
    uid: string; // User ID associated with the item
    measurementUnit: string;
    category: string; // Added category field
};

// Type for data fetched from Firestore before adding the id
type InventoryItemData = Omit<InventoryItem, 'id'>;


// --- Helper Functions ---

/**
 * Converts Firestore Timestamp or string date to a JavaScript Date object.
 * Returns null if the input is invalid or null/undefined.
 */
const getDateFromExpiry = (expiryDate?: Timestamp | string | null): Date | null => {
    if (!expiryDate) return null;
    try {
        if (expiryDate instanceof Timestamp) {
            return expiryDate.toDate();
        }
        // Attempt to parse string dates (ISO format, common date strings)
        const date = new Date(expiryDate);
        // Check if the parsed date is valid
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error("Error parsing date:", expiryDate, error);
        return null;
    }
};

/**
 * Calculates the number of full days remaining until the expiry date.
 * Returns null if the expiry date is null.
 * Returns negative number if the date is in the past.
 */
const getDaysUntilExpiry = (expiryDateObj: Date | null): number | null => {
    if (!expiryDateObj) return null;

    const today = new Date();
    // Reset time part to compare dates only
    today.setHours(0, 0, 0, 0);

    // Clone expiryDateObj before modifying it to avoid side effects
    const expiryDateOnly = new Date(expiryDateObj);
    expiryDateOnly.setHours(0, 0, 0, 0);

    const diffTime = expiryDateOnly.getTime() - today.getTime();
    // Use Math.ceil to count partial days as a full day remaining
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days;
};

/**
 * Formats a Date object into a short, readable string (e.g., "Apr 29, 2025").
 * Returns null if the date object is null.
 */
const formatDisplayDate = (dateObj: Date | null): string | null => {
    if (!dateObj) return null;
    // Using locale-aware formatting
    return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short', // 'long' or 'short'
        day: 'numeric',
    });
};

/**
 * Determines the background color for the expiry indicator based on days remaining.
 */
const getExpiryBackgroundColor = (expiryDays: number | null): string => {
    if (expiryDays === null) return '#E0E0E0'; // Grey for no date / N/A
    if (expiryDays < 0) return '#FFCDD2';    // Light Red for expired
    if (expiryDays <= 2) return '#FF8A80';    // Red for expiring very soon (0-2 days)
    if (expiryDays <= 7) return '#FFEB3B';    // Yellow for expiring soon (3-7 days)
    return '#C8E6C9';                         // Green for safe (more than 7 days)
};

/**
 * Returns the style object for the priority badge based on the priority level.
 */
const getPriorityBadgeStyle = (priority: PriorityLevel | undefined): object => {
    switch (priority) {
        case 'Essential':
            return styles.priorityBadgeEssential;
        case 'Important':
            return styles.priorityBadgeImportant;
        case 'Optional':
            return styles.priorityBadgeOptional;
        default:
            // Default to a neutral or common priority style if undefined
            return styles.priorityBadgeOptional; // Or use a specific 'undefined' style
    }
};

/**
 * Generates an HTML report for inventory expenses, creates a PDF, and initiates sharing.
 */
const generateInventoryReport = async (inventoryItems: InventoryItem[]) => {
    // Aggregate expenses by priority
    const priorityExpenses = inventoryItems.reduce((acc, item) => {
        // Ensure every item contributes, even if priority is somehow missing (defaults here)
        const priority = item.priority || 'Optional'; // Default priority if undefined
        // Ensure totalPrice is a number, default to 0 if null/undefined
        const price = typeof item.totalPrice === 'number' ? item.totalPrice : 0;
        acc[priority] = (acc[priority] || 0) + price;
        return acc;
    }, {} as Record<PriorityLevel, number>); // Type the accumulator explicitly

    // Convert aggregated data into a list suitable for mapping
    const priorityList = Object.entries(priorityExpenses)
                           // Filter out priorities with zero expense if desired
                           // .filter(([_, totalPrice]) => totalPrice > 0)
                           .map(([priority, totalPrice]) => ({ priority: priority as PriorityLevel, totalPrice }));

    // Calculate overall total expense
    const totalExpense = priorityList.reduce((acc, item) => acc + item.totalPrice, 0);

    // Generate SVG Pie Chart if there are expenses
    const hasExpenses = totalExpense > 0;
    const pieChart = hasExpenses ? `
        <div style="width:100%; max-width: 300px; height:300px; margin: 20px auto;">
            <svg width="100%" height="100%" viewBox="0 0 300 300">
                ${priorityList.map((item, index, array) => {
                    const percentage = item.totalPrice / totalExpense;
                    // Don't draw slices for 0%
                    if (percentage === 0) return '';

                    const totalAngleSoFar = array.slice(0, index).reduce((acc, i) => acc + (i.totalPrice / totalExpense * 360), 0);
                    const startAngle = totalAngleSoFar;
                    const endAngle = startAngle + percentage * 360;
                    // Prevent tiny gaps for precision issues by slightly overlapping if endAngle is close to 360 and it's the last slice
                    const adjustedEndAngle = (index === array.length - 1 && Math.abs(endAngle - 360) < 0.1) ? 360 : endAngle;


                    // Calculate coordinates for the arc path
                    const startX = 150 + 120 * Math.cos(startAngle * Math.PI / 180);
                    const startY = 150 + 120 * Math.sin(startAngle * Math.PI / 180);
                    const endX = 150 + 120 * Math.cos(adjustedEndAngle * Math.PI / 180);
                    const endY = 150 + 120 * Math.sin(adjustedEndAngle * Math.PI / 180);

                    // Calculate mid-angle for text label positioning (optional, can be complex)
                    const midAngle = (startAngle + adjustedEndAngle) / 2;
                    // Position text inside or outside the slice based on angle/size
                    const textRadius = percentage > 0.1 ? 80 : 130; // Example: text further out for small slices
                    const textX = 150 + textRadius * Math.cos(midAngle * Math.PI / 180);
                    const textY = 150 + textRadius * Math.sin(midAngle * Math.PI / 180);


                    const largeArcFlag = adjustedEndAngle - startAngle > 180 ? 1 : 0;
                    // Path: Move to center, Line to start arc, Arc to end, Close path
                    const path = `M150,150 L${startX},${startY} A120,120 0 ${largeArcFlag},1 ${endX},${endY} Z`;

                    // Use consistent colors matching the badges
                    const priorityColors: Record<string, string> = {
                        'Essential': '#DC3545', // Red
                        'Important': '#FFC107', // Yellow
                        'Optional':  '#6C757D', // Grey
                    };
                    const color = priorityColors[item.priority] || '#007AFF'; // Default blue

                    return `
                        <path d="${path}" fill="${color}"/>
                        ${percentage > 0.03 ? // Only show label if slice is large enough
                           `<text x="${textX}" y="${textY}" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="${percentage > 0.1 ? 'white' : '#333'}" font-weight="bold">${(percentage * 100).toFixed(1)}%</text>`
                           : ''}
                    `;
                }).join('')}
            </svg>
        </div>
    ` : '<p style="text-align:center; padding: 20px;">No expense data available to generate chart.</p>';

    // Generate a legend for the chart
    const legend = hasExpenses ? `
        <div style="text-align: center; margin-top: 0px; margin-bottom: 20px; font-size: 12px;">
            ${priorityList.map(item => {
                 const priorityColors: Record<string, string> = {
                    'Essential': '#DC3545', 'Important': '#FFC107', 'Optional':  '#6C757D',
                 };
                 const color = priorityColors[item.priority] || '#007AFF';
                 // Only show legend item if it has expenses
                 if (item.totalPrice <= 0) return '';
                 return `<span style="display: inline-block; margin: 0 10px;">
                            <span style="height: 10px; width: 10px; background-color: ${color}; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle;"></span>
                            ${item.priority}
                         </span>`;
            }).join('')}
        </div>
    ` : '';


    // Construct the full HTML content for the PDF
    const htmlContent = `
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 25px; font-size: 14px; color: #333; }
                h2, h3 { text-align: center; color: #333; margin-bottom: 10px; }
                h2 { font-size: 20px; }
                h3 { font-size: 16px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .total-row { font-weight: bold; background-color: #e9ecef; }
                .priority-cell { text-transform: capitalize; }
                .currency { text-align: right; }
                .footer-text { text-align: center; margin-top: 30px; font-size: 10px; color: #aaa; }
            </style>
        </head>
        <body>
            <h2>Inventory Expense Report</h2>
            <h3>Expenses by Priority</h3>
            ${pieChart}
            ${legend}
            <table>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th class="currency">Total Expenses (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    ${priorityList.map(item => `
                        <tr>
                            <td class="priority-cell">${item.priority}</td>
                            <td class="currency">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    ${hasExpenses ? `
                    <tr class="total-row">
                        <td>Total</td>
                        <td class="currency">${totalExpense.toFixed(2)}</td>
                    </tr>
                    ` : `
                    <tr>
                        <td colspan="2" style="text-align:center;">No expenses recorded.</td>
                    </tr>
                    `}
                </tbody>
            </table>
            <p class="footer-text">
                Report generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </p>
        </body>
        </html>
    `;

    // Generate PDF and share
    try {
        const { uri } = await Print.printToFileAsync({
             html: htmlContent,
             // Optional: define page size, margins etc.
             // width: 612, // Standard US Letter width in points (8.5 inches * 72 points/inch)
             // height: 792, // Standard US Letter height in points (11 inches * 72 points/inch)
        });
        console.log('PDF generated at:', uri);

        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert('Sharing Error', 'Sharing is not available on this device.');
            return;
        }

        await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: 'Share Inventory Expense Report'
        });
    } catch (error) {
        console.error('Error generating or sharing PDF:', error);
        Alert.alert('Error', 'Could not generate or share the PDF report. Please try again.');
    }
};


// --- Component ---
const InventoryItemsScreen: React.FC<Props> = ({ navigation }) => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    // Original code used Animated API for loading spinner.
    // For simplicity in this full code example, we might just use ActivityIndicator,
    // but keeping the original state setup if Animated is intended.
    // const spinValue = useState(new Animated.Value(0))[0];

    // useEffect for loading animation (if using Animated)
    // useEffect(() => {
    //     Animated.loop(
    //         Animated.timing(spinValue, {
    //             toValue: 1,
    //             duration: 2000,
    //             easing: Easing.linear,
    //             useNativeDriver: true,
    //         })
    //     ).start();
    // }, [spinValue]);

    // Effect to fetch inventory items from Firestore
    useEffect(() => {
        // Ensure user is authenticated
        const currentUser = auth.currentUser;
        if (currentUser) {
            const userUid = currentUser.uid;
            const inventoryCollectionRef = collection(db, 'inventory');
            // Query items belonging to the current user
            const q = query(inventoryCollectionRef, where('uid', '==', userUid));

            setLoading(true); // Set loading true when starting fetch

            // Subscribe to real-time updates
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: InventoryItem[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as InventoryItemData; // Cast data to expected type

                    // Perform data validation/defaults here
                    const priority = data.priority && ['Essential', 'Important', 'Optional'].includes(data.priority)
                                     ? data.priority
                                     : 'Important'; // Default priority

                    const currentStock = typeof data.currentStock === 'number' ? data.currentStock : 0;
                    const totalPrice = typeof data.totalPrice === 'number' ? data.totalPrice : 0;
                    const description = data.description || 'No Description';
                    const measurementUnit = data.measurementUnit || '';
                    const category = data.category || 'Uncategorized';


                    return {
                        id: doc.id, // Add the document ID
                        description,
                        currentStock,
                        totalPrice,
                        expiryDate: data.expiryDate, // Keep as is, parsing happens in helper
                        priority,
                        uid: data.uid, // Should match userUid from query
                        measurementUnit,
                        category,
                    };
                });

                // Sort items (example: by expiry date, soonest first, then by name)
                items.sort((a, b) => {
                    const dateA = getDateFromExpiry(a.expiryDate);
                    const dateB = getDateFromExpiry(b.expiryDate);

                    if (dateA && dateB) {
                        if (dateA.getTime() !== dateB.getTime()) {
                            return dateA.getTime() - dateB.getTime(); // Sort ascending by date
                        }
                    } else if (dateA) {
                        return -1; // Items with dates come before items without
                    } else if (dateB) {
                        return 1; // Items without dates come after items with
                    }
                    // If dates are the same or both null, sort by description
                    return a.description.localeCompare(b.description);
                });

                setInventoryItems(items);
                setLoading(false); // Data fetched, stop loading
            }, (error) => {
                // Handle errors during snapshot listening
                console.error("Error fetching inventory snapshot: ", error);
                Alert.alert("Database Error", "Could not fetch inventory data. Please check your connection and try again.");
                setLoading(false); // Stop loading on error too
            });

            // Cleanup function to unsubscribe when component unmounts or user changes
            return () => unsubscribe();

        } else {
            // No user logged in
            console.log("InventoryItemsScreen: No user logged in.");
            setInventoryItems([]); // Clear items
            setLoading(false); // Not loading as there's no user to fetch for
            // Optional: Redirect to Login screen
            // navigation.navigate('Login');
        }
    }, []); // Dependency array is empty, runs once on mount (or when auth state changes if you add auth listener)


    // Calculate rotation for Animated spinner (if using)
    // const spin = spinValue.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: ['0deg', '360deg'],
    // });


    // --- Render Loading State ---
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                {/* Simple Activity Indicator */}
                <ActivityIndicator size="large" color="#007AFF" />
                {/* Or the Animated version from original code: */}
                {/* <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="basket-outline" size={60} color="#4A90E2" />
                </Animated.View> */}
                <Text style={styles.loadingText}>Fetching Your Inventory...</Text>
            </View>
        );
    }

    // --- Render Not Logged In State ---
    if (!auth.currentUser) {
        return (
            <View style={styles.container}>
                 {/* Minimal Header for consistency */}
                 <View style={styles.header}>
                     <View style={{ width: 40 }} /> {/* Spacer */}
                     <Text style={styles.title}>Inventory</Text>
                     <View style={{ width: 40 }} /> {/* Spacer */}
                 </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="log-in-outline" size={50} color="gray" />
                    <Text style={styles.emptyText}>Login Required</Text>
                    <Text style={styles.emptySubText}>Please log in to view and manage your inventory.</Text>
                    {/* Optional: Button to navigate to Login screen */}
                     {/* <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                         <Text style={styles.loginButtonText}>Go to Login</Text>
                    </TouchableOpacity> */}
                </View>
                 {/* Footer might still be relevant */}
                 <Footer navigation={navigation} />
             </View>
        );
    }

    // --- Render Empty Inventory State ---
    if (inventoryItems.length === 0) {
        return (
            <View style={styles.container}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Inventory</Text>
                     {/* Right spacer for alignment */}
                     <View style={{ width: 40 }} />
                </View>

                {/* Empty State Message */}
                <View style={styles.emptyContainer}>
                    <Ionicons name="file-tray-outline" size={60} color="#adb5bd" />
                    <Text style={styles.emptyText}>Inventory is Empty</Text>
                    <Text style={styles.emptySubText}>Tap the '+' button to add an item manually, or scan a receipt from the Home screen.</Text>
                </View>

                {/* FAB for Adding Items - Still visible when empty */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('ManuallyAddItem')}
                    activeOpacity={0.8} // Control visual feedback on press
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>

                {/* Footer */}
                <Footer navigation={navigation} />
            </View>
        );
    }

    // --- Render Inventory List State ---
    return (
        <View style={styles.container}>
            {/* Header with Back Button and Report Button */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Inventory</Text>
                <TouchableOpacity style={styles.reportButton} onPress={() => generateInventoryReport(inventoryItems)}>
                    <Ionicons name="document-text-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Scrollable List of Inventory Items */}
            <ScrollView
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false} // Optional: hide scrollbar
            >
                {inventoryItems.map((item) => {
                    // Calculate expiry details for each item
                    const expiryDateObj = getDateFromExpiry(item.expiryDate);
                    const expiryDays = getDaysUntilExpiry(expiryDateObj);
                    const displayExpiryDate = formatDisplayDate(expiryDateObj);
                    // Determine colors and styles based on item data
                    const expiryBorderColor = getExpiryBackgroundColor(expiryDays);
                    const priorityBadgeStyle = getPriorityBadgeStyle(item.priority);

                    return (
                        // Item Card - Navigates to ItemScreen on press
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => navigation.navigate('ItemScreen', { item: item })} // Pass the full item object
                            activeOpacity={0.7}
                            style={[styles.itemCard, { borderLeftColor: expiryBorderColor }]} // Dynamic border color based on expiry
                        >
                            {/* Priority Badge (Top Right Corner) */}
                            <View style={[styles.priorityBadge, priorityBadgeStyle]}>
                                <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                            </View>

                            {/* Main Item Content Area */}
                            <View style={styles.itemContent}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.description}</Text>
                                <View style={styles.itemDetailRow}>
                                    <Ionicons name="file-tray-stacked-outline" size={15} color="#555" style={styles.iconStyle}/>
                                    <Text style={styles.itemDetailText}>Qty: {item.currentStock} {item.measurementUnit}</Text>
                                </View>
                                <View style={styles.itemDetailRow}>
                                    <Ionicons name="cash-outline" size={15} color="#555" style={styles.iconStyle}/>
                                    <Text style={styles.itemDetailText}>Value: Rs. {item.totalPrice.toFixed(2)}</Text>
                                </View>
                                {/* Display Expiry Date or 'No Expiry' */}
                                {displayExpiryDate ? (
                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="calendar-outline" size={15} color="#555" style={styles.iconStyle}/>
                                        <Text style={styles.itemDetailText}>Expires: {displayExpiryDate}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="calendar-outline" size={15} color="#999" style={styles.iconStyle}/>
                                        <Text style={[styles.itemDetailText, { color: '#999' }]}>No Expiry Date</Text>
                                    </View>
                                )}
                                {/* Optionally display Category */}
                                <View style={styles.itemDetailRow}>
                                   <Ionicons name="pricetag-outline" size={15} color="#555" style={styles.iconStyle}/>
                                   <Text style={styles.itemDetailText}>Category: {item.category}</Text>
                                </View>
                            </View>

                            {/* Expiry Status Indicator (Right Side) */}
                            <View style={styles.expiryStatus}>
                                {expiryDays !== null ? (
                                    // Display days left/ago
                                    <>
                                        <Text style={[
                                            styles.expiryDaysNumber,
                                            expiryDays < 0 ? styles.expiryDaysExpired : (expiryDays <= 7 ? styles.expiryDaysSoon : null)
                                        ]}>
                                            {/* Show absolute number of days */}
                                            {Math.abs(expiryDays)}
                                        </Text>
                                        <Text style={styles.expiryDaysText}>
                                            {/* Contextual text: Days Left / Days Ago */}
                                            {expiryDays < 0 ? (expiryDays === -1 ? 'Day Ago' : 'Days Ago') : (expiryDays === 0 ? 'Today' : (expiryDays === 1 ? 'Day Left' : 'Days Left'))}
                                        </Text>
                                    </>
                                ) : (
                                    // Placeholder icon if no expiry date exists
                                    <Ionicons name="remove-circle-outline" size={24} color="#CCC" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Floating Action Button (FAB) for Adding Items */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ManuallyAddItem')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

        
        </View>
    );
};


// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // A light grey background
    },
    // --- Loading and Empty States ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white', // Or match container background
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6C757D', // Bootstrap secondary color
    },
    emptyContainer: {
        flex: 1, // Take up remaining vertical space
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80, // Ensure space above footer/FAB
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#495057', // Darker grey
        textAlign: 'center',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#6C757D', // Lighter grey
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
     // Optional Login Button Style
    // loginButton: {
    //     marginTop: 25,
    //     backgroundColor: '#007AFF',
    //     paddingVertical: 12,
    //     paddingHorizontal: 35,
    //     borderRadius: 25,
    //     elevation: 2,
    // },
    // loginButtonText: {
    //     color: 'white',
    //     fontSize: 16,
    //     fontWeight: 'bold',
    // },
    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10, // Reduced horizontal padding
        paddingTop: Platform.OS === 'android' ? 40 : 50, // Adjust for status bar
        paddingBottom: 12,
        backgroundColor: 'white', // Header background
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF', // Subtle separator line
    },
    title: {
        fontSize: 20, // Slightly smaller title
        fontWeight: 'bold',
        color: '#343A40', // Dark grey title
    },
    backButton: {
        padding: 10, // Make tap area larger
        width: 44, // Minimum touch target size
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportButton: {
        padding: 10,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- ScrollView and Item Card ---
    scrollContentContainer: {
        paddingHorizontal: 12, // Consistent padding
        paddingTop: 16,
        paddingBottom: 150, // Generous padding to ensure FAB doesn't hide last item
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'stretch', // Ensure vertical stretch
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, // Softer shadow
        shadowRadius: 3,
        elevation: 2,
        borderLeftWidth: 8, // Keep the colored expiry border
        overflow: 'hidden', // Clip priority badge if needed
    },
    itemContent: {
        flex: 1, // Takes up available space
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: 8,
        justifyContent: 'center', // Center content vertically
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529', // Very dark grey
        marginBottom: 8,
    },
    itemDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    iconStyle: {
        marginRight: 8, // Space between icon and text
    },
    itemDetailText: {
        fontSize: 13,
        color: '#495057', // Medium grey
        flexShrink: 1, // Allow text to wrap or shrink if needed
    },
    // --- Priority Badge ---
    priorityBadge: {
        position: 'absolute',
        top: 8,
        right: 8, // Position inside the card
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        zIndex: 1, // Ensure it's above content
        elevation: 1, // Slight elevation for visibility
    },
    priorityBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    priorityBadgeEssential: {
        backgroundColor: '#DC3545', // Red
    },
    priorityBadgeImportant: {
        backgroundColor: '#FFC107', // Yellow
        // Consider dark text for yellow background if needed for contrast
        // color: '#333',
    },
    priorityBadgeOptional: {
        backgroundColor: '#6C757D', // Grey
    },
    // --- Expiry Status Indicator ---
    expiryStatus: {
        width: 80, // Slightly wider if needed
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderLeftWidth: 1,
        borderLeftColor: '#E9ECEF', // Light separator line
        // Optional: Slightly different background for visual grouping
        // backgroundColor: '#F8F9FA',
    },
    expiryDaysNumber: {
        fontSize: 20, // Larger number
        fontWeight: 'bold',
        color: '#28A745', // Default: Green (safe)
        textAlign: 'center',
    },
    expiryDaysSoon: {
        color: '#FD7E14', // Orange for soon
    },
    expiryDaysExpired: {
        color: '#DC3545', // Red for expired
    },
    expiryDaysText: {
        fontSize: 10,
        color: '#6C757D', // Grey text
        marginTop: 2,
        textAlign: 'center',
        lineHeight: 12,
    },
    // --- Floating Action Button (FAB) ---
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 85, // Adjust this value based on your Footer height (e.g., Footer height + 15)
        width: 56,
        height: 56,
        borderRadius: 28, // Half of width/height for circle
        backgroundColor: '#007AFF', // iOS Blue (or your app's primary color)
        justifyContent: 'center',
        alignItems: 'center',
        // Platform-specific shadows
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
        zIndex: 1000, // Ensure it's above everything else
    },
});

export default InventoryItemsScreen;