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
import { useNavigation } from '@react-navigation/native'; // ← Importación añadida

const API_URL = 'http://localhost:8000/api/admin/colors';

type Color = {
  id: number;
  name: string;
};

export default function ColorsPage() {
  const navigation = useNavigation(); // ← Hook de navegación

  const [colors, setColors] = useState<Color[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<number | null>(null);

  const fetchColors = async () => {
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
        throw new Error(data.message || 'Error al obtener colores');
      }

      const sortedColors = data.colors.sort((a: Color, b: Color) => a.id - b.id);
      setColors(sortedColors);
    } catch (error: any) {
      console.error('Error al obtener colores:', error.message);
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
        Alert.alert(data.message || 'Color guardado con éxito');
        setName('');
        setEditingId(null);
        setModalVisible(false);
        fetchColors();
      } else {
        Alert.alert('Error', data.message || 'Error al guardar el color');
      }
    } catch (error: any) {
      console.error('Error al guardar color:', error.message);
      Alert.alert('Error', 'No se pudo guardar el color');
    }
  };

  const handleDelete = async () => {
    if (colorToDelete === null) return;

    const token = await AsyncStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/${colorToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(data.message || 'Color eliminado');
        fetchColors();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar el color');
      }
    } catch (error: any) {
      console.error('Error al eliminar color:', error.message);
      Alert.alert('Error', 'No se pudo eliminar el color');
    } finally {
      setConfirmDeleteVisible(false);
      setColorToDelete(null);
    }
  };

  const handleEdit = (color: Color) => {
    setName(color.name);
    setEditingId(color.id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchColors();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      {/* Botón Agregar */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingId(null);
          setName('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Agregar Color</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Listado de Colores</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={colors}
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
                    setColorToDelete(item.id);
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

      {/* Modal de agregar/editar */}
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
            <Text style={styles.modalTitle}>{editingId ? 'Editar Color' : 'Agregar Color'}</Text>

            <TextInput
              placeholder="Nombre del color"
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

      {/* Modal de confirmación de eliminación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmDeleteVisible}
        onRequestClose={() => {
          setConfirmDeleteVisible(false);
          setColorToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>¿Eliminar color?</Text>
            <Text style={{ marginBottom: 20 }}>¿Estás seguro de que deseas eliminar el color?</Text>
            <View style={styles.modalButtons}>
              <Button title="Eliminar" onPress={handleDelete} color="red" />
              <Button
                title="Cancelar"
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  setColorToDelete(null);
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
