import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

type AddMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMember'>;

type Props = {
    navigation: AddMemberScreenNavigationProp;
};

const AddMemberScreen: React.FC<Props> = ({ navigation }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [member, setMember] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('Error', 'Please enter an email to search.');
      return;
    }

    setLoading(true);
    setMember(null); // Clear previous search results
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", searchEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'No user found with this email.');
        setLoading(false);
        return;
      }

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        setMember({
          uid: doc.id,
          name: userData.name,
          email: userData.email,
        });
      });

    } catch (error: any) {
      console.error('Error searching for user:', error);
      Alert.alert('Error', `Failed to search: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchEmail('');
    setMember(null);
  };

  const handleAddMember = async () => {
    if (member && auth.currentUser) {
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                [`members.${member.uid}`]: { // Use member.uid as the key in the map
                    name: member.name,
                    email: member.email,
                },
            });

            Alert.alert('Success', `${member.name} has been added to your members.`);
            navigation.goBack();
        } catch (error: any) {
            console.error('Error adding member:', error);
            Alert.alert('Error', `Failed to add member: ${error.message}`);
        } finally {
            setLoading(false);
        }
    } else {
        Alert.alert('Error', 'No member to add or user not logged in.');
    }
};
  const handleRemoveMember = () => {
    if (member) {
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${member.name} from this group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            onPress: () => {
              Alert.alert('Success', `${member.name} has been removed.`);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'No member to remove.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Member</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by email"
          value={searchEmail}
          onChangeText={setSearchEmail}
          keyboardType="email-address"
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Member Info Section */}
      <View style={styles.memberInfoSection}>
        {loading && <Text>Loading...</Text>}
        {member && (
          <View style={styles.memberInfo}>
            <View style={styles.profileImage} />
            <View style={styles.memberTextContainer}>
              <Text style={styles.memberName}>{member.name}</Text>
            </View>
            <View style={styles.addRemoveButtonContainer}>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleAddMember}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeMemberButton}
                onPress={handleRemoveMember}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  searchSection: {
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#6750A4',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  memberInfoSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D0D0D0',
    marginRight: 10,
  },
  memberTextContainer: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberEmail: {
    fontSize: 14,
    color: 'gray',
  },
  addRemoveButtonContainer: {
    flexDirection: 'row',
  },
  addMemberButton: {
    backgroundColor: '#6750A4',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
  },
  removeMemberButton: {
    backgroundColor: '#CF1F1F',
    padding: 8,
    borderRadius: 5,
  },
});

export default AddMemberScreen;

