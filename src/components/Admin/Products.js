import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaFilter } from 'react-icons/fa';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';

const db = getFirestore();

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    color: #2d3436;
    font-size: 2rem;
    margin-bottom: 10px;
    font-weight: 700;
  }
`;

const TopControls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
`;

const CategorySelect = styled.select`
  padding: 8px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  background: white;
  color: #2d3436;
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6c5ce7;
  }
`;

const AddButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 8px 15px;
  flex: 1;

  input {
    border: none;
    outline: none;
    width: 100%;
    margin-left: 10px;
    font-size: 0.9rem;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ProductImage = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${props => props.src || 'https://via.placeholder.com/300x200?text=No+Image'});
  background-size: cover;
  background-position: center;
`;

const ProductInfo = styled.div`
  padding: 15px;

  h3 {
    margin: 0;
    color: #2d3436;
    font-size: 1.1rem;
  }

  p {
    color: #636e72;
    font-size: 0.9rem;
    margin: 5px 0;
  }

  .category {
    display: inline-block;
    padding: 3px 8px;
    background: #f1f2f6;
    border-radius: 12px;
    font-size: 0.8rem;
    color: #2d3436;
    margin-bottom: 8px;
  }

  .price {
    color: #6c5ce7;
    font-weight: 600;
    font-size: 1.2rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const IconButton = styled.button`
  background: ${props => props.variant === 'edit' ? '#f1f2f6' : '#ffe0e0'};
  color: ${props => props.variant === 'edit' ? '#2d3436' : '#f44336'};
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  &:hover {
    opacity: 0.9;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;

  h2 {
    margin: 0 0 20px 0;
    color: #2d3436;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;

  input, textarea, select {
    padding: 8px 12px;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #6c5ce7;
    }
  }

  button {
    background: #6c5ce7;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      opacity: 0.9;
    }

    &:last-child {
      background: #e1e1e1;
      color: #2d3436;
    }
  }
`;

// Food categories
export const FOOD_CATEGORIES = [
  'All',
  'Popular',
  'Starters',
  'Main Course',
  'Biryani',
  'Breads',
  'Desserts',
  'Beverages'
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Main Course',
    isPopular: false
  });

  useEffect(() => {
    const initializeProducts = async () => {
      try {
        // First check if products already exist
        const snapshot = await getDocs(collection(db, 'products'));
        if (snapshot.empty) {
          // If no products exist, add the initial menu items from Home.js
          const initialMenuItems = [
            {
              name: "Delicious Burger",
              price: 199,
              category: "Fast Food",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.c1cuRN3nc_Y4c8_gVf9uLgHaJQ&pid=Api",
              rating: 4.5,
              isPopular: true
            },
            {
              name: "Classic Pizza",
              price: 299,
              category: "Fast Food",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.nh5Yw1jvcHqfoDPk0OIRAgHaFj&pid=Api",
              rating: 4.3,
              isPopular: true
            },
            {
              name: "Grilled Chicken",
              price: 349,
              category: "Non-Veg",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.TyFXb0SqI3Im2zsEOAcqEwHaLH&pid=Api",
              rating: 4.6,
              isPopular: true
            },
            {
              name: "Pasta Alfredo",
              price: 249,
              category: "Italian",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.MVNfilaauZwJGEE5gVFuXAHaLJ&pid=Api",
              rating: 4.4
            },
            {
              name: "Sushi Roll",
              price: 399,
              category: "Japanese",
              imageUrl: "https://tse1.mm.bing.net/th?id=OIP.5aV5O-VgR9PXsYsFtTNhJgHaLH&pid=Api",
              rating: 4.7,
              isPopular: true
            },
            {
              name: "Caesar Salad",
              price: 179,
              category: "Healthy",
              imageUrl: "https://tse4.mm.bing.net/th?id=OIP.Fy5mOQwXVZP68f_AfAT0IgHaE8&pid=Api",
              rating: 4.2
            },
            {
              name: "Grilled Steak",
              price: 499,
              category: "Non-Veg",
              imageUrl: "https://tse1.mm.bing.net/th?id=OIP.3kz-6uWLY5P9zB0Dvn7kNAHaLH&pid=Api",
              rating: 4.8,
              isPopular: true
            },
            {
              name: "Chocolate Cake",
              price: 149,
              category: "Desserts",
              imageUrl: "https://tse1.mm.bing.net/th?id=OIP.UX8X30Ne0QhC17mR7O4FsgHaLH&pid=Api",
              rating: 4.5
            },
            {
              name: "Fish & Chips",
              price: 279,
              category: "Seafood",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.3kI-XF8NlMZ94jd6KVuJ6QHaE8&pid=Api",
              rating: 4.3
            },
            {
              name: "Pancakes",
              price: 159,
              category: "Breakfast",
              imageUrl: "https://tse4.mm.bing.net/th?id=OIP.AzMOId0j7EFP-rDfF1rxkgHaE8&pid=Api",
              rating: 4.4
            },
            {
              name: "Club Sandwich",
              price: 129,
              category: "Fast Food",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.5OlT3_nySmO0X-AiGomIjQHaE8&pid=Api",
              rating: 4.2
            },
            {
              name: "Ramen Bowl",
              price: 259,
              category: "Japanese",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.-Dth9nEyXY8oQC9ykGeDrwHaLH&pid=Api",
              rating: 4.6,
              isPopular: true
            },
            {
              name: "Ice Cream Sundae",
              price: 99,
              category: "Desserts",
              imageUrl: "https://tse1.mm.bing.net/th?id=OIP.UqgNssHz-NNxV_B23YYGTQHaLH&pid=Api",
              rating: 4.5
            },
            {
              name: "Chicken Wings",
              price: 299,
              category: "Non-Veg",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.WqfGXpR02l_NnzLEnp4RxQHaLH&pid=Api",
              rating: 4.7,
              isPopular: true
            },
            {
              name: "Smoothie Bowl",
              price: 189,
              category: "Healthy",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.vCE8VGSCk5BfjdRhQUZ_cAHaLH&pid=Api",
              rating: 4.3
            },
            {
              name: "Paneer Tikka",
              price: 249,
              category: "Veg",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.MCstxoNRNrCKJWBewkuIwQHaE8&pid=Api",
              rating: 4.6,
              isPopular: true,
              isVeg: true
            },
            {
              name: "Veg Biryani",
              price: 199,
              category: "Veg",
              imageUrl: "https://tse4.mm.bing.net/th?id=OIP.6q01RPAXoVBhTBT5wYFZ8QHaE7&pid=Api",
              rating: 4.4,
              isVeg: true
            },
            {
              name: "Dal Makhani",
              price: 179,
              category: "Veg",
              imageUrl: "https://tse4.mm.bing.net/th?id=OIP.PGpj1WTpZ5y1xbdcW_sweAHaE8&pid=Api",
              rating: 4.5,
              isVeg: true
            },
            {
              name: "Mushroom Masala",
              price: 219,
              category: "Veg",
              imageUrl: "https://tse2.mm.bing.net/th?id=OIP.K4bQZE0c1wbjk_Z7G4z5WAHaE8&pid=Api",
              rating: 4.3,
              isVeg: true
            },
            {
              name: "Palak Paneer",
              price: 229,
              category: "Veg",
              imageUrl: "https://tse3.mm.bing.net/th?id=OIP.Qq4YUwZQfwQs4RXhX5UQqwHaE8&pid=Api",
              rating: 4.7,
              isPopular: true,
              isVeg: true
            },
            {
              name: "Veg Spring Rolls",
              price: 149,
              category: "Veg",
              imageUrl: "https://tse4.mm.bing.net/th?id=OIP.8R_5_YKLWUYdBwVFVBLzNwHaE8&pid=Api",
              rating: 4.2,
              isVeg: true
            }
          ];

          // Add each menu item to Firestore
          const batch = writeBatch(db);
          initialMenuItems.forEach((item) => {
            const docRef = doc(collection(db, 'products'));
            batch.set(docRef, {
              ...item,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
          await batch.commit();
        }
        
        // Now fetch all products
        fetchProducts();
      } catch (error) {
        console.error('Error initializing products:', error);
        setLoading(false);
      }
    };

    initializeProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      category: 'Main Course',
      isPopular: false
    });
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category || 'Main Course',
      isPopular: product.isPopular || false
    });
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        category: formData.category,
        isPopular: formData.isPopular,
        updatedAt: new Date()
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setProducts(products.map(p => 
          p.id === editingProduct.id 
            ? { ...p, ...productData }
            : p
        ));
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date()
        });
        setProducts([...products, { id: docRef.id, ...productData }]);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <h1>Product Management</h1>
        <AddButton onClick={handleAddProduct}>
          <FaPlus /> Add Product
        </AddButton>
      </Header>

      <TopControls>
        <SearchBar>
          <FaSearch color="#636e72" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>

        <CategorySelect
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {FOOD_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </CategorySelect>
      </TopControls>

      <ProductGrid>
        {filteredProducts.map(product => (
          <ProductCard key={product.id}>
            <ProductImage src={product.imageUrl} />
            <ProductInfo>
              <span className="category">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">{formatCurrency(product.price)}</p>
              <ActionButtons>
                <IconButton
                  variant="edit"
                  onClick={() => handleEditProduct(product)}
                >
                  <FaEdit /> Edit
                </IconButton>
                <IconButton
                  variant="delete"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <FaTrash /> Delete
                </IconButton>
              </ActionButtons>
            </ProductInfo>
          </ProductCard>
        ))}
      </ProductGrid>

      {showModal && (
        <Modal>
          <ModalContent>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <Form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {FOOD_CATEGORIES.filter(cat => cat !== 'All').map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                />
                Mark as Popular
              </label>
              <button type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Products;
