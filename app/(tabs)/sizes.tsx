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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // <-- Importación para navegación

const API_URL = 'http://localhost:8000/api/admin/sizes';

type Size = {
  id: number;
  name: string;
};

export default function SizesPage() {
  const navigation = useNavigation(); // <-- Hook de navegación

  const [sizes, setSizes] = useState<Size[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<number | null>(null);

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener tallas');
      }

      const sortedSizes = data.sizes.sort((a: Size, b: Size) => a.id - b.id);
      setSizes(sortedSizes);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (name.trim() === '') {
      Alert.alert('Validación', 'El nombre no puede estar vacío.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
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
        Alert.alert(data.message || 'Talla guardada con éxito');
        setName('');
        setEditingId(null);
        setModalVisible(false);
        fetchSizes();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar la talla');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar la talla');
    }
  };

  const handleDelete = async () => {
    if (sizeToDelete === null) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${sizeToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(data.message || 'Talla eliminada');
        fetchSizes();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar la talla');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo eliminar la talla');
    } finally {
      setConfirmDeleteVisible(false);
      setSizeToDelete(null);
    }
  };

  const handleEdit = (size: Size) => {
    setName(size.name);
    setEditingId(size.id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

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
        <ActivityIndicator size="large" color="#0000ff" />
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
                  onPress={() => {
                    setSizeToDelete(item.id);
                    setConfirmDeleteVisible(true);
                  }}
                >
                  <Text style={{ color: 'red' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal agregar/editar */}
      <Modal
        animationType="slide"
        transparent
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

      {/* Modal confirmación eliminación */}
      <Modal
        animationType="fade"
        transparent
        visible={confirmDeleteVisible}
        onRequestClose={() => {
          setConfirmDeleteVisible(false);
          setSizeToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>¿Eliminar talla?</Text>
            <Text style={{ marginBottom: 20 }}>
              ¿Estás seguro de que deseas eliminar esta talla?
            </Text>
            <View style={styles.modalButtons}>
              <Button title="Eliminar" onPress={handleDelete} color="red" />
              <Button
                title="Cancelar"
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  setSizeToDelete(null);
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
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
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
