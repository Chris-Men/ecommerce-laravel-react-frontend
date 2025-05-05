// LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/admin/login'; // Usa tu IP local si estás en desarrollo

const LoginScreen = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, {
        email,
        password
      });

      // Aquí guardas el token JWT
      const accessToken = response.data.access_token;
      setToken(accessToken);
      setError('');
      console.log('Login exitoso', accessToken);
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {token ? <Text style={styles.token}>Token: {token}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', // Fondo blanco
    padding: 20 
  },
  input: { 
    borderBottomWidth: 1, 
    marginBottom: 15, 
    fontSize: 16, 
    color: '#000000', // Texto negro
  },
  error: { 
    color: 'red', 
    marginTop: 10 
  },
  token: { 
    marginTop: 10, 
    color: 'green' 
  },
});

export default LoginScreen;