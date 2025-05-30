import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const API_URL = 'http://localhost:8000/api';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  qty: number | string;
  status?: boolean;
  image?: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  size?: { id: number; name: string };
  color?: { id: number; name: string };
};

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [brand_id, setBrandId] = useState('');
  const [size_id, setSizeId] = useState('');
  const [color_id, setColorId] = useState('');
  const [image, setImage] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la lista de productos.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setQty('');
    setCategoryId('');
    setBrandId('');
    setSizeId('');
    setColorId('');
    setImage(null);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setQty(product.qty.toString());
    setCategoryId(product.category?.id.toString() || '');
    setBrandId(product.brand?.id.toString() || '');
    setSizeId(product.size?.id.toString() || '');
    setColorId(product.color?.id.toString() || '');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Seguro que quieres eliminar este producto?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/products/${id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al eliminar');
            }

            fetchProducts();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo eliminar el producto');
          }
        },
      },
    ]);
  };

  const handleSelectImage = () => {
    if (Platform.OS === 'web') return;
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error al seleccionar imagen', response.errorMessage || '');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleSaveProduct = async () => {
    if (!name || !description || !price || !qty) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', parseFloat(price).toString());
      formData.append('qty', parseInt(qty).toString());
      formData.append('category_id', category_id);
      formData.append('brand_id', brand_id);
      formData.append('size_id', size_id);
      formData.append('color_id', color_id);

      if (image) {
        if (Platform.OS === 'web') {
          formData.append('image', image);
        } else if (image.uri) {
          const fileName = image.fileName || image.uri.split('/').pop() || 'photo.jpg';
          const ext = fileName.split('.').pop()?.toLowerCase();
          const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          formData.append('image', {
            uri: image.uri,
            name: fileName,
            type,
          } as any);
        }
      }

      const isEdit = !!editingProduct;
      const url = isEdit
        ? `${API_URL}/admin/products/${editingProduct.id}`
        : `${API_URL}/admin/products`;
      const method = isEdit ? 'POST' : 'POST';
      if (isEdit) formData.append('_method', 'PUT');

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.log('Errores de validación:', responseData.errors);
        Alert.alert('Error', Object.values(responseData.errors || {}).flat().join('\n'));
        return;
      }

      Alert.alert('Éxito', isEdit ? 'Producto actualizado' : 'Producto creado');
      setModalVisible(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Error inesperado al guardar el producto');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Agregar Producto" onPress={() => setModalVisible(true)} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
              <Text style={{ color: 'gray' }}>Sin imagen disponible</Text>
            )}
            <Text>Descripción: {item.description}</Text>
            <Text>Precio: ${item.price}</Text>
            <Text>Cantidad: {item.qty}</Text>
            <Text>Estado: {item.status ? 'Activo' : 'Inactivo'}</Text>
            <Text>Categoría: {item.category?.name || 'Sin categoría'}</Text>
            <Text>Marca: {item.brand?.name || 'Sin marca'}</Text>
            <Text>Tamaño: {item.size?.name || 'Sin tamaño'}</Text>
            <Text>Color: {item.color?.name || 'Sin color'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Button title="Editar" onPress={() => handleEdit(item)} />
              <Button title="Eliminar" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
      />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </Text>
              <TextInput placeholder="Nombre" style={styles.input} value={name} onChangeText={setName} />
              <TextInput
                placeholder="Descripción"
                style={[styles.input, { height: 60 }]}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
              <TextInput placeholder="Cantidad" style={styles.input} keyboardType="numeric" value={qty} onChangeText={setQty} />
              <TextInput placeholder="ID Categoría" style={styles.input} value={category_id} onChangeText={setCategoryId} />
              <TextInput placeholder="ID Marca" style={styles.input} value={brand_id} onChangeText={setBrandId} />
              <TextInput placeholder="ID Tamaño" style={styles.input} value={size_id} onChangeText={setSizeId} />
              <TextInput placeholder="ID Color" style={styles.input} value={color_id} onChangeText={setColorId} />
              <Button title="Seleccionar Imagen" onPress={handleSelectImage} />
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  accept="image/*"
                  style={{ marginVertical: 10 }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImage(file);
                  }}
                />
              )}
              {image && (
                <Image
                  source={{ uri: Platform.OS === 'web' ? URL.createObjectURL(image) : image.uri }}
                  style={{ width: '100%', height: 150, marginVertical: 10 }}
                />
              )}
              <Button title={editingProduct ? 'Actualizar Producto' : 'Guardar Producto'} onPress={handleSaveProduct} />
              <Button title="Cancelar" onPress={() => { setModalVisible(false); resetForm(); }} color="gray" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 20, flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    marginVertical: 8,
    borderRadius: 8,
  },
  modalWrapper: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { margin: 20, backgroundColor: 'white', padding: 20, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
});
