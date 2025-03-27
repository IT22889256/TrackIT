// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import LabelManualEdit from '@/screens/LabelManualEdit';


import CameraScreen from '@/screens/CameraScreen';
import ScannedItemsScreen from '@/screens/ScannedItemsScreen';
import ManuallyAddItem from '@/screens/ManuallyAddItemScreen';
import InventoryItemsScreen from '@/screens/InventoryItemsScreen';

import MembersScreen from '@/screens/MemberScreen';
import AddMemberScreen from '@/screens/AddMemberScreen';

import BudgetListScreen from '@/screens/BudgetListScreen';
import EnterBudgetScreen from '@/screens/EnterBudgetScreen';


import InventoryScreen from '@/screens/InventoryScreen';
import ShoppingListScreen from '@/screens/ShoppingListScreen';
import AddItemsScreen from '@/screens/AddItemsScreen';
import EditItemsScreen from '@/screens/EditItemsScreen';
import ItemDetailsScreen from '@/screens/ItemDetailsScreen';


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
  LabelManualEdit: undefined;
  Camera: undefined;
  ScannedItems: { scannedItems: any };
  ManuallyAddItem: undefined;
  InventoryItems: undefined;
  Members:undefined;
  ShoppingList:undefined;
  AddItems:undefined;
  BudgetList:undefined;
  EnterBudget: undefined;
  EditItems:undefined;
  ItemDetails:undefined;
  InventoryScreen:undefined;
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
        <Stack.Screen name='LabelManualEdit' component={LabelManualEdit} options={{ headerShown: false }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScannedItems" component={ScannedItemsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManuallyAddItem" component={ManuallyAddItem} options={{ headerShown: false }} />
        <Stack.Screen name="InventoryItems" component={InventoryItemsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Members" component={MembersScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddItems" component={AddItemsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BudgetList" component={BudgetListScreen} options={{ headerShown: false }} />  
        <Stack.Screen name="EnterBudget" component={EnterBudgetScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditItems" component={EditItemsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ headerShown: false }} />

      </Stack.Navigator>
    
  );
};

export default AppNavigator;