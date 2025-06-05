import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  city?: string;
  zip_code?: string;
  country?: string;
  phone_number?: string;
  profile_image?: string;
  profile_completed: boolean;
  image_path: string;
}

const API_URL = 'http://localhost:8000/api/admin/users';

export default function UserManagement() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb;

  // En web sidebar un poco más angosto, en móvil el ancho fijo 180
  const SIDEBAR_WIDTH = isWeb ? 140 : 180;

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    city: '',
    zip_code: '',
    country: '',
    phone_number: '',
    profile_completed: false,
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const routes = [
    { path: '/admins', label: 'Admins' },
    { path: '/brands', label: 'Brands' },
    { path: '/categories', label: 'Categories' },
    { path: '/colors', label: 'Colors' },
    { path: '/coupons', label: 'Coupons' },
    { path: '/orders', label: 'Orders' },
    { path: '/products', label: 'Products' },
    { path: '/reviews', label: 'Reviews' },
    { path: '/sizes', label: 'Sizes' },
    { path: '/users', label: 'Users' },
  ] as const;

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener usuarios');
      }

      const sortedUsers = data.users.sort((a: User, b: User) => a.id - b.id);
      setUsers(sortedUsers);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setForm({ 
      name: user.name, 
      email: user.email, 
      password: '',
      city: user.city || '',
      zip_code: user.zip_code || '',
      country: user.country || '',
      phone_number: user.phone_number || '',
      profile_completed: user.profile_completed,
      role: user.role
    });
    setModalVisible(true);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setForm({ 
      name: '', 
      email: '', 
      password: '',
      city: '',
      zip_code: '',
      country: '',
      phone_number: '',
      profile_completed: false,
      role: ''
    });
    setModalVisible(false);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    if (form.name.trim() === '' || form.email.trim() === '') {
      Alert.alert('Validación', 'El nombre y email son obligatorios.');
      return;
    }

    try {
      const token = await getToken();
      const requestBody: any = {
        name: form.name,
        email: form.email,
        city: form.city,
        zip_code: form.zip_code,
        country: form.country,
        phone_number: form.phone_number,
        profile_completed: form.profile_completed,
        role: form.role,
      };

      // Solo incluir password si se proporcionó
      if (form.password) {
        requestBody.password = form.password;
        requestBody.password_confirmation = form.password;
      }

      const response = await fetch(`${API_URL}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessMessage('Usuario actualizado con éxito');
        fetchUsers();
        cancelEditing();
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar usuario');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }]}>
          <View style={styles.logoDetails}>
            <Text style={styles.logoText}>🛒 MyStore</Text>
          </View>
          <ScrollView style={styles.navLinks}>
            {routes.map((route) => (
              <Link
                href={route.path}
                key={route.path}
                style={styles.linkContainer}
                asChild
              >
                <TouchableOpacity>
                  <Text style={styles.navLinkText}>{route.label}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>

        {/* Main content */}
        <View style={styles.homeSection}>
          <Text style={styles.welcomeText}>👥 Usuarios</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#4e8cff" />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: '#fff' }]}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#11101d' },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 14, color: '#666', marginBottom: 2 },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      📧 {item.email}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 14, color: '#666', marginBottom: 2 },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      🆔 ID: {item.id}
                    </Text>
                    <Text
                      style={[
                        { 
                          fontSize: 14, 
                          color: item.role === 'admin' ? '#4e8cff' : '#28a745',
                          fontWeight: '500'
                        },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      👤 {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                    {item.city && (
                      <Text
                        style={[
                          { fontSize: 14, color: '#666', marginBottom: 2 },
                          isMobile ? { marginLeft: 20 } : {},
                        ]}
                      >
                        🏙️ {item.city}, {item.country}
                      </Text>
                    )}
                    {item.phone_number && (
                      <Text
                        style={[
                          { fontSize: 14, color: '#666', marginBottom: 2 },
                          isMobile ? { marginLeft: 20 } : {},
                        ]}
                      >
                        📱 {item.phone_number}
                      </Text>
                    )}
                    <Text
                      style={[
                        { 
                          fontSize: 12, 
                          color: item.profile_completed ? '#28a745' : '#ffc107',
                          fontWeight: '500'
                        },
                        isMobile ? { marginLeft: 20 } : {},
                      ]}
                    >
                      ✅ Perfil: {item.profile_completed ? 'Completo' : 'Incompleto'}
                    </Text>
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => startEditing(item)}>
                      <Text style={{ color: '#4e8cff', fontWeight: '500' }}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Modal editar usuario */}
          <Modal animationType="fade" transparent visible={modalVisible}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  isWeb
                    ? { width: 400, maxHeight: '80%' } // más ancho y limitamos altura
                    : { width: '95%', maxHeight: '90%' }, // ancho móvil
                ]}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>Editar Usuario</Text>
                  
                  {/* Campos básicos */}
                  <TextInput
                    placeholder="Nombre"
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                  />
                  
                  <TextInput
                    placeholder="Correo electrónico"
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    placeholder="Nueva contraseña (opcional)"
                    value={form.password}
                    onChangeText={(text) => setForm({ ...form, password: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                    secureTextEntry
                  />

                  <TextInput
                    placeholder="Rol"
                    value={form.role}
                    onChangeText={(text) => setForm({ ...form, role: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                  />
                  
                  {/* Nuevos campos */}
                  <TextInput
                    placeholder="Ciudad"
                    value={form.city}
                    onChangeText={(text) => setForm({ ...form, city: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                  />
                  
                  <TextInput
                    placeholder="Código Postal"
                    value={form.zip_code}
                    onChangeText={(text) => setForm({ ...form, zip_code: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                  />
                  
                  <TextInput
                    placeholder="País"
                    value={form.country}
                    onChangeText={(text) => setForm({ ...form, country: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                  />
                  
                  <TextInput
                    placeholder="Número de teléfono"
                    value={form.phone_number}
                    onChangeText={(text) => setForm({ ...form, phone_number: text })}
                    style={styles.input}
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />

                  {/* Switch para perfil completado */}
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Perfil Completado:</Text>
                    <TouchableOpacity
                      style={[
                        styles.switch,
                        { backgroundColor: form.profile_completed ? '#4e8cff' : '#ccc' }
                      ]}
                      onPress={() => setForm({ ...form, profile_completed: !form.profile_completed })}
                    >
                      <View
                        style={[
                          styles.switchThumb,
                          { transform: [{ translateX: form.profile_completed ? 20 : 2 }] }
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                  
                </ScrollView>
                
                <View style={styles.modalButtons}>
                  <Button title="Actualizar" onPress={updateUser} />
                  <Button
                    title="Cancelar"
                    color="gray"
                    onPress={cancelEditing}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#11101d',
    paddingTop: 20,
  },
  logoDetails: {
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navLinks: {
    flex: 1,
  },
  linkContainer: {
    textDecorationLine: 'none',
  },
  navLinkText: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  homeSection: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#11101d',
    marginBottom: 20,
  },
<<<<<<< HEAD
  successMessageContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  successMessageText: {
    color: '#155724',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
=======

  card: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    marginEnd: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
>>>>>>> ed4f53b753438e391ec9b4022e958eb7b350a3df
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingVertical: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});