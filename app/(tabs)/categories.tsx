import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const API_URL = 'http://localhost:8000/api/admin/categories';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const json = await res.json();
      setCategories(json.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const openImagePicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setImage({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            file,
          });
        }
      };
      input.click();
    } else {
      launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
        if (response.didCancel) return;
        if (response.assets && response.assets.length > 0) {
          setImage(response.assets[0]);
        } else {
          Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      return Alert.alert('Error', 'El nombre es obligatorio');
    }

    const formData = new FormData();
    formData.append('name', name);

    if (Platform.OS === 'web') {
      if (image?.file) {
        formData.append('image', image.file);
      }
    } else {
      if (image?.uri) {
        const fileName = image.fileName || `image_${Date.now()}.jpg`;
        const fileType = image.type || 'image/jpeg';
        const uri = Platform.OS === 'android' ? image.uri : image.uri.replace('file://', '');
        formData.append('image', {
          uri,
          name: fileName,
          type: fileType,
        } as any);
      }
    }

    const token = await AsyncStorage.getItem('token');
    const isEdit = !!editingCategory;
    const url = isEdit ? `${API_URL}/${editingCategory!.id}` : API_URL;

    if (isEdit) {
      formData.append('_method', 'PUT');
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const text = await res.text();
      console.log('🧾 Respuesta cruda:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return Alert.alert('Error', 'Respuesta inesperada del servidor');
      }

      if (res.ok) {
        Alert.alert('Éxito', data.message || 'Categoría guardada');
        setModalVisible(false);
        resetForm();
        fetchCategories();
      } else {
        console.log('⚠️ Errores:', data.errors);
        const errorMsgs = Object.values(data.errors || {}).flat().join('\n');
        Alert.alert('Error', errorMsgs || data.message || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      Alert.alert('Error', 'No se pudo guardar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setImage(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta categoría?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('token');
          try {
            const res = await fetch(`${API_URL}/${id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });

            const data = await res.json();
            if (res.ok) {
              Alert.alert('Eliminado', data.message);
              fetchCategories();
            } else {
              Alert.alert('Error', data.message);
            }
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setName('');
    setImage(null);
    setEditingCategory(null);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categorías</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Agregar Categoría</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.name}>{item.name}</Text>
              {item.image && (
                <Image
                  source={{ uri: `http://localhost:8000/storage/${item.image}` }}
                  style={styles.image}
                />
              )}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: 'blue' }]}
                  onPress={() => handleEdit(item)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: 'red' }]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </Text>
          <TextInput
            placeholder="Nombre"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity onPress={openImagePicker} style={styles.imagePicker}>
            <Text style={styles.imagePickerText}>
              {image ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </Text>
          </TouchableOpacity>
          {(image?.uri || editingCategory?.image) && (
            <Image
              source={{
                uri: image?.uri
                  ? image.uri
                  : `http://localhost:8000/storage/${editingCategory?.image}`,
              }}
              style={styles.previewImage}
            />
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  addButton: {
    backgroundColor: 'green',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  addButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  image: { height: 100, width: '100%', marginTop: 10, borderRadius: 5 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: { padding: 10, borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  modalContent: { flex: 1, padding: 20, justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  imagePicker: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  imagePickerText: { textAlign: 'center' },
  previewImage: { width: '100%', height: 150, marginBottom: 15 },
  saveButton: { backgroundColor: 'blue', padding: 10, borderRadius: 5 },
  cancelButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});
