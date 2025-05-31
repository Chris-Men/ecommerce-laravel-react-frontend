// AdminProductsScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const API_URL = 'http://localhost:8000/api';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';
const SIDEBAR_WIDTH = isWeb ? 140 : 180;

// Calcular el número de columnas basado en el ancho de pantalla
const getNumColumns = () => {
  const availableWidth = SCREEN_WIDTH - SIDEBAR_WIDTH - 80; // restando sidebar y padding
  const minItemWidth = 280; // ancho mínimo por item
  return Math.max(1, Math.floor(availableWidth / minItemWidth));
};

const NUM_COLUMNS = isWeb ? 4 : Math.min(2, getNumColumns());

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

type Option = { id: number; name: string };

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

// Componente Sidebar
function AdminSidebar() {
  return (
    <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }]}>
      <View style={styles.logoDetails}>
        <Text style={styles.logoText}>🛒 MyStore</Text>
      </View>
      <ScrollView style={styles.navLinks}>
        {routes.map((route) => (
          <Link href={route.path} key={route.path} asChild>
            <TouchableOpacity style={styles.linkContainer}>
              <Text style={styles.navLinkText}>{route.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [brand_id, setBrandId] = useState('');
  const [size_id, setSizeId] = useState('');
  const [color_id, setColorId] = useState('');
  const [image, setImage] = useState<any>(null);

  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [sizes, setSizes] = useState<Option[]>([]);
  const [colors, setColors] = useState<Option[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchOptions();
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
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista de productos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    const token = await AsyncStorage.getItem('token');
    const fetchEntity = async (endpoint: string, setter: (data: Option[]) => void) => {
      try {
        const res = await fetch(`${API_URL}/admin/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const data = await res.json();
        setter(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        console.error(`Error cargando ${endpoint}:`, e);
        setter([]);
      }
    };

    fetchEntity('categories', setCategories);
    fetchEntity('brands', setBrands);
    fetchEntity('sizes', setSizes);
    fetchEntity('colors', setColors);
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

  // Función para manejar la edición de productos
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
    setImage(null); // Reset image, user can select new one if needed
    setModalVisible(true);
  };

  // Función que ejecuta la eliminación (adaptada del método de categorías)
  const handleDelete = async () => {
    if (!productToDelete) return;

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token de autenticación no encontrado');
        return;
      }

      const response = await fetch(`${API_URL}/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Éxito', 'Producto eliminado con éxito');
        await fetchProducts();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar el producto');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Error', `No se pudo eliminar el producto: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDeleteVisible(false);
      setProductToDelete(null);
    }
  };

  const handleSelectImage = () => {
    if (Platform.OS === 'web') return;
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel || response.errorCode) return;
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
      formData.append('price', price);
      formData.append('qty', qty);
      formData.append('category_id', category_id);
      formData.append('brand_id', brand_id);
      formData.append('size_id', size_id);
      formData.append('color_id', color_id);

      if (image && Platform.OS !== 'web') {
        const fileName = image.fileName || image.uri.split('/').pop() || 'image.jpg';
        const ext = fileName.split('.').pop()?.toLowerCase();
        const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        formData.append('image', {
          uri: image.uri,
          name: fileName,
          type,
        } as any);
      } else if (Platform.OS === 'web' && image) {
        formData.append('image', image);
      }

      const isEdit = !!editingProduct;
      const url = isEdit ? `${API_URL}/admin/products/${editingProduct.id}` : `${API_URL}/admin/products`;
      const method = 'POST';
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

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <View style={[
      styles.card,
      {
        width: isWeb 
          ? `${(100 / NUM_COLUMNS) - 2}%` 
          : (SCREEN_WIDTH - SIDEBAR_WIDTH - 60) / NUM_COLUMNS - 10,
        marginRight: (index % NUM_COLUMNS === NUM_COLUMNS - 1) ? 0 : 10,
      }
    ]}>
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.price}>${item.price}</Text>
        <Text style={styles.qty}>Stock: {item.qty}</Text>
        <Text style={[styles.status, { color: item.status ? '#4CAF50' : '#F44336' }]}>
          {item.status ? 'Activo' : 'Inactivo'}
        </Text>
        
        <View style={styles.attributesContainer}>
          <Text style={styles.attribute}>📁 {item.category?.name || 'Sin categoría'}</Text>
          <Text style={styles.attribute}>🏷 {item.brand?.name || 'Sin marca'}</Text>
          <Text style={styles.attribute}>📏 {item.size?.name || 'Sin tamaño'}</Text>
          <Text style={styles.attribute}>🎨 {item.color?.name || 'Sin color'}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.buttonText}>✏ Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => {
            setProductToDelete(item.id);
            setConfirmDeleteVisible(true);
          }}
        >
          <Text style={styles.buttonText}>🗑 Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AdminSidebar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <AdminSidebar />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Productos ({products.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Agregar Producto</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={products}
          numColumns={NUM_COLUMNS}
          key={NUM_COLUMNS}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
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
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{editingProduct ? 'Editar Producto' : 'Agregar Producto'}</Text>
                
                <TextInput placeholder="Nombre del producto" style={styles.input} value={name} onChangeText={setName} />
                <TextInput placeholder="Descripción" style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
                <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
                <TextInput placeholder="Cantidad en stock" style={styles.input} keyboardType="numeric" value={qty} onChangeText={setQty} />

                <Text style={styles.pickerLabel}>Categoría:</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={category_id} onValueChange={setCategoryId} style={styles.picker}>
                    <Picker.Item label="Seleccionar categoría" value="" />
                    {Array.isArray(categories) && categories.map(c => (
                      <Picker.Item key={c.id} label={c.name} value={c.id.toString()} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.pickerLabel}>Marca:</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={brand_id} onValueChange={setBrandId} style={styles.picker}>
                    <Picker.Item label="Seleccionar marca" value="" />
                    {Array.isArray(brands) && brands.map(b => (
                      <Picker.Item key={b.id} label={b.name} value={b.id.toString()} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.pickerLabel}>Tamaño:</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={size_id} onValueChange={setSizeId} style={styles.picker}>
                    <Picker.Item label="Seleccionar tamaño" value="" />
                    {Array.isArray(sizes) && sizes.map(s => (
                      <Picker.Item key={s.id} label={s.name} value={s.id.toString()} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.pickerLabel}>Color:</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={color_id} onValueChange={setColorId} style={styles.picker}>
                    <Picker.Item label="Seleccionar color" value="" />
                    {Array.isArray(colors) && colors.map(c => (
                      <Picker.Item key={c.id} label={c.name} value={c.id.toString()} />
                    ))}
                  </Picker>
                </View>

                <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImage}>
                  <Text style={styles.imagePickerText}>📷 Seleccionar Imagen</Text>
                </TouchableOpacity>
                
                {Platform.OS === 'web' && (
                  <input
                    type="file"
                    accept="image/*"
                    style={{ marginVertical: 10 }}
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) setImage(file);
                    }}
                  />
                )}
                
                {image && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Vista previa:</Text>
                    <Image
                      source={{ uri: Platform.OS === 'web' ? URL.createObjectURL(image) : image.uri }}
                      style={styles.previewImage}
                    />
                  </View>
                )}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveProduct}>
                    <Text style={styles.modalButtonText}>{editingProduct ? '✅ Actualizar' : '💾 Guardar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                    <Text style={styles.modalButtonText}>❌ Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal de confirmación para eliminar */}
      {/* Modal de confirmación para eliminar */}
<Modal
  visible={confirmDeleteVisible}
  animationType="fade"
  transparent={true}
  onRequestClose={() => {
    setConfirmDeleteVisible(false);
    setProductToDelete(null);
  }}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { width: isWeb ? 300 : '85%' }]}>
      <Text style={styles.modalTitle}>¿Eliminar producto?</Text>
      <Text style={styles.modalText}>
        Esta acción no se puede deshacer. ¿Estás seguro?
      </Text>

      <View style={styles.modalButtons}>
  <TouchableOpacity
    style={styles.deleteConfirmButton}
    onPress={handleDelete}
    disabled={loading}
  >
    <Text style={styles.deleteConfirmButtonText}>
      {loading ? 'Eliminando...' : 'Eliminar'}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.cancelButton}
    onPress={() => {
      setConfirmDeleteVisible(false);
      setProductToDelete(null);
    }}
  >
    <Text style={styles.cancelButtonText}>Cancelar</Text>
  </TouchableOpacity>
</View>

    </View>
  </View>
</Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flex: 1,
    padding: Platform.OS === 'web' ? 30 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#e9ecef',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#2c3e50',
    minHeight: 44,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  noImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  noImageText: {
    color: '#6c757d',
    fontSize: 16,
    fontStyle: 'italic',
  },
  productInfo: {
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    minHeight: 34,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  qty: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  attributesContainer: {
    gap: 4,
  },
  attribute: {
    fontSize: 12,
    color: '#6c757d',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#17a2b8',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    maxHeight: '90%',
    ...(Platform.OS === 'web' && {
      width: '70%',
      maxWidth: 600,
      alignSelf: 'center',
    }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  picker: {
    height: Platform.OS === 'ios' ? 200 : 50,
  },
  imagePickerButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  previewContainer: {
    marginVertical: 15,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
 
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },

  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Estilos del Sidebar
  sidebar: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#11101d',
    paddingTop: 20,
  },
  logoDetails: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  navLinks: {
    paddingLeft: 10,
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '85%', // este valor se sobrescribe dinámicamente con isWeb ? 300 : '85%'
    maxHeight: '90%',
    ...(Platform.OS === 'web' && {
      width: 300,
      maxWidth: 600,
      alignSelf: 'center',
    }),
  },
 
  modalText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkContainer: {
    backgroundColor: '#1d1b31',
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 18,
  },
});