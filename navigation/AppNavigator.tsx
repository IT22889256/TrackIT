// src/navigation/AppNavigator.tsx
import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen'; 
import HomeScreen from '@/screens/HomeScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import ChangePasswordScreen from '@/screens/ChangePasswordScreen';
import ReportsScreen from '@/screens/ReportScreen';
import ReminderScreen from '@/screens/ReminderScreen';
import LabelScan from '@/screens/LabelScan';


export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Profile:undefined;
  EditProfile:undefined;
  ChangePassword:undefined;
  Reports:undefined;
  Reminder: undefined;
  EditReminder: { reminderId: string };
  AddReminder: undefined;
  LabelScan: undefined;
  LabelPreview: { photo: any };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reminder" component={ReminderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LabelScan" component={LabelScan} options={{ headerShown: false }} />
      </Stack.Navigator>
    
  );
};

export default AppNavigator;