import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  FlatList, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

type AddMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMember'>;

type Props = {
  navigation: AddMemberScreenNavigationProp;
};

type User = {
  uid: string;
  name: string;
  email: string;
  profileImageUrl?: string | null;
};

const AddMemberScreen: React.FC<Props> = ({ navigation }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [isValidEmail, setIsValidEmail] = useState(true);

  useEffect(() => {
    if (searchEmail.trim() === '') {
      setSearchResults([]);
      setSearchPerformed(false);
      setIsValidEmail(true);
    }
  }, [searchEmail]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setSearchEmail(text);
    setIsValidEmail(validateEmail(text) || text === '');
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    
    if (!searchEmail.trim()) {
      Alert.alert('Please enter an email', 'An email address is required to search for members.');
      setIsValidEmail(false);
      return;
    }

    if (!validateEmail(searchEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      setIsValidEmail(false);
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSearchPerformed(true);
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", searchEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        return;
      }

      const users: User[] = [];
      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        
        if (auth.currentUser && userDoc.id === auth.currentUser.uid) {
          continue;
        }
        
        const user: User = {
          uid: userDoc.id,
          name: userData.name,
          email: userData.email,
        };

        if (userData.hasProfilePicture) {
          try {
            const storageRef = ref(storage, `profilePictures/${userDoc.id}`);
            const downloadUrl = await getDownloadURL(storageRef);
            user.profileImageUrl = downloadUrl;
          } catch (error) {
            console.log('No profile picture found for user:', userDoc.id);
          }
        }

        users.push(user);
      }
      
      setSearchResults(users);
    } catch (error: any) {
      console.error('Error searching for users:', error);
      Alert.alert(
        'Search Failed', 
        'Unable to search for users at this time. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchEmail('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleAddMemberToCollection = async (memberToAdd: User) => {
    if (!memberToAdd || !auth.currentUser) {
      Alert.alert('Error', 'No user selected or you are not logged in.');
      return;
    }

    setAddingMember(memberToAdd.uid);
    
    try {
      const membersRef = collection(db, 'members');
      const memberQuery = query(
        membersRef,
        where("memberId", "==", memberToAdd.uid),
        where("ownerId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(memberQuery);

      if (!querySnapshot.empty) {
        Alert.alert(
          'Already Added', 
          `${memberToAdd.name} is already in your members list.`
        );
        setAddingMember(null);
        return;
      }

      const newMemberDocRef = doc(membersRef);
      await setDoc(newMemberDocRef, {
        memberId: memberToAdd.uid,
        ownerId: auth.currentUser.uid,
        memberName: memberToAdd.name,
        memberEmail: memberToAdd.email,
        memberProfileImage: memberToAdd.profileImageUrl || null,
        addedAt: new Date(),
      });

      Alert.alert(
        'Member Added',
        `${memberToAdd.name} has been successfully added to your members.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error adding member to collection:', error);
      Alert.alert(
        'Failed to Add Member', 
        'There was a problem adding this member. Please try again later.'
      );
    } finally {
      setAddingMember(null);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => handleAddMemberToCollection(item)}
      disabled={loading || addingMember === item.uid}
      style={styles.searchedUserInfo}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.profileImage} />
      ) : (
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.searchedUserTextContainer}>
        <Text numberOfLines={1} style={styles.searchedUserName}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.searchedUserEmail}>{item.email}</Text>
      </View>
      <View style={[
        styles.addMemberButton,
        (loading || addingMember === item.uid) && styles.disabledButton
      ]}>
        {addingMember === item.uid ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Add</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (!searchPerformed) return null;
    
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="search-outline" size={60} color="#CCCCCC" />
        <Text style={styles.noResultsTitle}>No users found</Text>
        <Text style={styles.noResultsText}>
          We couldn't find anyone with the email address "{searchEmail}".
        </Text>
        <Text style={styles.noResultsSubtext}>
          Make sure the email is correct or try another email address.
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Member</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={[
          styles.searchInputContainer,
          !isValidEmail && searchEmail.length > 0 && styles.invalidInput
        ]}>
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={isValidEmail || searchEmail.length === 0 ? "#AAAAAA" : "#FF3B30"} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter email address"
            placeholderTextColor="#AAAAAA"
            value={searchEmail}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchEmail.length > 0 && (
            <TouchableOpacity 
              onPress={handleClear}
              style={styles.clearInputButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={isValidEmail || searchEmail.length === 0 ? "#AAAAAA" : "#FF3B30"} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {!isValidEmail && searchEmail.length > 0 && (
          <Text style={styles.errorText}>Please enter a valid email address</Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!searchEmail.trim() || loading || !isValidEmail) && styles.disabledButton
          ]}
          onPress={handleSearch}
          disabled={loading || !searchEmail.trim() || !isValidEmail}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Results Section */}
      <View style={styles.searchResultsSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A6FE5" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  invalidInput: {
    borderColor: '#FF3B30',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  clearInputButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#4A6FE5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  searchResultsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  searchedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A6FE5',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchedUserTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchedUserName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  searchedUserEmail: {
    fontSize: 15,
    color: '#666666',
  },
  addMemberButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default AddMemberScreen;