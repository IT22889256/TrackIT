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
import MembersScreen from '@/screens/MemberScreen';
import AddMemberScreen from '@/screens/AddMemberScreen';
import InventoryScreen from '@/screens/InventoryScreen';
import ShoppingListScreen from '@/screens/ShoppligListScreen';
import AddItemsScreen from '@/screens/AddItemsScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Profile:undefined;
  EditProfile:undefined;
  ChangePassword:undefined;
  Reports:undefined;
  Members:undefined;
  Inventory:undefined;
  ShoppingList:undefined;
  AddItems:undefined;
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
        <Stack.Screen name="Members" component={MembersScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddItems" component={AddItemsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    
  );
};

export default AppNavigator;