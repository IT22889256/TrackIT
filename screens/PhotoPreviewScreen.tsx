import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState } from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
};

const PhotoPreviewSection: React.FC<Props> = ({ photo, handleRetakePhoto }) => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        setLoading(true); // Show loading indicator

        try {
            const response = await fetch('http://192.168.8.159:5000/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to upload');
            }

            const data = await response.json(); // Extract API response

            setLoading(false); // Hide loading screen
            navigation.navigate('ScannedItems', { scannedItems: data.line_items }); // Navigate with data
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Failed to upload receipt. Please try again.');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Go Back Button */}
            <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Image Preview Box */}
            <View style={styles.box}>
                <Image style={styles.previewContainer} source={{ uri: photo.uri }} />
            </View>

            {/* Upload Button or Loading Indicator */}
            {loading ? (
                <ActivityIndicator size="large" color="#6C63FF" />
            ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                    <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    goBackButton: { position: 'absolute', top: 20, left: 20, padding: 10, borderRadius: 20 },
    box: { width: '90%', height: '60%', backgroundColor: '#D3D3D3', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    previewContainer: { width: '80%', height: '80%', borderRadius: 10 },
    uploadButton: { backgroundColor: '#6C63FF', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10 },
    uploadButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default PhotoPreviewSection;
