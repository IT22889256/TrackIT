import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Swipeable } from 'react-native-gesture-handler';
import {
    getFirestore, collection, getDocs, deleteDoc, doc, query, where
} from 'firebase/firestore';
import { app, auth } from '../firebaseConfig';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reminder'>;

type Props = {
    navigation: ReminderScreenNavigationProp;
};

type ExpireItem = {
    id: string;
    productName: string;
    expiryDate: string;
    uid: string;
};

const ReminderScreen: React.FC<Props> = ({ navigation }) => {
    const [items, setItems] = useState<ExpireItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [filterOption, setFilterOption] = useState<'ALL' | 'WITHIN_7' | 'MORE_THAN_7'>('ALL');
    const db = getFirestore(app);

    useEffect(() => {
        const fetchExpireItems = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const expireItemsRef = collection(db, 'expireItems');
                    const q = query(expireItemsRef, where('uid', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const fetchedItems: ExpireItem[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        fetchedItems.push({
                            id: doc.id,
                            productName: data.productName,
                            expiryDate: data.expiryDate,
                            uid: data.uid,
                        });
                    });
                    setItems(fetchedItems);
                } catch (error) {
                    console.error('Error fetching expire items:', error);
                }
            }
        };

        fetchExpireItems();
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
            await deleteDoc(doc(db, 'expireItems', id));
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Error deleting expire item:', error);
        }
    };

    const handleAddToShoppingList = (item: ExpireItem) => {
        Alert.alert('Add to Shopping List', `Do you want to add "${item.productName}" to your shopping list?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Add', onPress: () =>
                    navigation.navigate('ShoppingList', {
                        newItems: [{
                            name: item.productName,
                            quantity: 1,
                            description: `Expires on ${item.expiryDate}`,
                            completed: false
                        }]
                    })
            },
        ]);
    };

    const generateReportPDF = async () => {
      const within7Days = items.filter(item => getDaysUntilExpiration(item.expiryDate) <= 7);
      const moreThan7Days = items.filter(item => getDaysUntilExpiration(item.expiryDate) > 7);
  
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
          type: 'pie',
          data: {
              labels: ['Expiring in ≤ 7 Days', 'Expiring in > 7 Days'],
              datasets: [{
                  data: [within7Days.length, moreThan7Days.length],
                  backgroundColor: ['#FF6384', '#36A2EB'],
              }],
          },
          options: {
              plugins: {
                  title: {
                      display: true,
                      text: 'Item Expiry Distribution',
                      font: {
                          size: 18
                      }
                  },
                  legend: {
                      position: 'bottom'
                  }
              }
          },
      }))}`;
  
      const formatItemList = (title: string, itemList: ExpireItem[]) => {
          if (itemList.length === 0) return `<p class="empty">No items in this category.</p>`;
          return `
              <h3>${title}</h3>
              <table>
                  <thead>
                      <tr>
                          <th>Product Name</th>
                          <th>Expiry Date</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${itemList.map(item => `
                          <tr>
                              <td>${item.productName}</td>
                              <td>${item.expiryDate}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          `;
      };
  
      const htmlContent = `
          <html>
          <head>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      padding: 30px;
                      color: #333;
                  }
                  h2 {
                      text-align: center;
                      color: #2c3e50;
                  }
                  h3 {
                      color: #34495e;
                      margin-top: 40px;
                  }
                  table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-top: 10px;
                  }
                  th, td {
                      border: 1px solid #ccc;
                      padding: 8px 12px;
                      text-align: left;
                  }
                  th {
                      background-color: #f4f4f4;
                  }
                  .empty {
                      font-style: italic;
                      color: #888;
                  }
                  hr {
                      margin: 40px 0;
                  }
                  img {
                      display: block;
                      margin: 20px auto;
                  }
              </style>
          </head>
          <body>
              <h2>Inventory Expiry Report</h2>
              <img src="${chartUrl}" alt="Expiry Breakdown Chart" width="400"/>
              ${formatItemList('Items Expiring Within 7 Days', within7Days)}
              <hr/>
              ${formatItemList('Items Expiring in More Than 7 Days', moreThan7Days)}
          </body>
          </html>
      `;
  
      try {
          const { uri } = await Print.printToFileAsync({ html: htmlContent });
          await Sharing.shareAsync(uri, {
              UTI: '.pdf',
              mimeType: 'application/pdf'
          });
      } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'An error occurred while generating the PDF report.');
      }
  };
  
  

    const filteredItems = items.filter(item => {
        const days = getDaysUntilExpiration(item.expiryDate);
        if (filterOption === 'WITHIN_7') return days <= 7;
        if (filterOption === 'MORE_THAN_7') return days > 7;
        return true;
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Main')}>
        <Ionicons name="home-outline" size={24} color="#333" />
      </TouchableOpacity>

            

            <Text style={styles.title}>Expiry Soon Items</Text>
            <Text style={styles.note}>Swipe Right to delete, swipe left to add to shopping cart.</Text>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'ALL' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('ALL')}
                >
                    <Text style={styles.filterText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'WITHIN_7' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('WITHIN_7')}
                >
                    <Text style={styles.filterText}>Within 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterOption === 'MORE_THAN_7' && styles.filterButtonActive]}
                    onPress={() => setFilterOption('MORE_THAN_7')}
                >
                    <Text style={styles.filterText}>More Than 7 Days</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const daysUntilExpiration = getDaysUntilExpiration(item.expiryDate);
                    let backgroundColor = 'lightgreen';
                    if (daysUntilExpiration < 7) {
                        backgroundColor = '#d91a20';
                    } else if (daysUntilExpiration === 7) {
                        backgroundColor = 'lightyellow';
                    } else {
                        backgroundColor = '#48cf3c';
                    }

                    const rightAction = () => (
                        <TouchableOpacity style={styles.rightAction} onPress={() => handleAddToShoppingList(item)}>
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
                        >
                            <View style={[styles.itemContainer, { backgroundColor }]}>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemExpireDate}>Expires: {item.expiryDate}</Text>
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

            <TouchableOpacity style={styles.reportButton} onPress={generateReportPDF}>
                <Text style={styles.buttonText}>Generate Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addItemButton} onPress={() => navigation.navigate('LabelScan')}>
                <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        marginBottom: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ddd',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    filterButtonActive: {
        backgroundColor: '#6200ea',
    },
    filterText: {
        color: 'white',
        fontWeight: '600',
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
        backgroundColor: '#ff4d4d',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
        width: 100,
        borderRadius: 10,
    },
    rightAction: {
        backgroundColor: '#4CAF50',
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
    reportButton: {
        backgroundColor: '#03A9F4',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    addItemButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
    },
    navItem: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 8,
    },
});

export default ReminderScreen;
