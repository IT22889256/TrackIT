import Footer from '@/components/Footer';
import { RootStackParamList } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, query, onSnapshot, Timestamp, where } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Dimensions } from 'react-native';

// --- Types ---
type InventoryItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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
    expiryDate?: Timestamp | string | null;
    priority: PriorityLevel;
    uid: string;
    measurementUnit: string;
    category: string;
};

// --- Helper Functions ---

const getDateFromExpiry = (expiryDate?: Timestamp | string | null): Date | null => {
    if (!expiryDate) return null;
    if (expiryDate instanceof Timestamp) {
        return expiryDate.toDate();
    }
    const date = new Date(expiryDate);
    return isNaN(date.getTime()) ? null : date;
};

const getDaysUntilExpiry = (expiryDateObj: Date | null): number | null => {
    if (!expiryDateObj) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDateObj.setHours(0, 0, 0, 0);
    const diffTime = expiryDateObj.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days;
};

const formatDisplayDate = (dateObj: Date | null): string | null => {
    if (!dateObj) return null;
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getExpiryBackgroundColor = (expiryDays: number | null): string => {
    if (expiryDays === null) return '#E0E0E0';
    if (expiryDays < 0) return '#FFCDD2';
    if (expiryDays <= 2) return '#FF8A80';
    if (expiryDays <= 7) return '#FFEB3B';
    return '#C8E6C9';
};

const getPriorityBadgeStyle = (priority: PriorityLevel | undefined): object => {
    switch (priority) {
        case 'Essential':
            return styles.priorityBadgeEssential;
        case 'Important':
            return styles.priorityBadgeImportant;
        case 'Optional':
            return styles.priorityBadgeOptional;
        default:
            return styles.priorityBadgeOptional;
    }
};

const generateInventoryReport = async (inventoryItems: InventoryItem[]) => {
    const priorityExpenses = inventoryItems.reduce((acc, item) => {
        const priority = item.priority || 'Optional';
        acc[priority] = (acc[priority] || 0) + item.totalPrice;
        return acc;
    }, {});

    const priorityList = Object.entries(priorityExpenses).map(([priority, totalPrice]) => ({ priority, totalPrice }));

    const totalExpense = priorityList.reduce((acc, item) => acc + item.totalPrice, 0);

    const pieChart = `
        <div style="width:100%; height:300px;">
            <svg width="100%" height="100%" viewBox="0 0 300 300">
                ${priorityList.map((item, index, array) => {
                    const total = array.reduce((acc, i) => acc + i.totalPrice, 0);
                    const startAngle = array.slice(0, index).reduce((acc, i) => acc + i.totalPrice / total * 360, 0);
                    const endAngle = startAngle + item.totalPrice / total * 360;
                    const midAngle = (startAngle + endAngle) / 2;
                    const x = 150 + 120 * Math.cos(midAngle * Math.PI / 180);
                    const y = 150 + 120 * Math.sin(midAngle * Math.PI / 180);

                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    const path = `M150,150 L${150 + 120 * Math.cos(startAngle * Math.PI / 180)},${150 + 120 * Math.sin(startAngle * Math.PI / 180)} A120,120 0 ${largeArcFlag},1 ${150 + 120 * Math.cos(endAngle * Math.PI / 180)},${150 + 120 * Math.sin(endAngle * Math.PI / 180)} Z`;
                    const colors = ['#3182CE', '#E53E3E', '#DD6B20'];

                    return `
                        <path d="${path}" fill="${colors[index % colors.length]}"/>
                        <text x="${x}" y="${y}" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="white">${(item.totalPrice / total * 100).toFixed(1)}%</text>
                    `;
                }).join('')}
            </svg>
        </div>
    `;

    const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            </style>
        </head>
        <body>
            <h2>Inventory Expenses by Priority</h2>
            ${pieChart}
            <table>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Total Expenses (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    ${priorityList.map(item => `
                        <tr>
                            <td>${item.priority}</td>
                            <td>${item.totalPrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p><strong>Total Expenses: Rs. ${totalExpense.toFixed(2)}</strong></p>
        </body>
        </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf'
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        Alert.alert('Error', 'An error occurred while generating the PDF report.');
    }
};

// --- Component ---
const InventoryItemsScreen: React.FC<Props> = ({ navigation }) => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const spinValue = useState(new Animated.Value(0))[0];

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

    useEffect(() => {
        if (auth.currentUser) {
            const userUid = auth.currentUser.uid;
            const inventoryCollectionRef = collection(db, 'inventory');
            const q = query(inventoryCollectionRef, where('uid', '==', userUid));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: InventoryItem[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as Omit<InventoryItem, 'id'>;
                    return {
                        id: doc.id,
                        ...data,
                        priority: data.priority || 'Important',
                    } as InventoryItem;
                });
                setInventoryItems(items);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching inventory: ", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            console.log("No user logged in.");
            setInventoryItems([]);
            setLoading(false);
        }
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
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
                <Footer navigation={navigation} />
            </View>
        );
    }

    if (inventoryItems.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Inventory</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={50} color="gray" />
                    <Text style={styles.emptyText}>Your inventory is empty.</Text>
                    <Text style={styles.emptySubText}>Scan a receipt or add items manually!</Text>
                </View>
                <Footer navigation={navigation} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Inventory</Text>
                <TouchableOpacity style={styles.reportButton} onPress={() => generateInventoryReport(inventoryItems)}>
                    <Ionicons name="document-text-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {inventoryItems.map((item) => {
                    const expiryDateObj = getDateFromExpiry(item.expiryDate);
                    const expiryDays = getDaysUntilExpiry(expiryDateObj);
                    const displayExpiryDate = formatDisplayDate(expiryDateObj);
                    const expiryBgColor = getExpiryBackgroundColor(expiryDays);
                    const priorityBadgeStyle = getPriorityBadgeStyle(item.priority);

                    return (
                        <TouchableOpacity key={item.id} onPress={() => navigation.navigate('ItemScreen', { item: item })} activeOpacity={0.7}>
                            <View style={[styles.itemCard, { borderLeftColor: expiryBgColor }]}>
                                <View style={[styles.priorityBadge, priorityBadgeStyle]}>
                                    <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.description}</Text>
                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="file-tray-stacked-outline" size={16} color="#555" />
                                        <Text style={styles.itemDetailText}>Quantity: {item.currentStock ?? 'N/A'} {item.measurementUnit}</Text>
                                    </View>
                                    <View style={styles.itemDetailRow}>
                                        <Ionicons name="cash-outline" size={16} color="#555" />
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
                                            <Text style={[styles.itemDetailText, { color: '#888' }]}>No Expiry Date Set</Text>
                                        </View>
                                    )}
                                </View>
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
                                        <Ionicons name="add-circle-outline" size={24} color="#AAA" />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
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
        backgroundColor: '#F8F9FA',
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
        color: '#333',
    },
    backButton: {
        padding: 5,
    },
    scrollContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 8,
        position: 'relative',
    },
    itemContent: {
        flex: 1,
        paddingVertical: 12,
        paddingLeft: 15,
        paddingRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    itemDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    itemDetailText: {
        fontSize: 13,
        color: '#495057',
        marginLeft: 8,
    },
    priorityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        zIndex: 2,
    },
    priorityBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    priorityBadgeEssential: {
        backgroundColor: '#DC3545',
    },
    priorityBadgeImportant: {
        backgroundColor: '#FFC107',
        color: '#333',
    },
    priorityBadgeOptional: {
        backgroundColor: '#6C757D',
    },
    expiryStatus: {
        width: 75,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#EEE',
        paddingHorizontal: 5,
    },
    expiryDaysNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28A745',
    },
    expiryDaysSoon: {
        color: '#FFC107',
    },
    expiryDaysExpired: {
        color: '#DC3545',
    },
    expiryDaysText: {
        fontSize: 10,
        color: '#6C757D',
        marginTop: 2,
        textAlign: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 15,
    },
    reportButton: {
        padding: 5,
    },
});

export default InventoryItemsScreen;