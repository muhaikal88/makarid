import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Auth
    login: "Login",
    email: "Email",
    password: "Password",
    loginTitle: "Super Admin Login",
    loginSubtitle: "Enter your credentials to access the dashboard",
    loginButton: "Sign In",
    loginError: "Invalid email or password",
    logout: "Logout",
    
    // Navigation
    dashboard: "Dashboard",
    companies: "Companies",
    users: "Users",
    settings: "Settings",
    profile: "Profile",
    
    // Dashboard
    welcomeBack: "Welcome back",
    dashboardOverview: "Dashboard Overview",
    totalCompanies: "Total Companies",
    activeCompanies: "Active Companies",
    totalUsers: "Total Users",
    totalEmployees: "Total Employees",
    recentCompanies: "Recent Companies",
    viewAll: "View All",
    noCompanies: "No companies yet",
    
    // Companies
    companyManagement: "Company Management",
    addCompany: "Add Company",
    editCompany: "Edit Company",
    deleteCompany: "Delete Company",
    companyName: "Company Name",
    domain: "Domain",
    address: "Address",
    phone: "Phone",
    active: "Active",
    inactive: "Inactive",
    employees: "Employees",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete",
    deleteWarning: "This action cannot be undone. All associated users will also be deleted.",
    companyCreated: "Company created successfully",
    companyUpdated: "Company updated successfully",
    companyDeleted: "Company deleted successfully",
    
    // Users
    userManagement: "User Management",
    addUser: "Add User",
    editUser: "Edit User",
    deleteUser: "Delete User",
    name: "Name",
    role: "Role",
    company: "Company",
    admin: "Admin",
    employee: "Employee",
    selectCompany: "Select Company",
    selectRole: "Select Role",
    userCreated: "User created successfully",
    userUpdated: "User updated successfully",
    userDeleted: "User deleted successfully",
    
    // Status
    status: "Status",
    createdAt: "Created At",
    updatedAt: "Updated At",
    
    // Common
    search: "Search",
    filter: "Filter",
    loading: "Loading...",
    noData: "No data available",
    error: "An error occurred",
    success: "Success",
    confirm: "Confirm",
    logoUrl: "Logo URL",
  },
  id: {
    // Auth
    login: "Masuk",
    email: "Email",
    password: "Kata Sandi",
    loginTitle: "Login Super Admin",
    loginSubtitle: "Masukkan kredensial Anda untuk mengakses dashboard",
    loginButton: "Masuk",
    loginError: "Email atau kata sandi salah",
    logout: "Keluar",
    
    // Navigation
    dashboard: "Dasbor",
    companies: "Perusahaan",
    users: "Pengguna",
    settings: "Pengaturan",
    profile: "Profil",
    
    // Dashboard
    welcomeBack: "Selamat datang kembali",
    dashboardOverview: "Ringkasan Dasbor",
    totalCompanies: "Total Perusahaan",
    activeCompanies: "Perusahaan Aktif",
    totalUsers: "Total Pengguna",
    totalEmployees: "Total Karyawan",
    recentCompanies: "Perusahaan Terbaru",
    viewAll: "Lihat Semua",
    noCompanies: "Belum ada perusahaan",
    
    // Companies
    companyManagement: "Manajemen Perusahaan",
    addCompany: "Tambah Perusahaan",
    editCompany: "Edit Perusahaan",
    deleteCompany: "Hapus Perusahaan",
    companyName: "Nama Perusahaan",
    domain: "Domain",
    address: "Alamat",
    phone: "Telepon",
    active: "Aktif",
    inactive: "Tidak Aktif",
    employees: "Karyawan",
    actions: "Aksi",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    confirmDelete: "Apakah Anda yakin ingin menghapus",
    deleteWarning: "Tindakan ini tidak dapat dibatalkan. Semua pengguna terkait juga akan dihapus.",
    companyCreated: "Perusahaan berhasil dibuat",
    companyUpdated: "Perusahaan berhasil diperbarui",
    companyDeleted: "Perusahaan berhasil dihapus",
    
    // Users
    userManagement: "Manajemen Pengguna",
    addUser: "Tambah Pengguna",
    editUser: "Edit Pengguna",
    deleteUser: "Hapus Pengguna",
    name: "Nama",
    role: "Peran",
    company: "Perusahaan",
    admin: "Admin",
    employee: "Karyawan",
    selectCompany: "Pilih Perusahaan",
    selectRole: "Pilih Peran",
    userCreated: "Pengguna berhasil dibuat",
    userUpdated: "Pengguna berhasil diperbarui",
    userDeleted: "Pengguna berhasil dihapus",
    
    // Status
    status: "Status",
    createdAt: "Dibuat Pada",
    updatedAt: "Diperbarui Pada",
    
    // Common
    search: "Cari",
    filter: "Filter",
    loading: "Memuat...",
    noData: "Tidak ada data",
    error: "Terjadi kesalahan",
    success: "Berhasil",
    confirm: "Konfirmasi",
    logoUrl: "URL Logo",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'id';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'id' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
