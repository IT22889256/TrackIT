import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type EnterBudgetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EnterBudget'>;

type Props = {
  navigation: EnterBudgetScreenNavigationProp;
};

const EnterBudgetScreen: React.FC<Props> = ({ navigation }) => {
  const [budget, setBudget] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    setIsButtonDisabled(!budget.trim()); // Disable if budget is empty
  }, [budget]);

  const handleSubmit = () => {
    if (!isButtonDisabled) {
      navigation.navigate('BudgetList');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Enter Your Budget</Text>

      <View style={styles.card}>
        {/* Budget Input */}
        <Text style={styles.label}>Enter Your Budget (Rs)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2000"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isButtonDisabled && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isButtonDisabled}
        >
          <Text style={styles.submitText}>Generate Shopping List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: 'purple',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'gray', // Style for disabled button
  },
});

export default EnterBudgetScreen;