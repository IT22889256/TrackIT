import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

const AddItemsScreen = () => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [description, setDescription] = useState('');

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add  Items</Text>
        <TouchableOpacity style={styles.checkButton}>
          <Text style={styles.checkButtonText}>✓</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Item Name"
          value={itemName}
          onChangeText={setItemName}
        />
      </View>

      <View style={styles.quantityContainer}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.addImageButton}>
          <Image source={require('./assets/camera.png')} style={styles.cameraIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Description"
          value={description}
          onChangeText={setDescription}
          multiline={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0', // Light gray background
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkButton: {
    padding: 5,
  },
  checkButtonText: {
    fontSize: 20,
    color: 'green',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
  },
  quantityValue: {
    fontSize: 18,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 50,
  },
  cameraIcon: {
    width: 50,
    height: 50,
  },
});

export default AddItemsScreen;
