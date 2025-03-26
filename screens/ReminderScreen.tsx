import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Swipeable } from 'react-native-gesture-handler';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Import your Firebase app configuration
import { auth } from '../firebaseConfig';

type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminder'>;

type Props = {
  navigation: ReminderScreenNavigationProp;
};

type ScannedItem = {
  id: string;
  name: string;
  date: string;
  uid: string;
};

const ReminderScreen: React.FC<Props> = ({ navigation }) => {
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const db = getFirestore(app);

  useEffect(() => {
    const fetchItems = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const querySnapshot = await getDocs(collection(db, 'items'));
          const fetchedItems: ScannedItem[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.uid === user.uid) {
              fetchedItems.push({
                id: doc.id,
                name: data.productName,
                date: data.expiryDate,
                uid: data.uid,
              });
            }
          });
          setItems(fetchedItems);
        } catch (error) {
          console.error('Error fetching items:', error);
        }
      }
    };

    fetchItems();
  }, []);

  const toggleCheckbox = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getDaysUntilExpiration = (expireDate: string): number => {
    const currentDate = new Date();
    const expirationDate = new Date(expireDate);
    const differenceInTime = expirationDate.getTime() - currentDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteItem(id) },
    ]);
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleAddToShoppingList = (id: string) => {
    Alert.alert('Add to Shopping List', 'Do you want to add this item to your shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: () => addToShoppingList(id) },
    ]);
  };

  const addToShoppingList = (id: string) => {
    console.log('Item added to shopping list with ID:', id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Main')}>
        <Ionicons name="home-outline" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Expiry Soon Items</Text>
      <Text style={styles.note}>
        Swipe Right to delete, swipe left to add to shopping cart.
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const daysUntilExpiration = getDaysUntilExpiration(item.date);
          let backgroundColor = 'lightgreen';

          if (daysUntilExpiration < 7) {
            backgroundColor = '#d91a20';
          } else if (daysUntilExpiration === 7) {
            backgroundColor = 'lightyellow';
          } else {
            backgroundColor = '#48cf3c';
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
              onSwipeableLeftOpen={() => handleDelete(item.id)}
              onSwipeableRightOpen={() => handleAddToShoppingList(item.id)}
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

      <TouchableOpacity style={styles.addItemButton} onPress={() => navigation.navigate('LabelScan')}>
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F8E8', // Light greenish background 
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
  navItem: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
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
