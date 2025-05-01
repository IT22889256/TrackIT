// LabelPreviewSection.tsx
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState } from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text, Alert } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LabelPreview'>;

type Props = {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
};

const LabelPreviewSection: React.FC<Props> = ({ photo, handleRetakePhoto }) => {
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

            const storageRef = ref(storage, `expiredate/${Date.now()}.jpg`);

            await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);

            console.log('Download URL:', downloadURL);

            //get veryfi response
            const apiResponse = await fetch('http://192.168.1.145:5000/expirydate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: downloadURL }),
            });

           

            const apiData = await apiResponse.json();
            console.log(44444444444444);
            
            console.log(apiData);
            

            setLoading(false);
            // Pass the entire apiData to LabelManualEdit
            navigation.navigate('LabelManualEdit', { apiResponseData: apiData });

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

            {/* Upload Button */}
            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    goBackButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
        borderRadius: 20,
    },
    box: {
        width: '90%',
        height: '60%',
        backgroundColor: '#D3D3D3',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    previewContainer: {
        width: '80%',
        height: '80%',
        borderRadius: 10,
    },
    uploadButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LabelPreviewSection;