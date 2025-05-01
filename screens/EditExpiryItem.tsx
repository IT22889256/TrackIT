import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, Animated, Modal, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';

type EditExpiryItemNavigationProp = StackNavigationProp<RootStackParamList, 'EditExpiryItem'>;
type EditExpiryItemRouteProp = RouteProp<RootStackParamList, 'EditExpiryItem'>;

type Props = {
    navigation: EditExpiryItemNavigationProp;
    route: EditExpiryItemRouteProp;
};

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    confirmText: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const { width } = Dimensions.get('window');

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    icon = 'warning',
    iconColor = '#FF9800',
    confirmText,
    cancelText,
    confirmColor = '#6200ea',
    onConfirm,
    onCancel
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel || onConfirm}
        >
            <View style={customAlertStyles.overlay}>
                <Animated.View
                    style={[
                        customAlertStyles.container,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <View style={customAlertStyles.iconContainer}>
                        <MaterialIcons name={icon as any} size={36} color={iconColor} />
                    </View>
                    <Text style={customAlertStyles.title}>{title}</Text>
                    <Text style={customAlertStyles.message}>{message}</Text>
                    <View style={customAlertStyles.buttonContainer}>
                        {cancelText && onCancel && (
                            <TouchableOpacity
                                style={[customAlertStyles.button, customAlertStyles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={customAlertStyles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                customAlertStyles.button,
                                customAlertStyles.confirmButton,
                                cancelText ? { flex: 1 } : { width: '100%' },
                                { backgroundColor: confirmColor }
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={customAlertStyles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const customAlertStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    confirmButton: {
        backgroundColor: '#6200ea',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

const EditExpiryItem: React.FC<Props> = ({ navigation, route }) => {
    const { item } = route.params;
    const [productName, setProductName] = useState(item.productName || '');
    const [expiryDate, setExpiryDate] = useState(item.expiryDate || '');
    const [nameError, setNameError] = useState('');
    const [dateError, setDateError] = useState('');
    const [successAlertVisible, setSuccessAlertVisible] = useState(false);
    const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const db = getFirestore(app);

    const validateForm = (): boolean => {
        let isValid = true;
        
        if (!productName.trim()) {
            setNameError('Product name cannot be empty');
            isValid = false;
        } else {
            setNameError('');
        }
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiryDate)) {
            setDateError('Please enter a valid date in YYYY-MM-DD format');
            isValid = false;
        } else {
            // Check if the date is valid
            const dateObj = new Date(expiryDate);
            if (isNaN(dateObj.getTime())) {
                setDateError('Please enter a valid date');
                isValid = false;
            } else {
                // Check if date is in the future
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dateObj < today) {
                    setDateError('Expiry date must be in the future');
                    isValid = false;
                } else {
                    setDateError('');
                }
            }
        }
        
        return isValid;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        try {
            setIsLoading(true);
            
            // Make sure the Firestore document exists
            if (!item.id) {
                throw new Error('Item ID is missing');
            }
            
            const itemRef = doc(db, 'expireItems', item.id);
            
            // Include all fields that need to be updated
            const updateData = {
                productName: productName.trim(),
                expiryDate: expiryDate,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(itemRef, updateData);
            
            // Wait briefly to ensure Firestore has time to complete the update
            setTimeout(() => {
                setIsLoading(false);
                setSuccessMessage("Item updated successfully!");
                setSuccessAlertVisible(true);
            }, 500);
        } catch (error) {
            console.error('Error updating item:', error);
            setIsLoading(false);
            setSuccessMessage("Failed to update item. Please try again.");
            setSuccessAlertVisible(true);
        }
    };

    const handleCancel = () => {
        // Check if there are changes
        if (productName !== item.productName || expiryDate !== item.expiryDate) {
            setConfirmCancelVisible(true);
        } else {
            navigation.goBack();
        }
    };

    const confirmCancel = () => {
        setConfirmCancelVisible(false);
        navigation.goBack();
    };

    const closeSuccessAlert = () => {
        setSuccessAlertVisible(false);
        
        // Navigate to the ReminderScreen with updated item data
        navigation.navigate('Reminder', { 
            productName: productName.trim(),
            expiryDate: expiryDate,
            updatedItem: {
                ...item,
                productName: productName.trim(),
                expiryDate: expiryDate
            }
        });
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <CustomAlert
                    visible={successAlertVisible}
                    title="Success"
                    message={successMessage}
                    icon="check-circle"
                    iconColor="#4CAF50"
                    confirmText="OK"
                    confirmColor="#4CAF50"
                    onConfirm={closeSuccessAlert}
                />

                <CustomAlert
                    visible={confirmCancelVisible}
                    title="Discard Changes"
                    message="You have unsaved changes. Are you sure you want to discard them?"
                    icon="warning"
                    iconColor="#FF9800"
                    confirmText="Discard"
                    cancelText="Keep Editing"
                    confirmColor="#d91a20"
                    onConfirm={confirmCancel}
                    onCancel={() => setConfirmCancelVisible(false)}
                />

                <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                
                <Text style={styles.title}>Edit Item</Text>
                
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Product Name</Text>
                    <TextInput
                        style={[styles.input, nameError ? styles.inputError : null]}
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="Enter product name"
                        placeholderTextColor="#aaa"
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                    
                    <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                    <View style={styles.dateInputContainer}>
                        <TextInput
                            style={[styles.input, styles.dateInput, dateError ? styles.inputError : null]}
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#aaa"
                            keyboardType="number-pad"
                        />
                        <Ionicons name="calendar-outline" size={24} color="#6200ea" style={styles.calendarIcon} />
                    </View>
                    {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
                    <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2025-05-01)</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.saveButton, isLoading && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Text style={styles.buttonText}>Saving...</Text>
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="white" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 30,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#333',
    },
    dateInputContainer: {
        position: 'relative',
    },
    dateInput: {
        paddingRight: 40,
    },
    calendarIcon: {
        position: 'absolute',
        right: 12,
        top: 12,
    },
    inputError: {
        borderColor: '#d91a20',
    },
    errorText: {
        color: '#d91a20',
        fontSize: 14,
        marginTop: -10,
        marginBottom: 16,
    },
    helperText: {
        color: '#666',
        fontSize: 14,
        marginTop: -10,
        marginBottom: 16,
    },
    saveButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#9f86c9',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
    },
    buttonIcon: {
        marginRight: 8,
    },
});

export default EditExpiryItem;