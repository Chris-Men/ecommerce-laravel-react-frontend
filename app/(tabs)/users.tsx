import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // <-- Importación para navegación

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const navigation = useNavigation(); // <-- Hook de navegación agregado

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isModalVisible, setModalVisible] = useState(false);

  const apiUrl = 'http://localhost:8000/api/admin/users';

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error al obtener usuarios', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const token = await getToken();
      const response = await fetch(`${apiUrl}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          password_confirmation: form.password || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error actualizando usuario');

      fetchUsers();
      cancelEditing();
    } catch (error) {
      console.error('Error al actualizar usuario', error);
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '' });
    setModalVisible(true);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '' });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Botón Volver agregado arriba */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Gestión de Usuarios</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View>
                <Text style={styles.userText}>ID: {item.id}</Text>
                <Text style={styles.userText}>Nombre: {item.name}</Text>
                <Text style={styles.userText}>Correo: {item.email}</Text>
                <Text style={styles.userText}>Rol: {item.role}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => startEditing(item)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelEditing}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.subTitle}>Editar Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña (opcional)"
              value={form.password}
              secureTextEntry
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={updateUser} style={styles.saveButton}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#0d6efd',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userText: {
    marginBottom: 2,
    fontSize: 14,
  },
  actions: {
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    elevation: 10,
  },
});

export default UserManagement;
