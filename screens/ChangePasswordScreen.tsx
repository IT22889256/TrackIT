// src/screens/ChangePasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; // Import auth
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'; // Import for re-authentication

type ChangePasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChangePassword'
>;

type Props = {
  navigation: ChangePasswordScreenNavigationProp;
};

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmNewPassword, setSecureConfirmNewPassword] = useState(true);

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Re-authentication is required before changing the password.
        // This is a CRITICAL security step.
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        await user.updatePassword(newPassword);
        Alert.alert('Success', 'Password changed successfully!');
        navigation.goBack(); // Go back
      } else {
        Alert.alert('Error', 'No user is currently signed in.');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', `Failed to change password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 40 }}>
          {/* Placeholder for right button */}
        </View>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={secureCurrentPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureCurrentPassword(!secureCurrentPassword)}
          >
            <Ionicons
              name={secureCurrentPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={secureNewPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureNewPassword(!secureNewPassword)}
          >
            <Ionicons
              name={secureNewPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Confirm your new password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry={secureConfirmNewPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureConfirmNewPassword(!secureConfirmNewPassword)}
          >
            <Ionicons
              name={secureConfirmNewPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password Button */}
      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.changePasswordButtonText}>Change Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  changePasswordButton: {
    backgroundColor: '#6750A4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  changePasswordButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  eyeIcon: {
    padding: 10,
  },
});

export default ChangePasswordScreen;