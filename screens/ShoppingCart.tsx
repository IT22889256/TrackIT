import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

const ShoppingList = () => {
  const [items, setItems] = useState([
    { id: '1', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '2', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '3', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '4', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '5', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '6', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '7', name: 'jhfhfhjhfjjhjhdhj' },
    { id: '8', name: 'jhfhfhjhfjjhjhdhj' },
  ]);

  const handleAddItem = () => {
    // Logic to add a new item
    const newItem = {
      id: String(Date.now()), // Generate a unique ID
      name: 'New Item', // You can prompt for the item name
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>Item: {item.name}</Text>
      <TouchableOpacity style={styles.editButton}>
        <Ionicons name="pencil" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveItem(item.id)}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping List</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <Ionicons name="add" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6750A4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#523E90',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#523E90',
    padding: 8,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: 'black',
    borderRadius: 36,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});

export default ShoppingList;