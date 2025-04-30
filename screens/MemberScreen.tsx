import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

type MembersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Members'>;

type Member = {
  id: string;
  memberName: string;
  memberEmail: string;
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const MembersScreen: React.FC<{ navigation: MembersScreenNavigationProp }> = ({ navigation }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    // 'InterBold': require('../assets/fonts/Inter-Bold.ttf'),
    // 'InterRegular': require('../assets/fonts/Inter-Regular.ttf'),
    // 'InterMedium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  // Animation refs
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const deleteButtonScales = useRef<{[key: string]: Animated.Value}>({}).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  
  // Create animation values for each potential member item
  const itemAnimations = useRef<{[key: string]: {opacity: Animated.Value, translateY: Animated.Value}}>({}).current;

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const membersCollectionRef = collection(db, 'members');
      const q = query(membersCollectionRef, where('ownerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const membersArray: Member[] = [];
      querySnapshot.forEach(doc => {
        const memberData = doc.data();
        membersArray.push({
          id: doc.id,
          memberName: memberData.memberName || 'No name',
          memberEmail: memberData.memberEmail || 'No email',
        });
        // Initialize animation refs for each member
        if (!deleteButtonScales[doc.id]) {
          deleteButtonScales[doc.id] = new Animated.Value(1);
        }
        
        // Initialize item animations
        if (!itemAnimations[doc.id]) {
          itemAnimations[doc.id] = {
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20)
          };
        }
      });

      setMembers(membersArray);
      
      // Animate content and header
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
      
      // Animate member items sequentially
      membersArray.forEach((member, index) => {
        Animated.parallel([
          Animated.timing(itemAnimations[member.id].opacity, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true
          }),
          Animated.timing(itemAnimations[member.id].translateY, {
            toValue: 0,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true
          })
        ]).start();
      });
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchMembers);
    return unsubscribe;
  }, [navigation]);

  const handlePressIn = (animatedValue: Animated.Value) => {
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (animatedValue: Animated.Value, onPress: () => void) => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start(() => onPress());
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Confirm Removal',
      `Remove ${memberName} from your members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (!auth.currentUser) return;

              const memberDocRef = doc(db, 'members', memberId);
              const memberSnapshot = await getDoc(memberDocRef);

              if (memberSnapshot.exists()) {
                const memberData = memberSnapshot.data();
                if (memberData?.ownerId === auth.currentUser.uid) {
                  await deleteDoc(memberDocRef);
                  setMembers(prev => prev.filter(m => m.id !== memberId));
                  Alert.alert('Success', 'Member removed successfully');
                } else {
                  Alert.alert('Error', 'You do not have permission to remove this member.');
                }
              } else {
                Alert.alert('Error', 'Member not found.');
              }
            } catch (err) {
              console.error('Remove error:', err);
              Alert.alert('Error', 'Failed to remove member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Fixed renderMemberItem function without hooks inside
  const renderMemberItem = ({ item, index }: { item: Member, index: number }) => {
    // Use the pre-created animation values instead of creating new ones
    const animations = itemAnimations[item.id] || { 
      opacity: new Animated.Value(1), 
      translateY: new Animated.Value(0) 
    };
    
    return (
      <Animated.View 
        key={item.id} 
        style={[
          styles.memberCard, 
          { 
            opacity: animations.opacity,
            transform: [{ translateY: animations.translateY }] 
          }
        ]}
      >
        <LinearGradient
          colors={['#4A6FE5', '#6B8FF8']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {item.memberName.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.memberInfo}>
          <Text 
            style={styles.memberName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.memberName}
          </Text>
          <Text 
            style={styles.memberEmail}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.memberEmail}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: deleteButtonScales[item.id] || 1 }] }}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPressIn={() => handlePressIn(deleteButtonScales[item.id])}
            onPressOut={() => handlePressOut(deleteButtonScales[item.id], () => handleRemoveMember(item.id, item.memberName))}
            activeOpacity={1}
          >
            <Ionicons name="trash-outline" size={isSmallScreen ? 18 : 20} color="#FF3B30" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FE5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchMembers}
        >
          <LinearGradient
            colors={['#4A6FE5', '#6B8FF8']}
            style={styles.gradientButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color="#4A6FE5" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Members</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Header Banner */}
        <Animated.View style={[styles.headerBanner, { opacity: headerOpacity }]}>
          <LinearGradient
            colors={['#4A6FE5', '#6B8FF8']}
            style={styles.gradientBanner}
          >
            <Ionicons name="people" size={isSmallScreen ? 24 : 28} color="#FFFFFF" />
            <Text style={styles.bannerText}>Manage your members</Text>
          </LinearGradient>
        </Animated.View>

        {/* Member List */}
        <ScrollView 
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {members.length === 0 ? (
            <Animated.View style={[styles.emptyState, { opacity: contentOpacity }]}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={isSmallScreen ? 40 : 48} color="#FFFFFF" />
              </View>
              <Text style={styles.emptyTitle}>No members yet</Text>
              <Text style={styles.emptyText}>Add your first member by clicking the button below</Text>
            </Animated.View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={renderMemberItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </ScrollView>

        {/* Add Member Button */}
        <Animated.View style={{ 
          transform: [{ scale: addButtonScale }],
          paddingHorizontal: isSmallScreen ? 15 : 20,
          marginBottom: 20
        }}>
          <TouchableOpacity
            style={styles.addButton}
            onPressIn={() => handlePressIn(addButtonScale)}
            onPressOut={() => handlePressOut(addButtonScale, () => navigation.navigate('AddMember'))}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#4A6FE5', '#6B8FF8']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={isSmallScreen ? 20 : 24} color="white" />
              <Text style={styles.addButtonText}>Add New Member</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FD',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: width < 375 ? 14 : 16,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '60%',
  },
  gradientButton: {
    paddingVertical: width < 375 ? 12 : 14,
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width < 375 ? 14 : 16,
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
  headerBanner: {
    marginHorizontal: width < 375 ? 15 : 20,
    marginTop: width < 375 ? 15 : 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: width < 375 ? 14 : 18,
    paddingHorizontal: width < 375 ? 15 : 20,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: width < 375 ? 16 : 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: width < 375 ? 15 : 20,
    paddingTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.1,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: isSmallScreen ? 40 : 50,
    backgroundColor: '#8EACFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width < 375 ? 14 : 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: width < 375 ? 44 : 52,
    height: width < 375 ? 44 : 52,
    borderRadius: width < 375 ? 22 : 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width < 375 ? 18 : 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: '600',
    color: '#333333',
  },
  memberEmail: {
    fontSize: width < 375 ? 14 : 15,
    color: '#666666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEB',
    borderRadius: isSmallScreen ? 16 : 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width < 375 ? 14 : 16,
    marginLeft: 8,
  },
});

export default MembersScreen;