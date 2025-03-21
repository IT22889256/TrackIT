import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type ReportsScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Reports'
>;

type Props = {
    navigation: ReportsScreenNavigationProp;
};

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
    const reportData = [
        { id: '1', title: 'Report 1' },
        { id: '2', title: 'Report 2' },
        { id: '3', title: 'Report 3' },
    ];

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
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for right button */}
      </View>

      {/* Report Items */}
      <View style={styles.reportList}>
        {reportData.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportItem}
            onPress={() => {
              /* Navigate to a detailed report screen, you can add a screen for report details */
              Alert.alert('Report Details', `You clicked on ${report.title}`);
            }}
          >
            <Text style={styles.reportTitle}>{report.title}</Text>
          </TouchableOpacity>
        ))}
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
  reportList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  reportItem: {
    backgroundColor: '#E0E0E0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportsScreen;
