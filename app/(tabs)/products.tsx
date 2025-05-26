import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  Modal,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  qty: number | string;
  status?: boolean;
  image_url?: string;
  category?: { name: string };
  brand?: { name: string };
  size?: { name: string };
  color?: { name: string };
};

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [brand_id, setBrandId] = useState('');
  const [size_id, setSizeId] = useState('');
  const [color_id, setColorId] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de productos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('qty', qty);
      formData.append('category_id', category_id);
      formData.append('brand_id', brand_id);
      formData.append('size_id', size_id);
      formData.append('color_id', color_id);

      const response = await fetch('http://localhost:8000/api/admin/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error:', errorData);
        Alert.alert('Error', 'No se pudo agregar el producto');
        return;
      }

      Alert.alert('Éxito', 'Producto agregado correctamente');
      setModalVisible(false);
      fetchProducts();

      // Limpiar campos
      setName('');
      setDescription('');
      setPrice('');
      setQty('');
      setCategoryId('');
      setBrandId('');
      setSizeId('');
      setColorId('');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      Alert.alert('Error', 'Error inesperado al agregar el producto');
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
           {item.image_url ? (
  <Image
    source={{ uri: `http://localhost:8000/storage/${item.image_url}` }}
    style={styles.productImage}
    onError={(error) => {
      console.log('Error al cargar imagen:', error.nativeEvent);
    }}
  />
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
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Agregar Nuevo Producto</Text>

              <TextInput placeholder="Nombre" style={styles.input} value={name} onChangeText={setName} />
              <TextInput
                placeholder="Descripción"
                style={[styles.input, { height: 60 }]}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
              <TextInput placeholder="Cantidad (qty)" style={styles.input} keyboardType="numeric" value={qty} onChangeText={setQty} />
              <TextInput placeholder="ID Categoría" style={styles.input} value={category_id} onChangeText={setCategoryId} />
              <TextInput placeholder="ID Marca" style={styles.input} value={brand_id} onChangeText={setBrandId} />
              <TextInput placeholder="ID Tamaño" style={styles.input} value={size_id} onChangeText={setSizeId} />
              <TextInput placeholder="ID Color" style={styles.input} value={color_id} onChangeText={setColorId} />

              <Button title="Guardar Producto" onPress={handleAddProduct} />
              <Button title="Cancelar" onPress={() => setModalVisible(false)} color="gray" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    marginVertical: 8,
    borderRadius: 8,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
});
