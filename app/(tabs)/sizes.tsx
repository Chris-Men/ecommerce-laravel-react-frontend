import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000/api/admin/sizes'; // Cambia a la ruta correcta

export default function SizesPage() {
  const [sizes, setSizes] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Obtener lista de tallas
  const fetchSizes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener tallas');
      }

      const data = await res.json();
      const sortedSizes = data.sizes.sort((a: any, b: any) => a.id - b.id);
      setSizes(sortedSizes);
    } catch (error: any) {
      console.error('Error al obtener tallas:', error?.message ?? error);
      Alert.alert('Error', error?.message ?? 'Error desconocido al obtener tallas');
    } finally {
      setLoading(false);
    }
  };

  // Crear o actualizar talla
  const handleSubmit = async () => {
    if (name.trim() === '') {
      Alert.alert('Validación', 'El nombre no puede estar vacío.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(data.message);
        setName('');
        setEditingId(null);
        setModalVisible(false);
        await fetchSizes(); // Espera antes de continuar
      } else {
        Alert.alert('Error', data.message || 'Error al guardar la talla');
      }
    } catch (error: any) {
      console.error('Error al guardar talla:', error?.message ?? error);
      Alert.alert('Error', 'No se pudo guardar la talla');
    }
  };

  // Eliminar talla
  const handleDelete = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación');
        return;
      }

      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(data.message);
        await fetchSizes(); // Espera actualización
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar talla:', error);
      Alert.alert('Error', 'No se pudo eliminar la talla');
    }
  };

  // Preparar edición
  const handleEdit = (size: any) => {
    setName(size.name);
    setEditingId(size.id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingId(null);
          setName('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Agregar Talla</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Listado de Tallas</Text>

      {loading ? (
        <Text>Cargando...</Text>
      ) : (
        <FlatList
          data={sizes}
          keyExtractor={(item) => item.id.toString()}
          style={{ marginTop: 10 }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={{ color: 'blue', marginRight: 15 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Confirmar eliminación',
                      '¿Está seguro de eliminar esta talla?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          onPress: () => handleDelete(item.id),
                          style: 'destructive',
                        },
                      ]
                    )
                  }
                >
                  <Text style={{ color: 'red' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setName('');
          setEditingId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Talla' : 'Agregar Talla'}</Text>

            <TextInput
              placeholder="Nombre de la talla"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Button title={editingId ? 'Actualizar' : 'Guardar'} onPress={handleSubmit} />
              <Button
                title="Cancelar"
                color="gray"
                onPress={() => {
                  setModalVisible(false);
                  setName('');
                  setEditingId(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listTitle: {
    fontSize: 18,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  actions: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
