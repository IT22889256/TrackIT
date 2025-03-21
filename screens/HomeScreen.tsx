import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleExpirySoonItemsPress = () => {
    // Navigate to the 'Reminder' screen when the expiry soon items box is pressed
    navigation.navigate('Reminder');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TrackIT</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.largeBox}></View>
        <View style={styles.smallBoxes}>
          {/* Left Small Box (Packages) */}
          <View style={styles.smallBox}>
            <Text style={styles.emoji}>📦</Text>  {/* Emoji representing a package */}
            <Text style={styles.boxLabel}>Inventory</Text>
          </View>

          {/* Right Small Box (Expiry Soon Items) */}
          <TouchableOpacity style={styles.smallBox} onPress={handleExpirySoonItemsPress}>
            <Text style={styles.emoji}>⏰</Text>  {/* Emoji representing expiry items */}
            <Text style={styles.boxLabel}>Expiry Soon Items</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.smallBox}>
          <Text style={styles.emoji}>📦</Text>  {/* Emoji representing a package */}
          <Text style={styles.boxLabel}>Shopping List</Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Main')} // Navigate to HomeScreen
        >
          <Ionicons name="home-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.scanIcon}>
            <Ionicons name="scan-outline" size={36} color="black" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Reminder')} // Navigate to ProfileScreen
        >
          <Ionicons name="person-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
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
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  smallBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  smallBox: {
    flex: 1,
    height: 100,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
  },
  emoji: {
    fontSize: 30,
  },
  boxLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    padding: 8,
  },
  scanIcon: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 8,
    padding: 8,
  },
});

export default HomeScreen;
