import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React from 'react';
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text } from 'react-native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
};

const PhotoPreviewSection: React.FC<Props> = ({ photo, handleRetakePhoto }) => {
    const navigation = useNavigation<NavigationProp>(); // Correctly accessing navigation

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.box}>
                <Image style={styles.previewContainer} source={{ uri: photo.uri }} />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
                    <Fontisto name="trash" size={36} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('Main')}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        borderRadius: 15,
        padding: 1,
        width: '95%',
        backgroundColor: 'darkgray',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContainer: {
        width: '95%',
        height: '85%',
        borderRadius: 15,
    },
    buttonContainer: {
        marginTop: '4%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: 'gray',
        borderRadius: 25,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        backgroundColor: 'gray',
        borderRadius: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default PhotoPreviewSection;
