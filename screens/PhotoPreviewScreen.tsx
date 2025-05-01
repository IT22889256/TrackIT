import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState } from 'react';
import { storage } from '../firebaseConfig'; 
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
};

   //example outpot of the veryfi
    // [
    //     {
    //       "description": "KOTMALE FULL CREAM UHT MILK TETRA 180M\n1.0",
    //       "price": 140.0,
    //       "quantity": 1.0
    //     },
    //     {
    //       "description": "9825: AMBEWELA SET YOGHURT PLAIN 80ML\n1.0",
    //       "price": 80.0,
    //       "quantity": 1.0
    //     },
    //     {
    //       "description": "KOTMALE JELLY YOGHURT 80G",
    //       "price": 80.0,
    //       "quantity": 7.0
    //     }
    //   ]

const PhotoPreviewSection: React.FC<Props> = ({ photo, handleRetakePhoto }) => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        setLoading(true);
        try {
            if (!photo.uri) {
                throw new Error('Photo does not contain URI.');
            }

            // Compress the image
            const compressedPhoto = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 1024 } }], // Adjust width as needed
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Adjust quality and format
            );

            const response = await fetch(compressedPhoto.uri);
            const blob = await response.blob();

            const storageRef = ref(storage, `images/${Date.now()}.jpg`);

            await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);

            console.log('Download URL:', downloadURL);

            //get veryfi response
            const apiResponse = await fetch('http:///192.168.1.145:5000/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: downloadURL }),
            });

            if (!apiResponse.ok) {
                throw new Error('API upload failed');
            }

            const apiData = await apiResponse.json();

            setLoading(false);
            navigation.navigate('ScannedItems', { scannedItems: apiData.line_items });

        } catch (error) {
            console.error('Upload error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
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
