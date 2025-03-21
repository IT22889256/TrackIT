import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Swipeable } from 'react-native-gesture-handler'; // Import swipeable

type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminder'>;

type Props = {
  navigation: ReminderScreenNavigationProp;
};

type ScannedItem = {
  id: string;
  name: string;
  date: string;
};

const dummyData: ScannedItem[] = [
  { id: '1', name: 'Yoghurt', date: '2025-03-04' },
  { id: '2', name: 'Fresh Milk', date: '2025-12-02' },
  { id: '3', name: 'Cheese', date: '2025-03-10' },
  { id: '4', name: 'Bread', date: '2025-01-01' },
  { id: '5', name: 'Eggs', date: '2025-12-05' },
  { id: '6', name: 'Butter', date: '2025-03-' },
  { id: '7', name: 'Yoghurt', date: '2025-03-04' },
  { id: '8', name: 'Fresh Milk', date: '2025-12-02' },
  { id: '9', name: 'Cheese', date: '2025-12-10' },
  { id: '10', name: 'Bread', date: '2025-03-04' },
  { id: '11', name: 'Eggs', date: '2025-12-05' },
  { id: '12', name: 'Butter', date: '2025-12-09' },
];

const ReminderScreen: React.FC<Props> = ({ navigation }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheckbox = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper function to calculate the days difference between the current date and expiry date
  const getDaysUntilExpiration = (expireDate: string): number => {
    const currentDate = new Date();
    const expirationDate = new Date(expireDate);
    const differenceInTime = expirationDate.getTime() - currentDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24)); // Convert to days
  };

  const handleDelete = (id: string) => {
    // Show alert to confirm deletion
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteItem(id) },
    ]);
  };

  const deleteItem = (id: string) => {
    // Remove item from data
    const updatedData = dummyData.filter(item => item.id !== id);
    console.log('Updated data after deletion', updatedData);
    // You can update your state here if you are using state for data
  };

  const handleAddToShoppingList = (id: string) => {
    Alert.alert('Add to Shopping List', 'Do you want to add this item to your shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: () => addToShoppingList(id) },
    ]);
  };

  const addToShoppingList = (id: string) => {
    console.log('Item added to shopping list with ID:', id);
    // You can add your logic here to add the item to a shopping list
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Expiry Soon Items</Text>
      <Text style={styles.note}>
        Swipe Right to delete, swipe left to add to shopping cart.
      </Text>

      <FlatList
        data={dummyData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const daysUntilExpiration = getDaysUntilExpiration(item.date);
          let backgroundColor = 'lightgreen'; // Default green for items that are not close to expiry

          // Change background color based on the expiration duration
          if (daysUntilExpiration < 7) {
            backgroundColor = '#d91a20'; // Red for items expiring soon (less than 7 days)
          } else if (daysUntilExpiration === 7) {
            backgroundColor = 'lightyellow'; // Yellow for items expiring in exactly 7 days
          } else {
            backgroundColor = '#48cf3c'; // Green for items expiring after 7 days
          }

          const rightAction = () => (
            <TouchableOpacity style={styles.rightAction} onPress={() => handleAddToShoppingList(item.id)}>
              <Text style={styles.actionText}>Add to Cart</Text>
            </TouchableOpacity>
          );

          const leftAction = () => (
            <TouchableOpacity style={styles.leftAction} onPress={() => handleDelete(item.id)}>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          );

          return (
            <Swipeable
              renderLeftActions={leftAction}
              renderRightActions={rightAction}
              onSwipeableLeftOpen={() => handleDelete(item.id)}  // Automatically trigger delete on swipe left
              onSwipeableRightOpen={() => handleAddToShoppingList(item.id)}  // Automatically trigger add to cart on swipe right
            >
              <View style={[styles.itemContainer, { backgroundColor }]}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemExpireDate}>Expires: {item.date}</Text>
                </View>

                <TouchableOpacity onPress={() => toggleCheckbox(item.id)} style={styles.checkboxContainer}>
                  <FontAwesome
                    name={checkedItems[item.id] ? 'check-square' : 'square-o'}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              </View>
            </Swipeable>
          );
        }}
      />

      <TouchableOpacity style={styles.addItemButton}>
        <Text style={styles.buttonText}
         onPress={() => navigation.navigate('LabelScan')}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Soft background color for modern feel
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  note: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemExpireDate: {
    fontSize: 14,
    color: 'black',
    marginTop: 5,
  },
  checkboxContainer: {
    paddingLeft: 10,
  },
  leftAction: {
    backgroundColor: '#ff4d4d', // Red background for delete
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    width: 100,
    borderRadius: 10,
  },
  rightAction: {
    backgroundColor: '#4CAF50', // Green background for add to cart
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    width: 100,
    borderRadius: 10,
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  addItemButton: {
    backgroundColor: '#6200ea',
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default ReminderScreen;
