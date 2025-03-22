import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font'; // Import the hook

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
    navigation: HomeScreenNavigationProp;
};
// Dummy components for now, will create separate files later
const InventoryScreen = ({ navigation }: { navigation: any }) => (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Inventory</Text>
            <View style={{ width: 40 }} /> {/* Placeholder for right button */}
        </View>
        <Text style={{fontFamily: 'InterRegular'}}>Inventory Screen</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{fontFamily: 'InterRegular'}}>Go Back</Text>
        </TouchableOpacity>
    </View>
);
const ShoppingListScreen = ({ navigation }: { navigation: any }) => (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Shopping List</Text>
            <View style={{ width: 40 }} /> {/* Placeholder for right button */}
        </View>
        <Text style={{fontFamily: 'InterRegular'}}>Shopping List Screen</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{fontFamily: 'InterRegular'}}>Go Back</Text>

        </TouchableOpacity>
    </View>
);

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [fontsLoaded] = useFonts({  // Load the font
         // Make sure the path is correct
    });
     const handleExpirySoonItemsPress = () => {
    // Navigate to the 'Reminder' screen when the expiry soon items box is pressed
    navigation.navigate('Reminder');
    };

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>TrackIT</Text>
                <TouchableOpacity style={styles.notificationIcon}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.largeBox}></View>
                <View style={styles.smallBoxes}>
                    <TouchableOpacity
                        style={[styles.smallBox, styles.button]}
                        onPress={() => navigation.navigate('Inventory')}
                    >
                        <Ionicons name="archive-outline" size={30} color="#007BFF" />
                        <Text style={styles.buttonText}>Inventory</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.smallBox, styles.button]}
                        onPress={() => navigation.navigate('AddItems')}
                    >
                        <Ionicons name="cart-outline" size={30} color="#28A745" />
                        <Text style={styles.buttonText}>Shopping List</Text>
                    </TouchableOpacity>
                  <TouchableOpacity
                        style={[styles.smallBox, styles.button]}
                        onPress={handleExpirySoonItemsPress}}
                    >
                        <Ionicons name="cart-outline" size={30} color="#28A745" />
                        <Text style={styles.buttonText}>Expiry Soon Items</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.smallBox}></View>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Ionicons name="home-outline" size={24} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('Camera')}>
                    <View style={styles.scanIcon} >
                        <Ionicons name="scan-outline" size={36} color="#555" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person-outline" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            {/* These would be in separate files, but kept here for simplicity */}
            {/* <InventoryScreen navigation={navigation} />  */}
            {/* <ShoppingListScreen navigation={navigation} /> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF', // Light background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'InterRegular',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF', // White header
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 20,
        fontFamily: 'InterBold', // Use the bold font
        fontWeight: 'bold',
        color: '#333',
    },
    headerButton: {
        padding: 8,
    },
    logo: {
        fontSize: 24,
        fontFamily: 'InterBold', // Use the bold font
        fontWeight: 'bold',
        color: '#2C3E50', // Darker logo color
    },
    notificationIcon: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    largeBox: {
        height: 150,
        backgroundColor: '#FFFFFF', // White large box
        borderRadius: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    smallBoxes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    smallBox: {
        flex: 1,
        height: 100,
        backgroundColor: '#FFFFFF', // White small boxes
        borderRadius: 10,
        marginHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    button: { // Added style for buttons
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: { // Added style for button text
        marginTop: 5,
        fontSize: 14,
        fontFamily: 'InterMedium', // Use medium font
        color: '#333',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFFFF', // White bottom nav
    },
    navItem: {
        padding: 8,
    },
    scanIcon: {
        borderWidth: 2,
        borderColor: '#007BFF', // Blue scan icon border
        borderRadius: 10,
        padding: 8,
    },
});

export default HomeScreen;

