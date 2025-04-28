import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

type ChangePasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChangePassword'
>;

type Props = {
  navigation: ChangePasswordScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmNewPassword, setSecureConfirmNewPassword] = useState(true);
  const [isCurrentPasswordCorrect, setIsCurrentPasswordCorrect] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    // 'InterBold': require('../assets/fonts/Inter-Bold.ttf'),
    // 'InterRegular': require('../assets/fonts/Inter-Regular.ttf'),
    // 'InterMedium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (onPress: () => void) => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start(() => onPress());
  };

  const validateCurrentPassword = async (password: string) => {
    if (!password) {
      setCurrentPasswordError('Current password is required');
      setIsCurrentPasswordCorrect(null);
      return false;
    }

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
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

  useEffect(() => {
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

    const debouncedValidateCurrentPassword = debounce(validateCurrentPassword, 500);

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

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
  }, []);

  const handleChangePassword = async () => {
    const isCurrentPasswordValid = await validateCurrentPassword(currentPassword);
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmNewPasswordValid = validateConfirmNewPassword(confirmNewPassword, newPassword);

    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmNewPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FE5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.container, { opacity: contentOpacity }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.headerButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your current password"
                placeholderTextColor="#BDBDBD"
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
                  size={isSmallScreen ? 18 : 20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
            {currentPasswordError ? (
              <Text style={styles.errorText}>{currentPasswordError}</Text>
            ) : isCurrentPasswordCorrect === true ? (
              <Text style={styles.successText}>Current password is correct</Text>
            ) : null}

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your new password"
                placeholderTextColor="#BDBDBD"
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
                  size={isSmallScreen ? 18 : 20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
            {newPasswordError ? (
              <Text style={styles.errorText}>{newPasswordError}</Text>
            ) : null}

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your new password"
                placeholderTextColor="#BDBDBD"
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
                  size={isSmallScreen ? 18 : 20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
            {confirmNewPasswordError ? (
              <Text style={styles.errorText}>{confirmNewPasswordError}</Text>
            ) : null}
          </View>

          {/* Change Password Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPressIn={handlePressIn}
              onPressOut={() => handlePressOut(handleChangePassword)}
              activeOpacity={1}
              disabled={isCurrentPasswordCorrect !== true || loading}
            >
              <LinearGradient
                colors={['#4A6FE5', '#6B8FF8']}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Change Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: 'bold',
    color: '#333333',
    maxWidth: width * 0.6,
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  inputContainer: {
    paddingHorizontal: width < 375 ? 15 : 20,
    marginTop: 10,
  },
  label: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 15,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    padding: width < 375 ? 12 : 14,
    color: '#333333',
    fontSize: width < 375 ? 14 : 16,
  },
  eyeIcon: {
    padding: 8,
  },
  changePasswordButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 25,
    marginHorizontal: width < 375 ? 15 : 20,
  },
  gradientButton: {
    paddingVertical: width < 375 ? 12 : 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  changePasswordButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width < 375 ? 14 : 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: width < 375 ? 12 : 13,
    marginTop: 5,
    marginLeft: 5,
  },
  successText: {
    color: '#4CAF50',
    fontSize: width < 375 ? 12 : 13,
    marginTop: 5,
    marginLeft: 5,
  },
});

export default ChangePasswordScreen;