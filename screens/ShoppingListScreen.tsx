import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert, 
  Modal,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ItemDetailsScreen from './ItemDetailsScreen';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  or 
} from 'firebase/firestore';

interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
  completed: boolean;
  ownerId: string;
  sharedWith?: string[];
  createdAt?: number;
}

const ShoppingListScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [addButtonScale] = useState(new Animated.Value(1));
  const navigation = useNavigation();
  const route = useRoute();
  const currentUserId = auth.currentUser?.uid;

  // Animation for add button
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkUserRole = useCallback(async () => {
    if (!currentUserId) {
      setIsOwner(false);
      return;
    }
    try {
      setLoading(true);
      const membersQuery = query(
        collection(db, 'members'),
        where('memberId', '==', currentUserId)
      );
      const memberSnapshot = await getDocs(membersQuery);
      setIsOwner(memberSnapshot.empty);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  useEffect(() => {
    if (!currentUserId) {
      console.warn('User not logged in, cannot fetch shopping list.');
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'shoppingList'),
      or(
        where('ownerId', '==', currentUserId),
        where('sharedWith', 'array-contains', currentUserId)
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedItems: Item[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Item, 'id'>),
        }));
        
        // Sort items: incomplete first, then by creation time (newest first)
        const sortedItems = loadedItems.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        
        setItems(sortedItems);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening for shopping list updates:', error);
        Alert.alert('Error', 'Failed to load shopping list.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    if (route.params?.newItems) {
      const updateItems = async () => {
        try {
          const newItems = route.params.newItems.map(newItem => ({
            ...newItem,
            ownerId: currentUserId,
            sharedWith: newItem.sharedWith || [],
            createdAt: newItem.createdAt || Date.now(),
          }));

          for (const newItem of newItems) {
            if (newItem.id) {
              await updateDoc(doc(db, 'shoppingList', newItem.id), newItem);
            } else {
              await addDoc(collection(db, 'shoppingList'), newItem);
            }
          }
        } catch (error) {
          console.error('Error updating items:', error);
          Alert.alert('Error', 'Failed to update shopping list.');
        }
      };
      updateItems();
    }
  }, [route.params?.newItems, currentUserId]);

  const handleAddItem = () => {
    animateButton();
    navigation.navigate('AddItems');
  };

  const handleRemoveItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    if (itemToDelete.ownerId !== currentUserId) {
      Alert.alert('Permission Denied', 'You can only delete items you added.');
      return;
    }

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'shoppingList', id));
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item.');
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateItem = async (updatedItem: Item) => {
    const originalItem = items.find(item => item.id === updatedItem.id);
    if (!originalItem) return;

    if (originalItem.ownerId !== currentUserId && !originalItem.sharedWith?.includes(currentUserId || '')) {
      Alert.alert('Permission Denied', 'You cannot update this item.');
      return;
    }

    try {
      await updateDoc(doc(db, 'shoppingList', updatedItem.id), updatedItem);
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item.');
    }
  };

  const handleToggleComplete = async (id: string) => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) return;

    if (itemToUpdate.ownerId !== currentUserId && !itemToUpdate.sharedWith?.includes(currentUserId || '')) {
      Alert.alert('Permission Denied', 'You cannot change the completion status of this item.');
      return;
    }

    try {
      const updatedItem = { 
        ...itemToUpdate, 
        completed: !itemToUpdate.completed,
        // Move completed items to bottom by updating timestamp
        createdAt: !itemToUpdate.completed ? 0 : Date.now()
      };
      await updateDoc(doc(db, 'shoppingList', id), updatedItem);
    } catch (error) {
      console.error('Error toggling complete:', error);
      Alert.alert('Error', 'Failed to toggle item completion.');
    }
  };

  const renderItem = ({ item, index }: { item: Item, index: number }) => {
    const canEdit = item.ownerId === currentUserId || item.sharedWith?.includes(currentUserId || '');
    const isOwned = item.ownerId === currentUserId;
    const swipeThreshold = 0.25;

    return (
      <Animated.View 
        style={[
          styles.itemCard, 
          item.completed && styles.completedCard,
          { transform: [{ scale: item.completed ? 0.98 : 1 }] }
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          activeOpacity={0.7}
          onPress={() => {
            setSelectedItem(item);
            setModalVisible(true);
          }}
        >
          <View style={styles.itemRow}>
            <TouchableOpacity
              onPress={() => handleToggleComplete(item.id)}
              disabled={!canEdit}
              style={styles.checkboxContainer}
            >
              <View style={[
                styles.checkbox,
                item.completed && styles.checkboxCompleted,
                !canEdit && styles.checkboxDisabled
              ]}>
                {item.completed && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.itemTextContainer}>
              <Text 
                style={[
                  styles.itemName, 
                  item.completed && styles.completedText
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              
              {item.description && (
                <Text 
                  style={[
                    styles.itemDescription, 
                    item.completed && styles.completedText
                  ]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              )}
              
              {!isOwned && (
                <Text style={styles.sharedItemLabel}>
                  <Ionicons name="people-outline" size={12} color="#666" /> Shared
                </Text>
              )}
            </View>
            
            {item.quantity > 1 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{item.quantity}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {canEdit && !item.completed && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditItems', {
                item,
                updateItem: handleUpdateItem,
                isOwner: isOwned
              })}
            >
              <Ionicons name="pencil-outline" size={18} color="#fff" />
            </TouchableOpacity>
            
            {isOwned && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  const renderListHeader = () => {
    // Display header with count of remaining items
    const remainingItems = items.filter(item => !item.completed).length;
    const completedItems = items.filter(item => item.completed).length;
    
    if (items.length === 0) return null;
    
    return (
      <View style={styles.listHeader}>
        <Text style={styles.listStats}>
          {remainingItems} remaining • {completedItems} completed
        </Text>
      </View>
    );
  };

  const handleGoBack = () => {
    navigation.navigate('Main');
  };

  const handleClearAll = async () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the list owner can clear all items.');
      return;
    }

    Alert.alert(
      'Clear Shopping List',
      'Are you sure you want to remove all items you own?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const q = query(collection(db, 'shoppingList'), where('ownerId', '==', currentUserId));
              const querySnapshot = await getDocs(q);
              const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);
              setLoading(false);
            } catch (error) {
              console.error('Error clearing items:', error);
              Alert.alert('Error', 'Failed to clear items.');
              setLoading(false);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearCompleted = async () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the list owner can clear completed items.');
      return;
    }

    Alert.alert(
      'Clear Completed Items',
      'Remove all completed items from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Completed', 
          onPress: async () => {
            try {
              setLoading(true);
              const q = query(
                collection(db, 'shoppingList'), 
                where('ownerId', '==', currentUserId),
                where('completed', '==', true)
              );
              const querySnapshot = await getDocs(q);
              const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);
              setLoading(false);
            } catch (error) {
              console.error('Error clearing completed items:', error);
              Alert.alert('Error', 'Failed to clear completed items.');
              setLoading(false);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleShareList = () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the list owner can share the list.');
      return;
    }
    navigation.navigate('ShareList', {
      currentSharedWith: items[0]?.sharedWith || [],
      ownerId: currentUserId
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isOwner ? 'My Shopping List' : 'Shared Shopping List'}
        </Text>
        
        <View style={styles.headerRight}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShareList}
              >
                <Ionicons name="share-outline" size={22} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleClearCompleted}
              >
                <Ionicons name="checkmark-done-outline" size={22} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleClearAll}
              >
                <Ionicons name="trash-outline" size={22} color="#333" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6750A4" />
        </View>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <View style={styles.emptyListContainer}>
          <Ionicons name="cart-outline" size={70} color="#ccc" />
          <Text style={styles.emptyListText}>
            {isOwner 
              ? 'Your shopping list is empty' 
              : 'The shared list is empty'}
          </Text>
          <Text style={styles.emptyListHint}>
            {isOwner 
              ? 'Tap the "+" button to add items' 
              : 'Items added by the owner will appear here'}
          </Text>
        </View>
      )}

      {/* List of items */}
      {!loading && items.length > 0 && (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={renderListHeader}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* Add button */}
      <Animated.View style={[
        styles.addButtonContainer,
        { transform: [{ scale: addButtonScale }] }
      ]}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Item details modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedItem && (
          <ItemDetailsScreen
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            canEdit={selectedItem.ownerId === currentUserId ||
                  selectedItem.sharedWith?.includes(currentUserId || '')}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  listStats: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    flex: 1,
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedCard: {
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6750A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  checkboxDisabled: {
    borderColor: '#ccc',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  completedText: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  sharedItemLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    padding: 8,
  },
  editButton: {
    backgroundColor: '#6750A4',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#e53935',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  addButton: {
    backgroundColor: '#6750A4',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ShoppingListScreen;