import Footer from '@/components/Footer';
import { RootStackParamList } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing, ScrollView } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';

type InventoryItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
    navigation: InventoryItemScreenNavigationProp;
};

type InventoryItem = {
    id: string;
    description: string;
    quantity: number;
    totalPrice: number;
    expiryDate?: string;
};

const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getBackgroundColor = (expiryDays: number | null) => {
    if (expiryDays === null) return '#D3D3D3';
    if (expiryDays <= 2) return '#FF6B6B';
    if (expiryDays <= 5) return '#90EE90';
    if (expiryDays > 5) return '#FFFF99';
    return '#D3D3D3';
};

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

        if (auth.currentUser) {
            const userUid = auth.currentUser.uid;
            const inventoryCollectionRef = collection(db, 'users', userUid, 'inventory');
            const q = query(inventoryCollectionRef);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: InventoryItem[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<InventoryItem, 'id'>),
                }));
                setInventoryItems(items);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
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
                    <ActivityIndicator size="large" color="black" />
                </Animated.View>
                <Text style={styles.loadingText}>Fetching Inventory...</Text>
            </View>
        );
    }

    if (inventoryItems.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Inventory</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Inventory is empty</Text>
                </View>
                <Footer navigation={navigation} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inventory</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <ScrollView>
                {inventoryItems.map((item) => {
                    const expiryDays = getDaysUntilExpiry(item.expiryDate);
                    const backgroundColor = getBackgroundColor(expiryDays);
                    const truncatedDescription = item.description.length > 25 ? item.description.substring(0, 25) + '...' : item.description;

                    return (
                        <View key={item.id} style={[styles.itemContainer, { backgroundColor }]}>
                            <View style={styles.itemDetailsContainer}>
                                <Text style={styles.itemName}>{truncatedDescription}</Text>
                                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                                <Text style={styles.itemPrice}>Price: Rs. {item.totalPrice}</Text>
                                {item.expiryDate && (
                                    <Text style={styles.itemExpiry}>Expiry: {item.expiryDate}</Text>
                                )}
                            </View>

                            <View style={styles.rightSection}>
                                <TouchableOpacity>
                                    <Text style={styles.moreText}>Reminder {'>>'}</Text>
                                </TouchableOpacity>
                                {expiryDays !== null ? (
                                    <Text style={styles.expiryText}>{expiryDays} Days</Text>
                                ) : (
                                    <Text style={styles.expiryText}>Add Expiry Date</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
            <Footer navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'gray',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: 'gray',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemDetailsContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    itemExpiry: {
        fontSize: 14,
        color: '#333',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    moreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
    },
    expiryText: {
        fontSize: 14,
        color: 'black',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 16,
    },
});

export default InventoryItemsScreen;