import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, SafeAreaView } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import PhotoPreviewSection from './LabelPreviewScreen';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types';

type LabelScanNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function LabelScan() {
  const navigation = useNavigation<LabelScanNavigationProp>(); // ✅ Get navigation
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takedPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takedPhoto);
    }
  };

  const handleRetakePhoto = () => setPhoto(null);
  if (photo) return <PhotoPreviewSection photo={photo} handleRetakePhoto={handleRetakePhoto} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Go Back Button (Now inside a View to ensure visibility) */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

      {/* Capture Button Centered */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
          <AntDesign name="camera" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center', // Centers the button horizontally
  },
  captureButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 50,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10, // Ensures it appears above the camera
  },
  goBackButton: {
    padding: 10,
 
  },
});



