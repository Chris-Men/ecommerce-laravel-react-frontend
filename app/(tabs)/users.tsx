import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });

  const apiUrl = 'http://localhost:8000/api/admin/users';

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchUsers = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id: number) => {
    Alert.alert('Confirmación', '¿Estás seguro de eliminar este usuario?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${apiUrl}/${id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });
            fetchUsers();
          } catch (error) {
            console.error('Error al eliminar usuario', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

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
          role: form.role,
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
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: '' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>

      {editingUser && (
        <View style={styles.form}>
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
          <TextInput
            style={styles.input}
            placeholder="Rol"
            value={form.role}
            onChangeText={(text) => setForm({ ...form, role: text })}
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
      )}

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
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteUser(item.id)}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    flex: 1,
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
  form: {
    marginBottom: 20,
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
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
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 6,
    borderRadius: 6,
    marginBottom: 5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserManagement;
