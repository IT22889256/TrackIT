import React, { useState, useEffect, useRef } from 'react';
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
import { auth } from '../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useFonts } from 'expo-font';
import { getAuth, updatePassword } from 'firebase/auth'; // Import updatePassword

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
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    // 'InterBold': require('../assets/fonts/Boldonse-Regular.ttf'),
    // 'InterRegular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    // 'InterMedium': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmNewPassword, setSecureConfirmNewPassword] = useState(true);


  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isCurrentPasswordCorrect, setIsCurrentPasswordCorrect] = useState<boolean | null>(null); // Track current password validity


  // Refs for the input fields
  const currentPasswordInputRef = useRef<TextInput>(null);
  const newPasswordInputRef = useRef<TextInput>(null);
  const confirmNewPasswordInputRef = useRef<TextInput>(null);


  // Validation functions
  const validateCurrentPassword = async (password: string) => {
    if (!password) {
      setCurrentPasswordError('Current password is required');
      setIsCurrentPasswordCorrect(null);
      return false;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(user.email!, password); // Use non-null assertion here
        await reauthenticateWithCredential(user, credential);
        setCurrentPasswordError('');
        setIsCurrentPasswordCorrect(true);
        return true;
      }
    } catch (error: any) {
      setCurrentPasswordError('Incorrect current password');
      setIsCurrentPasswordCorrect(false);
      return false;
    }
    return false;
  };

  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError('New password is required');
      return false;
    } else if (password.length < 8) {
      setNewPasswordError('New password must be at least 8 characters');
      return false;
    } else if (!/[a-z]/.test(password)) {
      setNewPasswordError('Password must contain at least one lowercase letter');
      return false;
    } else if (!/[A-Z]/.test(password)) {
      setNewPasswordError('Password must contain at least one uppercase letter');
      return false;
    } else if (!/\d/.test(password)) {
      setNewPasswordError('Password must contain at least one number');
      return false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setNewPasswordError('Password must contain at least one special character');
      return false;
    }
    setNewPasswordError('');
    return true;
  };

  const validateConfirmNewPassword = (confirmPassword: string, newPasswordValue: string) => {
    if (!confirmPassword) {
      setConfirmNewPasswordError('Confirm new password is required');
      return false;
    } else if (confirmPassword !== newPasswordValue) {
      setConfirmNewPasswordError('Passwords do not match');
      return false;
    }
    setConfirmNewPasswordError('');
    return true;
  };

  // useEffect for real-time validation
  useEffect(() => {
    // Debounce function to delay password validation
    const debounce = (func: (...args: any[]) => void, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    const debouncedValidateCurrentPassword = debounce(validateCurrentPassword, 500); // 500ms debounce

    // Only validate if the password has changed and there is input
    if (currentPassword) {
      debouncedValidateCurrentPassword(currentPassword);
    } else {
      setCurrentPasswordError('');
      setIsCurrentPasswordCorrect(null);
    }
  }, [currentPassword]);

  useEffect(() => {
    validateNewPassword(newPassword);
    validateConfirmNewPassword(confirmNewPassword, newPassword);
  }, [newPassword, confirmNewPassword]);



  const handleChangePassword = async () => {
    const isCurrentPasswordValid = await validateCurrentPassword(currentPassword); // Await the validation
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmNewPasswordValid = validateConfirmNewPassword(confirmNewPassword, newPassword);


    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmNewPasswordValid) {
      return; // Stop if any validation fails
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Re-authentication is already done in validateCurrentPassword
        await updatePassword(user, newPassword); // Use the imported function
        Alert.alert('Success', 'Password changed successfully!');
        navigation.goBack();
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#333" />
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
        disabled={isCurrentPasswordCorrect !== true} // Disable if current password is not correct
      >
        <Text style={styles.changePasswordButtonText}>Change Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontFamily: 'InterBold',
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,

    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  changePasswordButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginHorizontal: 20,
  },
  changePasswordButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'InterMedium',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'InterRegular',
    marginTop: 5,
  },
  successText: {
    color: 'green',
    fontSize: 12,
    fontFamily: 'InterRegular',
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordToggle: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  passwordInput: {
    flex: 1,
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
