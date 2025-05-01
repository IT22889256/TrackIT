import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
    Modal, Animated, Dimensions, Platform
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Swipeable } from 'react-native-gesture-handler';
import {
    getFirestore, collection, getDocs, deleteDoc, doc, query, where
} from 'firebase/firestore';
import { app, auth } from '../firebaseConfig';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminder'>;

type Props = {
    navigation: ReminderScreenNavigationProp;
};

type ExpireItem = {
    id: string;
    productName: string;
    expiryDate: string;
    uid: string;
};

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    confirmText: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const { width } = Dimensions.get('window');

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    icon = 'warning',
    iconColor = '#FF9800',
    confirmText,
    cancelText,
    confirmColor = '#d91a20',
    onConfirm,
    onCancel
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel || onConfirm}
        >
            <View style={customAlertStyles.overlay}>
                <Animated.View
                    style={[
                        customAlertStyles.container,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <View style={customAlertStyles.iconContainer}>
                        <MaterialIcons name={icon as any} size={36} color={iconColor} />
                    </View>
                    <Text style={customAlertStyles.title}>{title}</Text>
                    <Text style={customAlertStyles.message}>{message}</Text>
                    <View style={customAlertStyles.buttonContainer}>
                        {cancelText && onCancel && (
                            <TouchableOpacity
                                style={[customAlertStyles.button, customAlertStyles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={customAlertStyles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                customAlertStyles.button,
                                customAlertStyles.confirmButton,
                                cancelText ? { flex: 1 } : { width: '100%' },
                                { backgroundColor: confirmColor }
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={customAlertStyles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const customAlertStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    confirmButton: {
        backgroundColor: '#d91a20',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

const ReminderScreen: React.FC<Props> = ({ navigation }) => {
    const [items, setItems] = useState<ExpireItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [filterOption, setFilterOption] = useState<'ALL' | 'WITHIN_7' | 'MORE_THAN_7'>('ALL');
    const db = getFirestore(app);
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
    
    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
    const [cartAlertVisible, setCartAlertVisible] = useState(false);
    const [successAlertVisible, setSuccessAlertVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedItem, setSelectedItem] = useState<ExpireItem | null>(null);

    useEffect(() => {
        const fetchExpireItems = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const expireItemsRef = collection(db, 'expireItems');
                    const q = query(expireItemsRef, where('uid', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const fetchedItems: ExpireItem[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        fetchedItems.push({
                            id: doc.id,
                            productName: data.productName,
                            expiryDate: data.expiryDate,
                            uid: data.uid,
                        });
                    });
                    setItems(fetchedItems);
                } catch (error) {
                    console.error('Error fetching expire items:', error);
                }
            }
        };

        fetchExpireItems();
    }, []);

    const toggleCheckbox = (id: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getDaysUntilExpiration = (expireDate: string): number => {
        const currentDate = new Date();
        const expirationDate = new Date(expireDate);
        const differenceInTime = expirationDate.getTime() - currentDate.getTime();
        return Math.floor(differenceInTime / (1000 * 3600 * 24));
    };

    const showSuccessAlert = (message: string) => {
        setSuccessMessage(message);
        setSuccessAlertVisible(true);
    };

    const handleDelete = (id: string) => {
        const item = items.find(item => item.id === id);
        if (item) {
            setSelectedItem(item);
            setDeleteAlertVisible(true);
        }
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;

        try {
            await deleteDoc(doc(db, 'expireItems', selectedItem.id));
            setItems((prevItems) => prevItems.filter((item) => item.id !== selectedItem.id));
            
            // Show success message using custom alert
            showSuccessAlert(`"${selectedItem.productName}" was deleted successfully!`);
        } catch (error) {
            console.error('Error deleting expire item:', error);
            showSuccessAlert('Failed to delete item. Please try again.');
        } finally {
            setDeleteAlertVisible(false);
        }
    };

    const handleAddToShoppingList = (item: ExpireItem) => {
        setSelectedItem(item);
        setCartAlertVisible(true);
    };

    const confirmAddToCart = () => {
        if (!selectedItem) return;

        navigation.navigate('ShoppingList', {
            newItems: [{
                name: selectedItem.productName,
                quantity: 1,
                description: `Expires on ${selectedItem.expiryDate}`,
                completed: false
            }]
        });
        setCartAlertVisible(false);
        
        const swipeable = swipeableRefs.current.get(selectedItem.id);
        if (swipeable) {
            swipeable.close();
        }
    };

    const cancelAlert = () => {
        setDeleteAlertVisible(false);
        setCartAlertVisible(false);
        
        if (selectedItem) {
            const swipeable = swipeableRefs.current.get(selectedItem.id);
            if (swipeable) {
                swipeable.close();
            }
        }
    };

    const closeSuccessAlert = () => {
        setSuccessAlertVisible(false);
    };

    const generateReportPDF = async () => {
        const within7Days = items.filter(item => getDaysUntilExpiration(item.expiryDate) <= 7);
        const moreThan7Days = items.filter(item => getDaysUntilExpiration(item.expiryDate) > 7);

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
            type: 'pie',
            data: {
                labels: ['Expiring in ≤ 7 Days', 'Expiring in > 7 Days'],
                datasets: [{
                    data: [within7Days.length, moreThan7Days.length],
                    backgroundColor: ['#FF6384', '#36A2EB'],
                }],
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Item Expiry Distribution',
                        font: {
                            size: 18
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            },
        }))}`;

        const formatItemList = (title: string, itemList: ExpireItem[]) => {
            if (itemList.length === 0) return `<p class="empty">No items in this category.</p>`;
            return `
                <h3>${title}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemList.map(item => `
                            <tr>
                                <td>${item.productName}</td>
                                <td>${item.expiryDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        };

        const htmlContent = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 30px;
                        color: #333;
                    }
                    h2 {
                        text-align: center;
                        color: #2c3e50;
                    }
                    h3 {
                        color: #34495e;
                        margin-top: 40px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 8px 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                    .empty {
                        font-style: italic;
                        color: #888;
                    }
                    hr {
                        margin: 40px 0;
                    }
                    img {
                        display: block;
                        margin: 20px auto;
                    }
                </style>
            </head>
            <body>
                <h2>Inventory Expiry Report</h2>
                <img src="${chartUrl}" alt="Expiry Breakdown Chart" width="400"/>
                ${formatItemList('Items Expiring Within 7 Days', within7Days)}
                <hr/>
                ${formatItemList('Items Expiring in More Than 7 Days', moreThan7Days)}
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
            showSuccessAlert('An error occurred while generating the PDF report.');
        }
    };

    const filteredItems = items.filter(item => {
        const days = getDaysUntilExpiration(item.expiryDate);
        if (filterOption === 'WITHIN_7') return days <= 7;
        if (filterOption === 'MORE_THAN_7') return days > 7;
        return true;
    });

    const onSwipeableOpen = (direction: 'left' | 'right', item: ExpireItem) => {
        if (direction === 'left') {
            handleDelete(item.id);
        } else if (direction === 'right') {
            handleAddToShoppingList(item);
        }
    };

    return (
        <View style={styles.container}>
            <CustomAlert
                visible={deleteAlertVisible}
                title="Delete Item"
                message={`Are you sure you want to delete "${selectedItem?.productName}"?`}
                icon="delete"
                iconColor="#d91a20"
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="#d91a20"
                onConfirm={confirmDelete}
                onCancel={cancelAlert}
            />

            <CustomAlert
                visible={cartAlertVisible}
                title="Add to Shopping List"
                message={`Do you want to add "${selectedItem?.productName}" to your shopping list?`}
                icon="shopping-cart"
                iconColor="#4CAF50"
                confirmText="Add"
                cancelText="Cancel"
                confirmColor="#4CAF50"
                onConfirm={confirmAddToCart}
                onCancel={cancelAlert}
            />

            <CustomAlert
                visible={successAlertVisible}
                title="Success"
                message={successMessage}
                icon="check-circle"
                iconColor="#4CAF50"
                confirmText="OK"
                confirmColor="#4CAF50"
                onConfirm={closeSuccessAlert}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Main')}>
                <Ionicons name="home-outline" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>Expiry Soon Items</Text>
            <Text style={styles.note}>Swipe left to delete, swipe right to add to shopping cart.</Text>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'ALL' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('ALL')}
                >
                    <Text style={[styles.filterText, filterOption === 'ALL' && { color: 'white' }]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'WITHIN_7' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('WITHIN_7')}
                >
                    <Text style={[styles.filterText, filterOption === 'WITHIN_7' && { color: 'white' }]}>Within 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'MORE_THAN_7' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('MORE_THAN_7')}
                >
                    <Text style={[styles.filterText, filterOption === 'MORE_THAN_7' && { color: 'white' }]}>More Than 7 Days</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const daysUntilExpiration = getDaysUntilExpiration(item.expiryDate);
                    let statusColor = '#48cf3c';
                    
                    if (daysUntilExpiration < 7) {
                        statusColor = '#d91a20';
                    } else if (daysUntilExpiration === 7) {
                        statusColor = '#FFD700';
                    }

                    const rightAction = () => (
                        <View style={styles.rightAction}>
                            <Ionicons name="cart-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Add to Cart</Text>
                        </View>
                    );

                    const leftAction = () => (
                        <View style={styles.leftAction}>
                            <Ionicons name="trash-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Delete</Text>
                        </View>
                    );

                    return (
                        <Swipeable
                            ref={(ref) => {
                                if (ref && !swipeableRefs.current.has(item.id)) {
                                    swipeableRefs.current.set(item.id, ref);
                                }
                            }}
                            renderLeftActions={leftAction}
                            renderRightActions={rightAction}
                            onSwipeableOpen={(direction) => {
                                if (direction === 'left') {
                                    handleDelete(item.id);
                                } else if (direction === 'right') {
                                    handleAddToShoppingList(item);
                                }
                            }}
                            overshootLeft={false}
                            overshootRight={false}
                        >
                            <View style={styles.itemContainer}>
                                <View style={[styles.statusLine, { backgroundColor: statusColor }]} />
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemExpireDate}>Expires: {item.expiryDate}</Text>
                                    {daysUntilExpiration <= 7 ? (
                                        <View style={styles.expiryBadge}>
                                            <Text style={styles.expiryBadgeText}>
                                                {daysUntilExpiration <= 0 
                                                    ? 'Expired!' 
                                                    : `${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} left`}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.safeExpiryBadge}>
                                            <Text style={styles.safeExpiryBadgeText}>
                                                {`${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} left`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    style={styles.editButton} 
                                    onPress={() => navigation.navigate('EditExpiryItem', { item })}
                                >
                                    <MaterialCommunityIcons name="pencil" size={20} color="#6200ea" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => toggleCheckbox(item.id)} style={styles.checkboxContainer}>
                                    <FontAwesome
                                        name={checkedItems[item.id] ? 'check-square' : 'square-o'}
                                        size={24}
                                        color="black"
                                    />
                                </TouchableOpacity>
                            </View>
                        </Swipeable>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="information-circle-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No items found</Text>
                        <Text style={styles.emptySubText}>Add items by clicking the button below</Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.reportButton} onPress={generateReportPDF}>
                <Ionicons name="document-text-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Generate Report</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.addItemButton} onPress={() => navigation.navigate('LabelScan')}>
                <Ionicons name="add-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    navItem: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    note: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ddd',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    filterButtonActive: {
        backgroundColor: '#6200ea',
    },
    filterText: {
        fontWeight: '600',
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    statusLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
    },
    itemContent: {
        flex: 1,
        marginLeft: 10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    itemExpireDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    checkboxContainer: {
        paddingLeft: 10,
    },
    editButton: {
        padding: 8,
        marginRight: 5,
    },
    leftAction: {
        flex: 1,
        backgroundColor: '#ff4d4d',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        flexDirection: 'column',
    },
    rightAction: {
        flex: 1,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        flexDirection: 'column',
    },
    actionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        marginTop: 4,
    },
    reportButton: {
        backgroundColor: '#03A9F4',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addItemButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
    },
    buttonIcon: {
        marginRight: 8,
    },
    expiryBadge: {
        backgroundColor: '#FFE0E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    expiryBadgeText: {
        color: '#d91a20',
        fontSize: 12,
        fontWeight: '600',
    },
    safeExpiryBadge: {
        backgroundColor: '#E0FFE0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    safeExpiryBadgeText: {
        color: '#48cf3c',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default ReminderScreen;