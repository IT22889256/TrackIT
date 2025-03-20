
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Index = () => {
    return (
        <View>
            <Text>Index</Text>
            <TouchableOpacity onPress={() =>router.navigate('/camera')} className=' items-center'>
                    <Ionicons name="person-outline" size={24} color="black" />
                    <Text>Camera</Text>
                </TouchableOpacity>

                
                <Link href={'/camera'} className=' my-2'>Category Screen</Link>
        </View>
    );
}

const styles = StyleSheet.create({})

export default Index;
