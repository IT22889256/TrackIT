import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ScrollView,
    Animated
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

// Placeholder types, replace with your actual types
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
    navigation: HomeScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [fontsLoaded] = useFonts({
        // 'InterBold': require('../assets/fonts/Inter-Bold.ttf'),
        // 'InterRegular': require('../assets/fonts/Inter-Regular.ttf'),
        // 'InterMedium': require('../assets/fonts/Inter-Medium.ttf'),
    });

    // Animation refs for buttons
    const inventoryButtonScale = useRef(new Animated.Value(1)).current;
    const shoppingButtonScale = useRef(new Animated.Value(1)).current;
    const expiryButtonScale = useRef(new Animated.Value(1)).current;
    const generateButtonScale = useRef(new Animated.Value(1)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    const handleExpirySoonItemsPress = () => {
        navigation.navigate('Reminder');
    };

    const handlePressIn = (animatedValue: Animated.Value) => {
        Animated.spring(animatedValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (animatedValue: Animated.Value, onPress: () => void) => {
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
        }).start(() => onPress());
    };

    React.useEffect(() => {
        // Animate content on mount
        Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
        }).start();
    }, []);

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A6FE5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>TrackIT</Text>
                    <TouchableOpacity 
                        style={styles.notificationIcon}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <Ionicons name="notifications-outline" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
                        {/* Dashboard Banner */}
                        <View style={styles.bannerCard}>
                            <LinearGradient
                                colors={['#4A6FE5', '#6B8FF8']}
                                style={styles.gradientBanner}
                            >
                                <Text style={styles.bannerText}>Welcome Back!</Text>
                                <Text style={styles.bannerSubText}>Track your inventory efficiently</Text>
                            </LinearGradient>
                        </View>

                        {/* Feature Boxes */}
                        <View style={styles.smallBoxes}>
                            <Animated.View style={[{ transform: [{ scale: inventoryButtonScale }] }, styles.buttonContainer]}>
                                <TouchableOpacity
                                    style={styles.smallBox}
                                    onPressIn={() => handlePressIn(inventoryButtonScale)}
                                    onPressOut={() => handlePressOut(inventoryButtonScale, () => navigation.navigate('InventoryItems'))}
                                    activeOpacity={1}
                                >
                                    <View style={styles.buttonInner}>
                                        <View style={styles.iconBackground}>
                                            <Ionicons name="archive-outline" size={isSmallScreen ? 24 : 28} color="#4A6FE5" />
                                        </View>
                                        <Text style={styles.buttonText}>Inventory</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={[{ transform: [{ scale: shoppingButtonScale }] }, styles.buttonContainer]}>
                                <TouchableOpacity
                                    style={styles.smallBox}
                                    onPressIn={() => handlePressIn(shoppingButtonScale)}
                                    onPressOut={() => handlePressOut(shoppingButtonScale, () => navigation.navigate('ShoppingList'))}
                                    activeOpacity={1}
                                >
                                    <View style={styles.buttonInner}>
                                        <View style={styles.iconBackground}>
                                            <Ionicons name="cart-outline" size={isSmallScreen ? 24 : 28} color="#28A745" />
                                        </View>
                                        <Text style={styles.buttonText}>Shopp List</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={[{ transform: [{ scale: expiryButtonScale }] }, styles.buttonContainer]}>
                                <TouchableOpacity
                                    style={styles.smallBox}
                                    onPressIn={() => handlePressIn(expiryButtonScale)}
                                    onPressOut={() => handlePressOut(expiryButtonScale, handleExpirySoonItemsPress)}
                                    activeOpacity={1}
                                >
                                    <View style={styles.buttonInner}>
                                        <View style={styles.iconBackground}>
                                            <Ionicons name="alert-circle-outline" size={isSmallScreen ? 24 : 28} color="#FF9500" />
                                        </View>
                                        <Text style={styles.buttonText}>Expiry Items</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        {/* Budget Shopping List Section */}
                        <View style={styles.budgetSection}>
                            <Text style={styles.sectionTitle}>Budget Shopping</Text>
                            <Text style={styles.noteText}>Generate a smart shopping list based on your budget</Text>
                            
                            <Animated.View style={[styles.generateButtonContainer, { transform: [{ scale: generateButtonScale }] }]}>
                                <TouchableOpacity 
                                    onPressIn={() => handlePressIn(generateButtonScale)}
                                    onPressOut={() => handlePressOut(generateButtonScale, () => navigation.navigate('EnterBudget'))}
                                    activeOpacity={1}
                                >
                                    <LinearGradient
                                        colors={['#4A6FE5', '#6B8FF8']}
                                        style={styles.generateButton}
                                    >
                                        <Text style={styles.generateButtonText}>Generate</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Bottom Navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Main')}
                    >
                        <Ionicons name="home" size={isSmallScreen ? 22 : 24} color="#4A6FE5" />
                        <Text style={styles.navText}>Home</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Camera')}>
                        <LinearGradient
                            colors={['#4A6FE5', '#6B8FF8']}
                            style={styles.scanGradient}
                        >
                            <Ionicons name="scan-outline" size={isSmallScreen ? 24 : 28} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-outline" size={isSmallScreen ? 22 : 24} color="#777" />
                        <Text style={styles.navText}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FD',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FD',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FD',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    logo: {
        fontSize: isSmallScreen ? 22 : 24,
        fontWeight: 'bold',
        color: '#4A6FE5',
    },
    notificationIcon: {
        padding: 8,
        borderRadius: 20,
    },
    content: {
        padding: isSmallScreen ? 15 : 20,
    },
    bannerCard: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    gradientBanner: {
        paddingVertical: isSmallScreen ? 25 : 30,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    bannerText: {
        fontSize: isSmallScreen ? 22 : 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    bannerSubText: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    smallBoxes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    buttonContainer: {
        width: '30%',
        marginBottom: isSmallScreen ? 12 : 15,
    },
    smallBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: isSmallScreen ? 12 : 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        height: isSmallScreen ? 110 : 120,
    },
    buttonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconBackground: {
        width: isSmallScreen ? 50 : 60,
        height: isSmallScreen ? 50 : 60,
        borderRadius: isSmallScreen ? 25 : 30,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        fontSize: isSmallScreen ? 12 : 14,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    budgetSection: {
        backgroundColor: '#FFFFFF',
        padding: isSmallScreen ? 18 : 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: isSmallScreen ? 16 : 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 6,
    },
    noteText: {
        fontSize: isSmallScreen ? 12 : 14,
        color: '#666666',
        marginBottom: isSmallScreen ? 15 : 20,
    },
    generateButtonContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    generateButton: {
        paddingVertical: isSmallScreen ? 12 : 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: isSmallScreen ? 14 : 16,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: isSmallScreen ? 10 : 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F5',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    navItem: {
        alignItems: 'center',
        paddingVertical: 5,
        minWidth: width / 5,
    },
    navText: {
        fontSize: isSmallScreen ? 10 : 12,
        marginTop: 4,
        color: '#777',
    },
    scanButton: {
        marginBottom: isSmallScreen ? 15 : 20,
    },
    scanGradient: {
        width: isSmallScreen ? 50 : 60,
        height: isSmallScreen ? 50 : 60,
        borderRadius: isSmallScreen ? 25 : 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    }
});

export default HomeScreen;