import { RootStackParamList } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type FooterNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
    navigation: FooterNavigationProp;
};

const Footer= ({ navigation }: { navigation: any }) => {
    return (
        <View style={styles.footerContainer}>
            <View  style={styles.bottomNav}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
    },
    navItem: {
        padding: 8,
    },
    scanIcon: {
        borderWidth: 2,
        borderColor: '#007BFF',
        borderRadius: 10,
        padding: 8,
    },
});

export default Footer;
