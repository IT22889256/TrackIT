// ItemDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface RouteParams {
  item: Item;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
  addImage: boolean;
  imageUrl?: string; // Optional image URL
}

const ItemDetailsScreen = () => {
  const route = useRoute<({ params: RouteParams })>();
  const [item, setItem] = useState<Item>(route.params.item); // Initialize state with route params

  const navigation = useNavigation();

  useEffect(() => {
    if (route.params.item) {
      setItem(route.params.item); // Update state when route params change
    }
  }, [route.params.item]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
      </View>

      <View style={styles.card}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{item.name}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{item.description || 'No description provided.'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Add Image:</Text>
            <Text style={styles.detailValue}>{item.addImage ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsContainer: {
    padding: 8,
  },
  itemName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 16,
  },
});

export default ItemDetailsScreen;