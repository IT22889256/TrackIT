import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig'; // Import Firebase
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore'; // Import deleteDoc


type MembersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Members'
>;

type Props = {
  navigation: MembersScreenNavigationProp;
};

const MembersScreen: React.FC<Props> = ({ navigation }) => {
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDocumentId, setUserDocumentId] = useState<string | null>(null); // State to store the user document ID

  useEffect(() => {
    const fetchMembers = async () => {
      if (auth.currentUser) {
        try {
          // 1. Get the user's document ID.
          const userQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)); // Assumes you store uid in user doc
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            //Get the User Doc
            const userDoc = userSnapshot.docs[0];
            setUserDocumentId(userDoc.id); // Store the User Document ID
            // 2. Use the stored user document ID.
            const membersCollectionRef = collection(db, 'users', userDoc.id, 'members'); // Get subcollection
            const membersSnapshot = await getDocs(membersCollectionRef);

            const membersData = membersSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name, // Adjust field name if necessary
            }));
            setMembers(membersData);
          } else {
            Alert.alert("Error", "User document not found.");
            setLoading(false);
          }


        } catch (error) {
          console.error("Error fetching members:", error);
          Alert.alert("Error", "Failed to load members.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (auth.currentUser && userDocumentId) { // Ensure userDocumentId is available
              try {
                const memberDocRef = doc(db, 'users', userDocumentId, 'members', memberId);
                await deleteDoc(memberDocRef);
                // Update the local state to remove the member
                setMembers(prevMembers =>
                  prevMembers.filter(member => member.id !== memberId)
                );
                Alert.alert('Success', 'Member removed successfully.');
              } catch (error) {
                console.error('Error removing member:', error);
                Alert.alert('Error', 'Failed to remove member.');
              }
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading members...</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Members</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for right button */}
      </View>

      {/* Member List */}
      <View style={styles.memberList}>
        {members.length === 0 ? (
          <Text style={styles.noMembersText}>No members added yet.</Text>
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              {/* Placeholder for profile image */}
              <View style={styles.profileImage} />
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    /* Navigate to edit member screen */
                    Alert.alert('Edit Member', `Edit ${member.name}`);
                  }}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(member.id, member.name)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add Member Button */}
      <TouchableOpacity
        style={styles.addMemberButton}
        onPress={() => navigation.navigate('AddMember')} // Navigate to AddMemberScreen
      >
        <Text style={styles.addMemberButtonText}>Add Member</Text>
      </TouchableOpacity>
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
  memberList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#E0E0E0',
    justifyContent: 'space-between',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D0D0D0',
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#6750A4',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#CF1F1F',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addMemberButton: {
    backgroundColor: '#6750A4',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  addMemberButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noMembersText: { // Style for empty list message
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
  },
});

export default MembersScreen;

