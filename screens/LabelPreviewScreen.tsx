import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text } from 'react-native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LabelPreview'>;

type Props = {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
};

const LabelPreviewSection: React.FC<Props> = ({ photo, handleRetakePhoto }) => {
    const navigation = useNavigation<NavigationProp>();

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
            <TouchableOpacity style={styles.uploadButton} onPress={() => navigation.navigate('LabelManualEdit')}>
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
