import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = 'http://localhost:8000/api/admin/categories';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

const CATEGORIES_PER_PAGE = 9;

export default function CategoriesPage() {
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const SIDEBAR_WIDTH = isWeb ? 200 : 180;

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const totalPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE);

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
  ];

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token de autenticación no encontrado');
        return;
      }

      console.log('Fetching categories from:', API_URL);

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Categories response:', result);

      // Manejar diferentes estructuras de respuesta
      let categoriesData = [];
      if (result.data) {
        categoriesData = Array.isArray(result.data) ? result.data : [];
      } else if (result.categories) {
        categoriesData = Array.isArray(result.categories) ? result.categories : [];
      } else if (Array.isArray(result)) {
        categoriesData = result;
      }

      const sortedCategories = categoriesData.sort((a: Category, b: Category) => a.id - b.id);
      setCategories(sortedCategories);
      setFilteredCategories(sortedCategories); // Actualizar filteredCategories al cargar

    } catch (error: any) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', `No se pudieron cargar las categorías: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPaginatedFilteredCategories = () => {
    const startIndex = (currentPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  };


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCategories(categories); // Si no hay búsqueda, mostrar todas
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(query.toLowerCase()) ||
        category.slug.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const showSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
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
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 600
        },
        (response) => {
          if (response.didCancel || response.errorMessage) return;

          if (response.assets && response.assets.length > 0) {
            setImage(response.assets[0]);
          } else {
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
          }
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token de autenticación no encontrado');
        return;
      }

      const formData = new FormData();
      formData.append('name', name.trim());

      // Manejar imagen según la plataforma
      if (image) {
        if (Platform.OS === 'web' && image.file) {
          formData.append('image', image.file);
        } else if (Platform.OS !== 'web' && image.uri) {
          const fileName = image.fileName || `image_${Date.now()}.jpg`;
          const fileType = image.type || 'image/jpeg';

          formData.append('image', {
            uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
            name: fileName,
            type: fileType,
          } as any);
        }
      }

      const isEdit = !!editingCategory;
      let url = API_URL;
      let method = 'POST';

      if (isEdit) {
        url = `${API_URL}/${editingCategory.id}`;
        formData.append('_method', 'PUT');
      }

      console.log('Submitting to:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          // No incluir Content-Type para FormData
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Submit response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        Alert.alert('Error', 'Respuesta inesperada del servidor');
        return;
      }

      if (response.ok) {
        showSuccessMessage(data.message || 'Categoría guardada con éxito');
        resetForm();
        setModalVisible(false);
        await fetchCategories();
      } else {
        console.error('Submit error:', data);
        const errorMsg = data.message || 'Error al guardar la categoría';
        if (data.errors) {
          const errorMsgs = Object.values(data.errors).flat().join('\n');
          Alert.alert('Error', errorMsgs);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Submit network error:', error);
      Alert.alert('Error', `No se pudo guardar la categoría: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setImage(null);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token de autenticación no encontrado');
        return;
      }

      const response = await fetch(`${API_URL}/${categoryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessMessage('Categoría eliminada con éxito');
        await fetchCategories();
      } else {
        Alert.alert('Error', data.message || 'Error al eliminar la categoría');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Error', `No se pudo eliminar la categoría: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDeleteVisible(false);
      setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setName('');
    setImage(null);
    setEditingCategory(null);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}>
      {item.image && (
        <Image
          source={{ uri: `http://localhost:8000/storage/${item.image}` }}
          style={[styles.categoryImage, isMobile ? styles.categoryImageMobile : styles.categoryImageWeb]}
          onError={(error) => console.log('Image load error:', error)}
        />
      )}

      <View style={[styles.categoryContent, isMobile ? styles.categoryContentMobile : styles.categoryContentWeb]}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categorySlug}>Slug: {item.slug}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setCategoryToDelete(item.id);
              setConfirmDeleteVisible(true);
            }}
          >
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>‹ Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.paginationInfoText}>{`${currentPage} de ${totalPages}`}</Text>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  // Forzar numColumns para ser exactamente 1 en móvil
  const numColumns = isMobile ? 1 : 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
          <View style={styles.header}>
            <Text style={styles.welcomeText}>📂 Categorías</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Agregar Categoría</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Buscar categorías..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => handleSearch('')}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4e8cff" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay categorías disponibles</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchCategories}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={getPaginatedFilteredCategories()}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCategoryItem}
                numColumns={numColumns}
                key={`${numColumns}-${isMobile ? 'mobile' : 'web'}`}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={!isMobile ? styles.row : undefined}
                showsVerticalScrollIndicator={true}
              />
              {renderPagination()}
            </>
          )}

          {/* Modal para agregar/editar */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                { width: isWeb ? 400 : '90%' }
              ]}>
                <Text style={styles.modalTitle}>
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </Text>

                <TextInput
                  placeholder="Nombre de la categoría"
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
                      uri: image?.uri || `http://localhost:8000/storage/${editingCategory?.image}`,
                    }}
                    style={styles.previewImage}
                  />
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      setModalVisible(false);
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal confirmación eliminar */}
          <Modal animationType="fade" transparent visible={confirmDeleteVisible}>
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                { width: isWeb ? 300 : '85%' }
              ]}>
                <Text style={styles.modalTitle}>¿Eliminar categoría?</Text>
                <Text style={styles.modalText}>
                  ¿Estás seguro de que deseas eliminar esta categoría?
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
                      setCategoryToDelete(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
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
  // Contenedores principales
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flex: 1,
    padding: Platform.OS === 'web' ? 30 : 20,
  },

  // Sidebar
  sidebar: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#11101d',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoDetails: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1d1b31',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  navLinks: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  linkContainer: {
    backgroundColor: '#1d1b31',
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Sección principal
  homeSection: {
    flex: 1,
    padding: Platform.OS === 'web' ? 30 : 20,
    backgroundColor: '#f8f9fa',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
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

  // Mensajes
  successMessageContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successMessageText: {
    color: '#155724',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Estados de carga y vacío
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Lista y grid
  listContainer: {
    paddingBottom: 20,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  row: {
    flex: 1,
    justifyContent: 'space-around',
    marginBottom: 16,
  },

  // Cards de categorías
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
  cardWeb: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: Platform.OS === 'web' ? 300 : '100%',
  },
  cardMobile: {
    flex: 1,
    marginHorizontal: 0,
  },

  // Contenido de categoría
  categoryContent: {
    flex: 1,
  },
  categoryContentWeb: {
    minHeight: 120,
  },
  categoryContentMobile: {
    minHeight: 100,
  },
  categoryName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    color: '#2c3e50',
  },
  categorySlug: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // Imágenes de categoría
  categoryImage: {
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  categoryImageWeb: {
    width: '100%',
    height: 150,
  },
  categoryImageMobile: {
    width: '100%',
    height: 120,
  },

  // Información del producto (para compatibilidad)
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

  // Botones de acción
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
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
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modales
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    maxHeight: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
  modalText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },

  // Inputs y formularios
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

  // Selector de imagen
  imagePicker: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
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

  // Preview de imagen
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
    marginTop: 10,
  },

  // Botones de modal
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteConfirmButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  paginationButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  paginationButtonDisabled: {
    backgroundColor: '#b0c4de', // Color para botón deshabilitado
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  paginationInfoText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 16,
    color: '#495057',
  },
  clearSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
});