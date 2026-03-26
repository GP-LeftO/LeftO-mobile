import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text>Login Screen</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Main')}>
        <Text style={styles.button}>Go to Main App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 20,
    color: 'blue',
    fontSize: 16,
  },
});